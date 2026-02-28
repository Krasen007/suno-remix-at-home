# Suno Remix at Home - Walkthrough

A professional dashboard and CLI tool to remix your MP3 files using Suno's AI API.

## 🌟 How It Works

1.  **Hosting**: You host your MP3/WAV files on a public GitHub repository.
2.  **Request**: You provide the GitHub Raw URL and your desired musical style through the web dashboard.
3.  **Authentication**: The server uses your Suno API Key to submit a "cover" request.
4.  **Processing**: Suno's AI generates multiple remix variants.
5.  **Streaming**: The server polls the API and streams live logs to your browser.
6.  **Archiving**: Completed remixes are automatically downloaded to your local `remixes/` folder and saved to `history.json` for permanent access.

## 🛠️ Step-by-Step Setup

### 1. Environment Activation

```bash
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. API Key Configuration

Obtain your key from [sunoapi.org](https://sunoapi.org) and add it to your `.env` file:

```env
SUNO_API_KEY=your_key_here
```

### 3. Audio Preparation

The Suno API requires a public URL to download your source audio.

1.  Upload your MP3 to a public GitHub repo.
2.  Click the file, then click **"Raw"**.
3.  Copy the URL (it should look like `https://raw.githubusercontent.com/...`).

### 4. Launching the Dashboard

Start the local development server:

```bash
python server.py
```

Visit **[http://localhost:5000](http://localhost:5000)** to access the interface.

## 🖥️ Using the Dashboard

- **Add Tracks**: Increase the number of tracks to process in a single session.
- **Config Settings**:
  - **Title**: What the remix will be named.
  - **Lyrics**: Input the lyrics or instructions for the remix.
  - **Style**: Comma-separated descriptors (e.g., `80s synth, upbeat, high energy`).
  - **Toggles**: Enable "Custom Mode" or "Instrumental" as needed.
- **Terminal Output**: Monitor the "PENDING" and "SUCCESS" statuses in real-time.
- **Local History**: Play back old remixes from the archive below the main results.

## 📂 Project Structure

- `server.py`: The lightweight Python server (no Flask/Node dependencies).
- `remix.py`: Standalone CLI script for automated jobs.
- `www/`: The pure JavaScript frontend.
- `remixes/`: Your permanent local audio library.
- `history.json`: The local data store for your persistent archive.

## ⚠️ Important Limitations

- **Credit Requirements**: Each remix consumes Suno API credits. Check your balance via the "Credits" badge in the UI.
- **Link Expiration**: Remote audio links from Suno usually expire after 15 days. **Suno Remix At Home** solves this by automatically downloading the files for you.
- **GitHub Limits**: Ensure your source file is under 100MB per GitHub's standard limits.

---

_Powered by Suno API | Built with Vanilla JS & Python_
