# Suno Remix at Home

A minimal Python script to remix your MP3 files using Suno's AI API.

## Quick Start

```bash
# 1. Set up virtual environment
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Set your API key (copy .env.example to .env first)
cp .env.example .env
# Edit .env with your SUNO_API_KEY

# 3. Configure tracks in remix.py
# Edit the TRACKS list with your audio URLs and preferences

# 4. Run the script
python remix.py
```

## What It Does

- 🎵 Takes MP3/WAV files hosted on GitHub
- 🤖 Sends them to Suno for AI remixing  
- ⏳ Polls for completion (30s intervals)
- 💾 Downloads remixed files locally

## Requirements

- Python 3.10+
- Suno API key from [sunoapi.org](https://sunoapi.org)
- Public GitHub repository for audio files

## Output

- `remix_results.json` - API response data
- `remixes/` folder - Downloaded MP3 files

## Environment Setup

The script uses environment variables for security:

```bash
# Local development
SUNO_API_KEY=your_key_here

# GitHub Actions (automatic)
# Set SUNO_API_KEY in repo secrets
```

## Configuration

Edit `remix.py` to configure your tracks:

```python
TRACKS = [
    {
        "uploadUrl": "https://raw.githubusercontent.com/USER/REPO/main/song.mp3",
        "title": "My Remix",
        "style": "Electronic, Synth Pop", 
        "prompt": "Transform into an upbeat electronic remix",
    },
]
```

## Credits

The script checks your remaining credits before starting. Remix jobs require multiple credits - top up at [sunoapi.org](https://sunoapi.org) if needed.
