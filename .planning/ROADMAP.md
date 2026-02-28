# Roadmap: Suno Remix at Home

**Created:** 2026-02-28
**Total Phases:** 1

## Summary

| Phase | Goal | Requirements |
|-------|------|--------------|
| 1 | Core Remix Script | API-01 through OPT-01 (13 total) |

## Phase 1: Core Remix Script

**Goal:** Implement a working Python script that can submit remix jobs to Suno API, poll for completion, and save results.

**Requirements:** API-01, API-02, API-03, API-04, API-05, CONF-01, CONF-02, CONF-03, CONF-04, OUT-01, OUT-02, OUT-03, OUT-04, OPT-01

**Success Criteria:**

1. Script successfully calls Suno API to check credits
2. Script submits remix job with configurable track settings
3. Script polls for completion with 30-second intervals
4. Script handles SUCCESS/FAILED status and error codes
5. Results saved to remix_results.json with audio_url, title, duration
6. Optional: Auto-download generates MP3s to local folder

**Dependencies:** None - this is the first phase

**Risks:**

- GitHub Raw URL must be public (non-negotiable)
- Rate limiting if polling too fast (avoid by 30s interval)
- Audio links expire after 15 days (document for user)

---

*Roadmap created: 2026-02-28*
