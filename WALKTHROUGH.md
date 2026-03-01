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

You have **two options** for managing your Suno API key:

#### Option A: GUI Configuration (Recommended)

1. Start the server and visit **[http://localhost:5000](http://localhost:5000)**
2. Enter your Suno API key in the **"Suno API Key"** field in the Configuration section
3. Click **"💾 Save"** or press Enter
4. Your key is stored locally in your browser and automatically used for all API calls
5. Credits automatically refresh when you save a new key

#### Option B: Environment Variable (Traditional)

Obtain your key from [sunoapi.org](https://sunoapi.org) and add it to your `.env` file:

```env
SUNO_API_KEY=your_key_here
```

> [!CAUTION]
> **SECURITY WARNING**: Your `.env` file contains sensitive API keys and **MUST NEVER** be committed to version control (Git).
>
> - Ensure `.env` is listed in your `.gitignore`.
> - If you accidentally expose your key, rotate/regenerate it immediately on [sunoapi.org](https://sunoapi.org).
> - For production environments, use a secure secret manager.
> 
> **GUI Storage**: When using the GUI option, your API key is stored in your browser's localStorage and never transmitted to the server except for API requests.

### 3. Audio Preparation

The Suno API requires a public URL to download your source audio. You have two ways to provide this:

#### Option A: Dashboard Upload (Recommended)

Go to GitHub Settings > Developer Settings > Personal Access Tokens (Tokens classic) and generate a token with the repo scope.

1.  Configure your GitHub details in `.env` (`GITHUB_TOKEN`, `GITHUB_OWNER`, etc.).
2.  In the Web Dashboard, click the **"📤 Upload"** button next to the Audio URL field.
3.  Select your local MP3/WAV file.
4.  The server will automatically host it on GitHub and fill in the URL for you.

#### Option B: Manual GitHub Hosting

1.  Upload your MP3 to a public GitHub repo manually.
2.  Click the file, then click **"Raw"**.
3.  Copy the URL (it should look like `https://raw.githubusercontent.com/...`).

### 4. Launching the Dashboard

Start the local development server:

```bash
python server.py
```

Visit **[http://localhost:5000](http://localhost:5000)** to access the interface.

## 🖥️ Using Dashboard

### Configuration Section
- **API Key Management**: Enter and save your Suno API key directly in the interface
- **Add Tracks**: Increase the number of tracks to process in a single session
- **Track Settings**:
  - **Title**: What the remix will be named
  - **Audio URL**: GitHub raw URL or use the upload button
  - **Style**: Comma-separated descriptors (e.g., `80s synth, upbeat, high energy`)
  - **Lyrics/Prompt**: Instructions for the AI remix
  - **Toggles**: Enable "Custom Mode" or "Instrumental" as needed

### Real-time Features
- **Credits Badge**: Shows your current Suno API balance (auto-refreshes when API key changes)
- **Server Status**: Displays connection status to the backend
- **Terminal Output**: Monitor "PENDING" → "TEXT_SUCCESS" → "SUCCESS" statuses in real-time
- **Live Streaming**: Watch progress updates without page refresh

### Results & History
- **Current Results**: Play and download completed remix variants immediately
- **Cover Art**: View generated artwork alongside audio variants
- **Local History**: Access all past remixes from the archive below main results
- **Persistent Storage**: Files saved to `remixes/` folder and `history.json` for permanent access

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
