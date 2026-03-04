#!/usr/bin/env python3
"""
Suno Remix Script - Submit remix jobs to Suno API and poll for completion.
"""

import requests
import time
import json
import os
import sys

SUNO_API_KEY = os.getenv("SUNO_API_KEY")
BASE_URL = "https://api.sunoapi.org/api/v1"

TRACKS = [
    {
        "uploadUrl": "https://github.com/Krasen007/suno-remix-at-home/raw/refs/heads/master/song%20uploads/fairytale%20solo.wav",
        "title": "Fairytale Solo From API",
        "style": "guitar, epic solo",
        "prompt": "Transform into an epic guitar solo with delay and effects",
    },
]

HEADERS = {
    "Authorization": f"Bearer {SUNO_API_KEY}",
    "Content-Type": "application/json",
}

POLL_INTERVAL = 30
TIMEOUT_SECONDS = 600


def check_credits():
    """Check remaining Suno API credits."""
    print(f"[API] Checking credits...")
    
    response = requests.get(f"{BASE_URL}/generate/credit", headers=HEADERS)
    
    if response.status_code == 401:
        raise Exception("API error 401: Invalid API key. Check SUNO_API_KEY.")
    
    data = response.json()
    
    if data.get("code") != 200:
        raise Exception(f"API error: {data.get('msg', 'Unknown error')}")
    
    credits = data["data"]
    print(f"[API] Remaining credits: {credits}")
    return credits


def submit_remix(track):
    """Submit a remix job to Suno API."""
    print(f"[API] Submitting remix: {track['title']}")
    
    payload = {
        "uploadUrl": track["uploadUrl"],
        "customMode": True,
        "instrumental": False,
        "model": "V5",
        "style": track["style"],
        "title": track["title"],
        "prompt": track["prompt"],
    }
    
    response = requests.post(
        f"{BASE_URL}/generate/upload-cover",
        headers=HEADERS,
        json=payload
    )
    
    if response.status_code == 400:
        raise Exception("API error 400: Bad request. Check parameters.")
    if response.status_code == 401:
        raise Exception("API error 401: Invalid API key.")
    if response.status_code == 413:
        raise Exception("API error 413: Payload too large. Trim prompt/style/title.")
    if response.status_code == 429:
        raise Exception("API error 429: Insufficient credits.")
    if response.status_code == 451:
        raise Exception("API error 451: Cannot download audio. Check GitHub URL is public.")
    if response.status_code == 500:
        raise Exception("API error 500: Server error. Retry after 30 seconds.")
    
    data = response.json()
    
    if data.get("code") != 200:
        raise Exception(f"Submit failed: {data.get('msg', 'Unknown error')}")
    
    task_id = data["data"]["taskId"]
    print(f"[API] Submitted -> task_id: {task_id}")
    return task_id


def poll_for_completion(task_id):
    """Poll for task completion until SUCCESS or FAILED."""
    print(f"[POLL] Waiting for task {task_id}...")
    deadline = time.time() + TIMEOUT_SECONDS
    
    while time.time() < deadline:
        response = requests.get(
            f"{BASE_URL}/generate/record-info",
            params={"taskId": task_id},
            headers=HEADERS
        )
        
        if response.status_code == 429:
            print(f"[POLL] Rate limited, waiting 30s...")
            time.sleep(POLL_INTERVAL)
            continue
        if response.status_code == 500:
            print(f"[POLL] Server error, retrying in 30s...")
            time.sleep(POLL_INTERVAL)
            continue
            
        data = response.json()
        status = data.get("data", {}).get("status", "UNKNOWN")
        
        print(f"[POLL] Status: {status}")
        
        if status == "SUCCESS":
            print(f"[DEBUG] Success response: {json.dumps(data, indent=2)}")
            tracks = data["data"]["response"]["sunoData"]
            return tracks, None
        elif status == "FAILED":
            error_msg = data.get("data", {}).get("errorMessage", "Unknown error")
            return None, f"Task failed: {error_msg}"
        
        time.sleep(POLL_INTERVAL)
    
    return None, "Timed out after 10 minutes"


def download_remix(audio_url, filename):
    """Download a remix MP3 to the remixes folder."""
    os.makedirs("remixes", exist_ok=True)
    
    print(f"[DOWNLOAD] Downloading {filename}...")
    response = requests.get(audio_url)
    
    if response.status_code != 200:
        print(f"[DOWNLOAD] Failed to download: {response.status_code}")
        return False
    
    path = f"remixes/{filename}.mp3"
    with open(path, "wb") as f:
        f.write(response.content)
    
    print(f"[DOWNLOAD] Saved: {path}")
    return True


def save_results(results):
    """Save results to a JSON file."""
    output_file = "remix_results.json"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"[OUTPUT] Results saved to {output_file}")
        return results
    except (OSError, IOError) as e:
        print(f"[ERROR] Failed to save results to {output_file}: {e}")
        return results
    except (TypeError, ValueError) as e:
        print(f"[ERROR] Failed to serialize results: {e}")
        return results


def main():
    """Main entry point."""
    print("=== Suno Remix Script ===\n")
    
    if not SUNO_API_KEY:
        print("ERROR: Please set SUNO_API_KEY environment variable")
        print("Create a .env file with your API key or set it in your shell")
        sys.exit(1)
    
    try:
        credits = check_credits()
        if credits <= 0:
            print("ERROR: No credits remaining")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    all_results = {}
    
    for i, track in enumerate(TRACKS):
        print(f"\n[{i+1}/{len(TRACKS)}] Processing: {track['title']}")
        
        try:
            task_id = submit_remix(track)
            variants, error = poll_for_completion(task_id)
            
            if error:
                print(f"ERROR: {error}")
                all_results[track["title"]] = {"error": error}
                continue
            
            for v in variants:
                print(f"  - {v['title']}")
                print(f"    Duration: {v.get('duration', 'N/A')}s")
                print(f"    URL: {v['audioUrl']}")
            
            if variants:
                for idx, v in enumerate(variants):
                    filename = f"{track['title']}_v{idx+1}"
                    download_remix(v['audioUrl'], filename)
            
            all_results[track["title"]] = variants
            
        except Exception as e:
            print(f"ERROR: {e}")
            all_results[track["title"]] = {"error": str(e)}
    
    save_results(all_results)
    
    print("\n=== Complete ===")


if __name__ == "__main__":
    main()
