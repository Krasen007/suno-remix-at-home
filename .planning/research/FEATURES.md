# Feature Landscape

**Domain:** Local Python script for AI audio remix
**Researched:** 2026-02-28

## Table Stakes

Features users expect for a working remix script.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Check API credits | Know if you can generate | Low | GET request to /get-credits |
| Submit remix job | Core functionality | Low | POST with uploadUrl, style, prompt |
| Poll for completion | Detect when done | Low | GET loop with 30s interval |
| Handle errors | Robust operation | Low | API error codes, timeouts |
| Save results | Persist output | Low | JSON file |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Batch processing | Process multiple tracks | Low | Loop over track list |
| Auto-download | Save MP3s automatically | Low | requests.get to audio_url |
| Custom modes | Fine-tune generation | Low | customMode, instrumental flags |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Webhook server | Overkill for single-user | Use polling |
| Database | Unnecessary complexity | JSON file output |
| Cloud storage | Additional setup | GitHub Raw URLs |

## MVP Recommendation

Prioritize:
1. Check credits + submit remix
2. Poll for completion
3. Save results to JSON

Defer: Auto-download (can manually download from URLs)

## Sources

- Suno API documentation
- Idea document (suno-remix-at-home.txt)
