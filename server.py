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

BASE_URL = "https://api.sunoapi.org/api/v1"

POLL_INTERVAL = 30
TIMEOUT_SECONDS = 600

def get_credits_data(api_key=None):
    # Only use user-provided API key, no .env fallback
    if not api_key:
        return None, "API key not provided"
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        response = requests.get(f"{BASE_URL}/generate/credit", headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == 200:
            return data["data"], None
        # Provide more specific error messages for common issues
        error_msg = data.get("msg", "Unknown error")
        if "invalid" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return None, "Invalid API key. Please check your Suno API key from sunoapi.org and try again."
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            return None, f"API quota exceeded: {error_msg}"
        elif "rate" in error_msg.lower():
            return None, f"Rate limit exceeded: {error_msg}. Please wait and try again."
        else:
            return None, f"API error: {error_msg}"
    except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
        logger.error(f"Credit check failed: {e}")
        return None, f"Request failed: {str(e)}"

def submit_track(track, api_key=None):
    # Only use user-provided API key, no .env fallback
    if not api_key:
        return None, "API key not provided"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
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
        response = requests.post(f"{BASE_URL}/generate/upload-cover", headers=headers, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == 200:
            return data["data"]["taskId"], None
        # Provide more specific error messages for common issues
        error_msg = data.get("msg", "Submit failed")
        if "invalid" in error_msg.lower() or "unauthorized" in error_msg.lower():
            return None, "Invalid API key. Please check your Suno API key from sunoapi.org and try again."
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            return None, f"API quota exceeded: {error_msg}"
        elif "rate" in error_msg.lower():
            return None, f"Rate limit exceeded: {error_msg}. Please wait and try again."
        elif "url" in error_msg.lower() or "upload" in error_msg.lower():
            return None, f"Invalid audio URL: {error_msg}. Please ensure your audio URL is publicly accessible."
        else:
            return None, f"Submit failed: {error_msg}"
    except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
        logger.error(f"Submit failed: {e}")
        return None, f"Request failed: {str(e)}"

def save_to_history(result):
    with HISTORY_LOCK:
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"API History load failed: {e}")
                history = []
        
        # Add new result to history
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
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except OSError:
                    # Ignore removal error, original error is more important
                    pass
        
        # Return history for frontend localStorage storage
        return history

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
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.end_headers()

    def _send_sse(self, event_type, data):
        try:
            payload = json.dumps({'type': event_type, **data})
            self.wfile.write(f"data: {payload}\n\n".encode())
            self.wfile.flush()
        except (BrokenPipeError, OSError) as e:
            logger.debug(f"SSE client disconnected: {e}")

    def do_DELETE(self):
        decoded_path = urllib.parse.unquote(self.path)
        if decoded_path.startswith('/api/history/'):
            parts = decoded_path.rstrip('/').split('/')
            # Expected: ['', 'api', 'history', 'timestamp', 'variant_id']
            if len(parts) < 4:
                self.send_error(400, "Missing timestamp")
                return
            
            try:
                timestamp_to_target = float(parts[3])
                variant_id = parts[4] if len(parts) > 4 else None
            except ValueError:
                self.send_error(400, "Invalid timestamp")
                return

            with HISTORY_LOCK:
                if os.path.exists(HISTORY_FILE):
                    try:
                        with open(HISTORY_FILE, "r") as f:
                            history = json.load(f)
                        
                        def delete_variant_file(v):
                            """Delete local file for a variant (legacy function)"""
                            logger.warning("delete_variant_file called but local files are not supported")
                            return

                        initial_history_len = len(history)
                        new_history = []
                        
                        for item in history:
                            if abs(item.get("timestamp", 0) - timestamp_to_target) < 0.001:
                                if variant_id:
                                    # Target specific variant
                                    variants_to_keep = []
                                    for v in item.get("variants", []):
                                        if v.get("id") == variant_id:
                                            delete_variant_file(v)
                                        else:
                                            variants_to_keep.append(v)
                                    item["variants"] = variants_to_keep
                                    # Only keep the group if variants remain
                                    if item["variants"]:
                                        new_history.append(item)
                                else:
                                    # Delete entire group: delete all its local files
                                    for v in item.get("variants", []):
                                        delete_variant_file(v)
                            else:
                                new_history.append(item)
                        
                        # Save updated history
                        temp_file = f"{HISTORY_FILE}.tmp"
                        with open(temp_file, "w") as f:
                            json.dump(new_history, f, indent=2)
                        os.replace(temp_file, HISTORY_FILE)
                        
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    except (json.JSONDecodeError, OSError) as e:
                        logger.error(f"Failed to delete from history: {e}")
                        self.send_error(500, "Internal Server Error")
                else:
                    self.send_error(404, "History file not found")
            return
        self.send_error(404)

    def do_GET(self):
        decoded_path = urllib.parse.unquote(self.path)
        
        if decoded_path == '/':
            decoded_path = '/index.html'
        
        # Add health check endpoint
        if decoded_path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            return
        
        # Remove credits endpoint from GET - it's now POST only
        # if decoded_path == '/api/credits':

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

        # Serve static files from 'www' only
        if decoded_path.startswith('/remixes/'):
            self.send_error(404, "Local file serving not supported. Use Suno URLs directly.")
            return

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
        if self.path == '/api/credits':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
            
            api_key = None
            try:
                if post_data:
                    data = json.loads(post_data)
                    api_key = data.get('apiKey')
            except json.JSONDecodeError:
                pass
            
            credits, error = get_credits_data(api_key)
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
                request_data = json.loads(post_data)
                tracks = request_data.get("tracks", [])
                api_key = request_data.get("apiKey")
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.send_error(400, "Invalid JSON")
                return

            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            # Credit Guard
            credits_data, error = get_credits_data(api_key)
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
                
                task_id, error = submit_track(track, api_key)
                if error:
                    self._send_sse('log', {'message': f"Error: {error}", 'level': 'error'})
                    continue
                
                self._send_sse('log', {'message': f"Task ID: {task_id}. Polling...", 'level': 'info'})
                
                deadline = time.time() + TIMEOUT_SECONDS
                while time.time() < deadline:
                    try:
                        # Use user-provided API key only
                        poll_headers = {
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        }
                        poll = requests.get(f"{BASE_URL}/generate/record-info", params={"taskId": task_id}, headers=poll_headers, timeout=REQUEST_TIMEOUT)
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
                            # Use Suno's URL directly instead of downloading
                            if v.get('audioUrl'):
                                v_copy = v.copy()
                                v_copy["localUrl"] = v["audioUrl"]  # Direct Suno URL
                                self._send_sse('log', {'message': f"Using Suno URL: {v['audioUrl']}", 'level': 'info'})
                                updated_variants.append(v_copy)
                            else:
                                # No download functionality - only use direct URLs
                                v_copy = v.copy()
                                v_copy["localUrl"] = v.get('audioUrl', '')  # Use provided URL directly
                                self._send_sse('log', {'message': f"Using provided URL: {v.get('audioUrl', '')}", 'level': 'info'})
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
            # GitHub upload endpoint removed - return 404
            self.send_error(404)
        else:
            self.send_error(404)

if __name__ == "__main__":
    port = 5000
    server = ThreadingHTTPServer(('0.0.0.0', port), RemixHandler)
    print(f"Suno Remix Server running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
