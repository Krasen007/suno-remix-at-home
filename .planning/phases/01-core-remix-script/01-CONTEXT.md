# Phase 1: Core Remix Script - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a Python CLI script that calls Suno API to remix MP3 files. Users run `python remix.py` from terminal. Configuration via direct Python file editing.

</domain>

<decisions>
## Implementation Decisions

### Interface
- CLI script (no GUI for v1)
- Users edit remix.py directly to configure tracks and API key
- Run via: `python remix.py`

### Output & Display
- Verbose output mode
- Print every API call and response
- Show debug info during polling

### Error Handling
- Fail fast on errors
- Exit with error code
- Print error message
- Do not save partial results on failure

### Auto-download
- Auto-download generated MP3s to `remixes/` folder
- Download automatically when job completes

### File Naming
- Format: `remixes/{Title}_v{1,2}.mp3`
- Use track title + variant number

</decisions>

<specifics>
## Specific Ideas

- Use requests library for HTTP calls
- 30-second polling interval to avoid rate limiting
- Save results to remix_results.json
- Track configuration in TRACKS list at top of script

</specifics>

<deferred>
## Deferred Ideas

- GUI interface — would be a separate phase after core script works
- Webhook server instead of polling — different architecture
- Batch scheduling — run multiple scripts on cron

</deferred>

---

*Phase: 01-core-remix-script*
*Context gathered: 2026-02-28*
