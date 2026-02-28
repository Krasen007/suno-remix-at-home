---
wave: 1
depends_on: []
files_modified:
  - remix.py
autonomous: true
---

# Plan: Phase 1 - Core Remix Script

**Created:** 2026-02-28
**Phase:** 1
**Goal:** Implement a working Python script that can submit remix jobs to Suno API, poll for completion, and save results.

## Requirements Covered

| ID | Requirement |
|----|-------------|
| API-01 | Check remaining Suno API credits |
| API-02 | Submit remix job with uploadUrl, style, title, prompt |
| API-03 | Poll for task completion with 30-second interval |
| API-04 | Handle SUCCESS and FAILED status |
| API-05 | Handle API error codes |
| CONF-01 | Configure SUNO_API_KEY |
| CONF-02 | Configure BASE_URL for Suno API |
| CONF-03 | Define multiple tracks with custom settings |
| CONF-04 | Each track supports uploadUrl, title, style, prompt |
| OUT-01 | Results saved to remix_results.json |
| OUT-02 | Output includes audio_url for each variant |
| OUT-03 | Output includes title and duration |
| OUT-04 | Errors captured and saved |
| OPT-01 | Auto-download generated MP3s (optional) |

## Tasks

### Task 1: Create remix.py script structure
- Create main script with config section at top
- Add TRACKS list for track configuration
- Add SUNO_API_KEY and BASE_URL configuration

### Task 2: Implement API credit check
- Add get_credits() function
- Call GET /api/getvipinfo or similar endpoint
- Print credit balance to console

### Task 3: Implement remix submission
- Add submit_remix() function
- Build request with uploadUrl, title, style, prompt
- Submit to POST /api/chatgpt/fork
- Return task_id for polling

### Task 4: Implement polling loop
- Add poll_for_completion() function
- 30-second polling interval
- Check job status until SUCCESS or FAILED
- Handle rate limiting (429 responses)

### Task 5: Implement result handling
- Parse response for SUCCESS/FAILED status
- Extract audio_url, title, duration for each variant
- Save to remix_results.json

### Task 6: Implement auto-download (optional feature)
- Add download_remixes() function
- Create remixes/ directory
- Download MP3 files with proper naming

### Task 7: Error handling
- Handle API errors: 400, 401, 413, 429, 430, 451, 500
- Fail fast with error messages
- Exit with error codes
- Save errors to results file

## Implementation Notes

- Use requests library
- Configuration via direct file editing (remix.py)
- Verbose output for debugging
- Create remixes/ folder for downloads

---

*Plan verified against ROADMAP.md success criteria*
