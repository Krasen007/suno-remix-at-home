#!/usr/bin/env python3
import requests
import time
import json
import os
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

# Simple .env loader
def load_env():
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value.strip("'\"")

load_env()

SUNO_API_KEY = os.getenv("SUNO_API_KEY")
BASE_URL = "https://api.sunoapi.org/api/v1"
HEADERS = {
    "Authorization": f"Bearer {SUNO_API_KEY}",
    "Content-Type": "application/json",
}

POLL_INTERVAL = 30
TIMEOUT_SECONDS = 600

def get_credits_data():
    if not SUNO_API_KEY:
        return None, "SUNO_API_KEY not set"
    try:
        response = requests.get(f"{BASE_URL}/generate/credit", headers=HEADERS)
        data = response.json()
        if data.get("code") == 200:
            return data["data"], None
        return None, data.get("msg", "Unknown error")
    except Exception as e:
        return None, str(e)

def submit_track(track):
    payload = {
        "uploadUrl": track["uploadUrl"],
        "customMode": track.get("customMode", True),
        "instrumental": track.get("instrumental", False),
        "model": track.get("model", "V5"),
        "style": track["style"],
        "title": track["title"],
        "prompt": track["prompt"],
    }
    response = requests.post(f"{BASE_URL}/generate/upload-cover", headers=HEADERS, json=payload)
    data = response.json()
    if data.get("code") == 200:
        return data["data"]["taskId"], None
    return None, data.get("msg", "Submit failed")

def download_audio(url, filename):
    os.makedirs("remixes", exist_ok=True)
    try:
        res = requests.get(url)
        if res.status_code == 200:
            path = f"remixes/{filename}.mp3"
            with open(path, "wb") as f:
                f.write(res.content)
            return path
    except:
        pass
    return None

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    pass

class RemixHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        
        if self.path == '/api/credits':
            credits, error = get_credits_data()
            if error:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": error}).encode())
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "credits": credits}).encode())
            return

        # Serve static files from 'www'
        full_path = os.path.join('www', self.path.lstrip('/'))
        if os.path.exists(full_path) and not os.path.isdir(full_path):
            self.send_response(200)
            if full_path.endswith(".html"): self.send_header('Content-Type', 'text/html')
            elif full_path.endswith(".css"): self.send_header('Content-Type', 'text/css')
            elif full_path.endswith(".js"): self.send_header('Content-Type', 'application/javascript')
            self.end_headers()
            with open(full_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404, "File not found")

    def do_POST(self):
        if self.path == '/api/remix':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            tracks = json.loads(post_data).get("tracks", [])

            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            for i, track in enumerate(tracks):
                self._send_sse('log', {'message': f"[{i+1}/{len(tracks)}] Processing: {track['title']}", 'level': 'info'})
                
                task_id, error = submit_track(track)
                if error:
                    self._send_sse('log', {'message': f"Error: {error}", 'level': 'error'})
                    continue
                
                self._send_sse('log', {'message': f"Task ID: {task_id}. Polling...", 'level': 'info'})
                
                deadline = time.time() + TIMEOUT_SECONDS
                while time.time() < deadline:
                    poll = requests.get(f"{BASE_URL}/generate/record-info", params={"taskId": task_id}, headers=HEADERS)
                    poll_data = poll.json()
                    status = poll_data.get("data", {}).get("status", "UNKNOWN")
                    
                    self._send_sse('log', {'message': f"Status: {status}", 'level': 'poll'})
                    
                    if status == "SUCCESS":
                        variants = poll_data["data"]["response"]["sunoData"]
                        for idx, v in enumerate(variants):
                            fname = f"{track['title']}_v{idx+1}"
                            path = download_audio(v['audioUrl'], fname)
                            if path:
                                self._send_sse('log', {'message': f"Saved: {path}", 'level': 'success'})
                        
                        self._send_sse('result', {'title': track['title'], 'variants': variants})
                        break
                    elif status == "FAILED":
                        err = poll_data.get("data", {}).get("errorMessage", "Unknown failure")
                        self._send_sse('log', {'message': f"Failed: {err}", 'level': 'error'})
                        break
                    
                    time.sleep(POLL_INTERVAL)
            
            self._send_sse('done', {})
        else:
            self.send_error(404)

    def _send_sse(self, event_type, data):
        payload = json.dumps({'type': event_type, **data})
        self.wfile.write(f"data: {payload}\n\n".encode())
        self.wfile.flush()

if __name__ == "__main__":
    if not SUNO_API_KEY:
        print("WARNING: SUNO_API_KEY not found in .env")
    
    port = 5000
    server = ThreadingHTTPServer(('0.0.0.0', port), RemixHandler)
    print(f"Suno Remix Server running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
