# Suno Remix at Home

## What This Is

A minimal single-user Python script that calls the Suno API to remix MP3 audio files. The user hosts MP3s on a public GitHub repository, runs the script locally, and polls for results until the remix is complete.

## Core Value

Allow users to transform their MP3 files into remixes using Suno's AI generation API with a simple local script — no server, database, or cloud infrastructure required.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Script can check Suno API credits
- [ ] Script can submit remix jobs with custom style/prompt
- [ ] Script polls for task completion
- [ ] Script saves results to JSON file
- [ ] Support for multiple tracks in batch
- [ ] Optional auto-download of generated MP3s
- [ ] Error handling for API failures

### Out of Scope

- Server/backend framework — local script only
- Database — JSON file output
- Webhook server — polling instead
- Cloud storage — GitHub Raw URLs
- Multi-user support — single user only

## Context

The original plan involved significant infrastructure (S3, database, webhook server, job queue). This simplified approach uses:
- GitHub Raw as the file host for uploadUrl parameter
- Polling instead of webhooks for job status
- Simple console output + JSON file for results
- No external dependencies beyond the `requests` library

## Constraints

- **Tech Stack**: Python with requests library only
- **API**: Suno API via sunoapi.org
- **File Host**: GitHub Raw (must be public)
- **Audio Duration**: Up to 3 minutes standard, 8 minutes max (V5 model)
- **API Limits**: Polling interval 30+ seconds to avoid rate limiting

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Polling over webhooks | Simpler for single-user local script | — Pending |
| GitHub Raw over S3 | Free, stable, no AWS setup | — Pending |
| Python over Node | Simpler dependency (requests only) | — Pending |

---
*Last updated: 2026-02-28 after initialization*
