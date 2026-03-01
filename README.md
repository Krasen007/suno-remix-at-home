# Suno Remix at Home

A powerful tool to remix your MP3 files using Suno's AI API. Now featuring a modern web interface with localStorage-based persistence and secure API key management.

![Suno Remix Dashboard](preview.png)

## 🚀 Real-World Usage Guide

### 🎯 Quick Start (Recommended)
```bash
# 1. Set up environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate.bat  # Windows CMD

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the application
python server.py
```

Visit **[http://localhost:5000](http://localhost:5000)** and start using the web interface immediately.

### � API Key Setup (Critical First Step)

**Option 1: Web Interface (Easiest)**
1. Open http://localhost:5000
2. Click the "Suno API Key" field
3. Paste your Suno API key from [sunoapi.org](https://sunoapi.org)
4. Click "💾 Save" - your key is stored locally in your browser


### 🎵 Audio File Setup

**Method 1: Any Public Hosting (Recommended)**
1. Upload your MP3/WAV to any public service (Dropbox, Google Drive, personal website, etc.)
2. Copy the public URL
3. Paste in the "Audio URL" field in the web interface

**Method 2: GitHub Integration (Advanced)**
1. Upload files manually to a public GitHub repository
2. Click the file, then click "Raw"
3. Copy the URL and paste in the web interface

### 🎛️ Important Real-World Notes

#### ⚠️ API Key Reality
- **No GitHub token needed** for basic usage - only Suno API key is required
- **Browser storage** is secure and private to your device
- **Environment variables** are optional for advanced users only
- **Most users** will use the web interface with browser-stored keys

#### 🌐 Hosting Flexibility
- **GitHub integration** is optional - you can use any hosting service
- **Local processing** works perfectly for offline use
- **Mixed approach** - use GitHub for some tracks, local URLs for others
- **No vendor lock-in** - the application works with any public URL

#### 💾 Data Management
- **Automatic downloads** protect against expired Suno links (15-day limit)
- **Browser localStorage** provides persistent history across sessions
- **No server files** - everything stays on your local machine
- **Export capability** - your `remixes/` folder contains all downloaded files

### 🎯 Typical Workflow

1. **Start server**: `python server.py`
2. **Open browser**: Navigate to localhost:5000
3. **Enter API key**: First-time setup takes 30 seconds
4. **Add tracks**: Configure multiple songs in one session
5. **Process**: Click "🎵 Start Remix" and watch real-time progress
6. **Access results**: Play immediately, download permanently
7. **History**: All past sessions available in "Past Remixes" tab

### � Advanced Configuration

#### Custom Styles (Examples)
```
80s synth, upbeat, high energy
lo-fi hip hop, chill vibes
rock anthem, powerful drums
acoustic folk, storytelling
```

#### Generation Parameters
- **Custom Mode**: Extend/modify existing music
- **Instrumental**: Remove vocals for karaoke/backing tracks
- **Model**: Choose V5 for latest quality

---

## 🛠️ Technical Details

### 📂 Data Storage
- **Browser localStorage**: API keys and history (secure, client-side)
- **Local files**: `remixes/` folder for permanent MP3 storage
- **No server persistence**: Stateless design for privacy and performance

### 🔐 Security Model
- **Client-side keys**: Never transmitted to server logs
- **Session-based auth**: Temporary tokens only during processing
- **HTTPS only**: All API calls use encrypted connections
- **No key exposure**: API keys hidden from browser dev tools

---

**Start using the web interface immediately - it's designed for real-world usage!** 🚀
