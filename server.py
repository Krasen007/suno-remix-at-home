#!/usr/bin/env python3
import requests
import time
import json
import os
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
import threading
import logging
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
POLL_INTERVAL = 30
TIMEOUT_SECONDS = 600
REQUEST_TIMEOUT = 10
MAX_BODY_SIZE = 1024 * 512  # 512KB
HISTORY_FILE = "history.json"
HISTORY_LOCK = threading.Lock()
HISTORY_MAX_ENTRIES = 100
UPLOAD_TIMEOUT = 30
def load_env():
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Strip inline comments respecting quotes
                    new_val = []
                    in_quote = None
                    for char in value:
                        if char in ("'", '"'):
                            if in_quote == char: in_quote = None
                            elif in_quote is None: in_quote = char
                        elif char == "#" and in_quote is None:
                            break
                        new_val.append(char)
                    
                    value = "".join(new_val).strip().strip("'\"")
                    os.environ[key] = value

load_env()

SUNO_API_KEY = os.getenv("SUNO_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_OWNER = os.getenv("GITHUB_OWNER")
GITHUB_REPO = os.getenv("GITHUB_REPO")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

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
        response = requests.get(f"{BASE_URL}/generate/credit", headers=HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == 200:
            return data["data"], None
        return None, data.get("msg", "Unknown error")
    except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
        logger.error(f"Credit check failed: {e}")
        return None, f"Request failed: {str(e)}"

def submit_track(track):
    if not SUNO_API_KEY:
        return None, "SUNO_API_KEY not set"
    payload = {
        "uploadUrl": track["uploadUrl"],
        "customMode": track.get("customMode", True),
        "instrumental": track.get("instrumental", False),
        "model": track.get("model", "V5"),
        "style": track["style"],
        "title": track["title"],
        "prompt": track["prompt"],
        "callBackUrl": "https://httpbin.org/post"
    }
    try:
        response = requests.post(f"{BASE_URL}/generate/upload-cover", headers=HEADERS, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == 200:
            return data["data"]["taskId"], None
        return None, data.get("msg", "Submit failed")
    except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
        logger.error(f"Submit failed: {e}")
        return None, f"Request failed: {str(e)}"

def download_audio(url, filename):
    os.makedirs("remixes", exist_ok=True)
    # Sanitize filename
    safe_name = "".join(c for c in filename if c.isalnum() or c in (" ", "-", "_")).strip()
    if not safe_name: safe_name = "remix"
    
    local_path = os.path.normpath(os.path.join("remixes", f"{safe_name}.mp3"))
    base_dir = os.path.realpath("remixes")
    if not os.path.realpath(local_path).startswith(base_dir):
        logger.error("Attempted path traversal in download_audio")
        return None, None

    try:
        res = requests.get(url, timeout=REQUEST_TIMEOUT)
        res.raise_for_status()
        with open(local_path, "wb") as f:
            f.write(res.content)
        return local_path, f"/remixes/{urllib.parse.quote(safe_name)}.mp3"
    except (requests.exceptions.RequestException, OSError) as e:
        logger.error(f"Download failed for {url}: {e}")
    return None, None

def save_to_history(result):
    with HISTORY_LOCK:
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"History load failed: {e}")
                history = []
        
        result["timestamp"] = time.time()
        history.insert(0, result)
        
        # Prune history
        if len(history) > HISTORY_MAX_ENTRIES:
            history = history[:HISTORY_MAX_ENTRIES]
        
        # Atomic write
        temp_file = f"{HISTORY_FILE}.tmp"
        try:
            with open(temp_file, "w") as f:
                json.dump(history, f, indent=2)
            os.replace(temp_file, HISTORY_FILE)
        except OSError as e:
            logger.error(f"History save failed: {e}")
            if os.path.exists(temp_file): os.remove(temp_file)

def push_to_github(file_data, filename):
    if not all([GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO]):
        return None, "GitHub configuration missing in .env"
    
    # Sanitize github path
    safe_name = "".join(c for c in filename if c.isalnum() or c in (".", "-", "_")).strip()
    path = f"uploads/{int(time.time())}_{safe_name}"
    
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{path}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    encoded_content = base64.b64encode(file_data).decode("utf-8")
    payload = {
        "message": f"Upload audio: {filename}",
        "content": encoded_content,
        "branch": GITHUB_BRANCH
    }
    
    try:
        response = requests.put(url, headers=headers, json=payload, timeout=UPLOAD_TIMEOUT)
        if response.status_code in [200, 201]:
            raw_url = f"https://raw.githubusercontent.com/{GITHUB_OWNER}/{GITHUB_REPO}/{GITHUB_BRANCH}/{path}"
            return raw_url, None
        
        error_msg = response.json().get("message", "GitHub upload failed")
        return None, f"GitHub Error: {error_msg}"
    except Exception as e:
        logger.error(f"GitHub push failed: {e}")
        return None, str(e)

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
        decoded_path = urllib.parse.unquote(self.path)
        
        if decoded_path == '/':
            decoded_path = '/index.html'
        
        if decoded_path == '/api/credits':
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

        if decoded_path == '/api/history':
            with HISTORY_LOCK:
                history = []
                if os.path.exists(HISTORY_FILE):
                    try:
                        with open(HISTORY_FILE, "r") as f:
                            history = json.load(f)
                    except (json.JSONDecodeError, OSError) as e:
                        logger.error(f"API History load failed: {e}")
                        history = []
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(history).encode())
            return

        # Serve static files from 'www' or 'remixes'
        if decoded_path.startswith('/remixes/'):
            base_dir = os.path.realpath('remixes')
            relative_path = decoded_path[len('/remixes/'):]
        else:
            base_dir = os.path.realpath('www')
            relative_path = decoded_path.lstrip('/')
            
        normalized_path = os.path.normpath(relative_path.lstrip('/\\'))
        full_path = os.path.realpath(os.path.join(base_dir, normalized_path))
        
        if full_path.startswith(base_dir) and os.path.exists(full_path) and not os.path.isdir(full_path):
            self.send_response(200)
            if full_path.endswith(".html"): self.send_header('Content-Type', 'text/html')
            elif full_path.endswith(".css"): self.send_header('Content-Type', 'text/css')
            elif full_path.endswith(".js"): self.send_header('Content-Type', 'application/javascript')
            elif full_path.endswith(".mp3"): self.send_header('Content-Type', 'audio/mpeg')
            elif full_path.endswith(".png"): self.send_header('Content-Type', 'image/png')
            elif full_path.endswith(".jpg"): self.send_header('Content-Type', 'image/jpeg')
            else: self.send_header('Content-Type', 'application/octet-stream')
            self.end_headers()
            with open(full_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404, "File not found")

    def do_POST(self):
        if self.path == '/api/remix':
            content_length = self.headers.get('Content-Length')
            if not content_length:
                self.send_error(411, "Length Required")
                return
            
            try:
                content_length = int(content_length)
            except ValueError:
                self.send_error(400, "Invalid Content-Length")
                return
                
            if content_length > MAX_BODY_SIZE:
                self.send_error(413, "Request Entity Too Large")
                return
                
            try:
                post_data = self.rfile.read(content_length)
                tracks = json.loads(post_data).get("tracks", [])
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.send_error(400, "Invalid JSON")
                return

            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            # Credit Guard
            credits_data, error = get_credits_data()
            credits_value = None
            if credits_data is not None:
                if isinstance(credits_data, dict):
                    credits_value = credits_data.get("credits") or credits_data.get("credit")
                else:
                    credits_value = credits_data
            
            try:
                credits_value = float(credits_value) if credits_value is not None else None
            except (ValueError, TypeError):
                credits_value = None

            if error or (credits_value is not None and credits_value <= 0):
                msg = error if error else "Insufficient credits to start session."
                self._send_sse('log', {'message': f"Error: {msg}", 'level': 'error'})
                return

            for i, track in enumerate(tracks):
                self._send_sse('log', {'message': f"[{i+1}/{len(tracks)}] Processing: {track['title']}", 'level': 'info'})
                
                task_id, error = submit_track(track)
                if error:
                    self._send_sse('log', {'message': f"Error: {error}", 'level': 'error'})
                    continue
                
                self._send_sse('log', {'message': f"Task ID: {task_id}. Polling...", 'level': 'info'})
                
                deadline = time.time() + TIMEOUT_SECONDS
                while time.time() < deadline:
                    try:
                        poll = requests.get(f"{BASE_URL}/generate/record-info", params={"taskId": task_id}, headers=HEADERS, timeout=REQUEST_TIMEOUT)
                        poll.raise_for_status()
                        poll_data = poll.json()
                    except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
                        logger.error(f"Poll fail for {task_id}: {e}")
                        time.sleep(POLL_INTERVAL)
                        continue
                        
                    status = poll_data.get("data", {}).get("status", "UNKNOWN")
                    
                    self._send_sse('log', {'message': f"Status: {status}", 'level': 'poll'})
                    
                    if status == "SUCCESS":
                        data_root = poll_data.get("data", {})
                        variants = data_root.get("response", {}).get("sunoData", [])
                        images = data_root.get("images", [])
                        
                        updated_variants = []
                        for idx, v in enumerate(variants):
                            fname = f"{track['title']}_v{idx+1}"
                            path, local_url = download_audio(v['audioUrl'], fname)
                            v_copy = v.copy()
                            if local_url:
                                self._send_sse('log', {'message': f"Saved: {path}", 'level': 'success'})
                                v_copy["localUrl"] = local_url
                            updated_variants.append(v_copy)
                        
                        result_payload = {'title': track['title'], 'variants': updated_variants, 'images': images}
                        save_to_history(result_payload)
                        self._send_sse('result', result_payload)
                        break
                    elif status == "FAILED":
                        err = poll_data.get("data", {}).get("errorMessage", "Unknown failure")
                        self._send_sse('log', {'message': f"Failed: {err}", 'level': 'error'})
                        break
                    
                    time.sleep(POLL_INTERVAL)
            
            self._send_sse('done', {})
        elif self.path == '/api/upload-to-github':
            content_length = self.headers.get('Content-Length')
            if not content_length:
                self.send_error(411, "Length Required")
                return
            
            try:
                content_length = int(content_length)
            except ValueError:
                logger.error(f"Invalid Content-Length for upload: {content_length}")
                self.send_error(400, "Invalid Content-Length")
                return

            if content_length > 100 * 1024 * 1024:  # 100MB limit
                self.send_error(413, "File too large (100MB max)")
                return

            # Read multipart form data manually is painful, but we can assume a simplified upload
            # or use a library if we had one. Since we don't, we'll try to extract the file part.
            # Actually, let's just send the raw body if it's a simple binary blob with filename in header
            filename = self.headers.get('X-Filename', 'upload.mp3')
            file_data = self.rfile.read(content_length)
            
            raw_url, error = push_to_github(file_data, filename)
            
            if error:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": error}).encode())
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "url": raw_url}).encode())
        else:
            self.send_error(404)

    def _send_sse(self, event_type, data):
        try:
            payload = json.dumps({'type': event_type, **data})
            self.wfile.write(f"data: {payload}\n\n".encode())
            self.wfile.flush()
        except (BrokenPipeError, OSError) as e:
            logger.debug(f"SSE client disconnected: {e}")

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
