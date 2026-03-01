# Suno Remix at Home

A powerful tool to remix your MP3 files using Suno's AI API. Now featuring a modern web interface for easier configuration and persistent local history.

![Suno Remix Dashboard](preview.png)

## 🚀 Web Interface Quick Start

The recommended way to use Suno Remix is through the integrated dashboard.

```bash
# 1. Set up and Activate virtual environment
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Windows (CMD)
.venv\Scripts\activate.bat
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# 2. Set your API key
# Option A: GUI (Recommended) - Enter directly in the web interface
# Option B: Environment - Copy .env.example to .env and paste your SUNO_API_KEY

# 3. Start the Web Server
python server.py
```

Open your browser to: **[http://localhost:5000](http://localhost:5000)**

## ✨ Dashboard Features

### API Key Management
- **Backend-First Security**: API keys are handled server-side with environment variables
- **Secure Proxy**: Frontend calls your backend, which securely manages Suno API keys
- **Session-Based Auth**: Use httpOnly, Secure cookies or server-side sessions
- **Environment Variables**: Configure keys in `.env` file (never commit to VCS)
- **No Client Exposure**: Raw API keys are never sent to the browser

### Dynamic Track Management
- **Multi-Track Processing**: Add and configure multiple tracks in a single session
- **Custom Mode & Instrumentals**: Full control over Suno's generation parameters
- **File Upload**: Direct upload to GitHub integration for easy audio hosting
- **Real-time Validation**: Instant feedback on track configuration

### Real-time Monitoring
- **Live Terminal**: Watch the API polling and download progress live
- **Status Updates**: Track "PENDING" → "TEXT_SUCCESS" → "SUCCESS" progression
- **Credits Display**: Current Suno API balance always visible
- **Server Health**: Connection status indicator

### Local Persistence
- **Auto-Download**: Files are saved to the `remixes/` folder automatically
- **Cover Art**: View generated artwork alongside your variants
- **History Browser**: Local history stored in `history.json` for permanent access
- **Expired Link Protection**: Play your local copies even after API links expire (15 days)

## 💾 Requirements

- Python 3.10+
- Suno API key from [sunoapi.org](https://sunoapi.org)
- Public GitHub repository raw URLs for audio files

## 🛠️ CLI Usage (Legacy)

If you prefer the command line, you can still use the standalone script:

1. Configure `TRACKS` in `remix.py`.
2. Run `python remix.py`.

## 📂 Output Structure

- `remixes/` - Your downloaded MP3 files (permanent).
- `history.json` - Complete local archive of your remix sessions.
- `remix_results.json` - Raw API output from the latest CLI run.

---

_Note: Suno API links expire after 15 days. Use the "Past Remixes" section in the dashboard to play your permanent local copies._
