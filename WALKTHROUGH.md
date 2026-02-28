# Suno Remix at Home - Walkthrough

A minimal Python script to remix your MP3 files using Suno's AI API.

## What This Does

1. Takes MP3 files you host on GitHub
2. Sends them to Suno for AI remixing
3. Polls for completion
4. Downloads the remixed MP3s locally

## Quick Start

### 1. Set Up Virtual Environment

```bash
# Activate the virtual environment
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Get Your Suno API Key

1. Go to [sunoapi.org](https://sunoapi.org)
2. Get an API key from your dashboard

### 3. Host Your MP3 on GitHub

1. Create a public GitHub repo
2. Add your MP3 file
3. Click "Raw" to get the URL
4. Example: `https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/song.mp3`

### 4. Configure the Script

Open `remix.py` and edit:

```python
SUNO_API_KEY = "your-api-key-here"

TRACKS = [
    {
        "uploadUrl": "https://raw.githubusercontent.com/YOU/REPO/main/song.mp3",
        "title": "My Remix",
        "style": "Electronic, Synth Pop",
        "prompt": "Transform into an upbeat electronic remix",
    },
]
```

### 5. Run It

Make sure your virtual environment is activated (you should see `(.venv)` in your terminal), then:

```bash
python remix.py
```

## Configuration Options

| Parameter | Description |
|-----------|-------------|
| `SUNO_API_KEY` | Your Suno API key |
| `BASE_URL` | API endpoint (default: https://api.sunoapi.org/api/v1) |
| `TRACKS` | List of tracks to remix |

### Track Settings

| Field | Description |
|-------|-------------|
| `uploadUrl` | GitHub Raw URL of your MP3 |
| `title` | Title for the remix |
| `style` | Genre/style description |
| `prompt` | Instructions for the AI |

## Output

After running, you'll get:

- `remix_results.json` - Full results with audio URLs
- `remixes/` folder - Downloaded MP3 files

## API Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 400 | Bad request | Check parameters |
| 401 | Invalid API key | Check SUNO_API_KEY |
| 413 | Payload too long | Trim prompt/style/title |
| 429 | No credits | Buy more credits |
| 451 | Can't download audio | Make GitHub repo PUBLIC |
| 500 | Server error | Retry after 30s |

## Important Notes

- **Polling**: Script waits 30 seconds between checks (avoid rate limits)
- **Timeout**: Max 10 minutes per track
- **Audio expiry**: Download remixes within 15 days - Suno deletes them after that
- **File size**: Max 100MB per MP3 (GitHub limit)
