# Technology Stack

**Project:** Suno Remix at Home
**Researched:** 2026-02-28

## Recommended Stack

### Core Language
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Python | 3.8+ | Script execution | Simple, minimal dependencies |
| requests | latest | HTTP client | Single dependency, easy to use |

### Infrastructure
| Technology | Purpose | Why |
|------------|---------|-----|
| GitHub Raw | File hosting for Suno uploadUrl | Free, stable, public URLs |
| Local filesystem | Results storage | JSON output, no database needed |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| HTTP Client | requests | httpx | requests is simpler for single script |
| File Storage | Local JSON | SQLite | Overkill for single-user output |
| Audio Hosting | GitHub Raw | S3 | Requires AWS setup |

## Installation

```bash
pip install requests
```

## Sources

- Suno API documentation (sunoapi.org)
- GitHub Raw URL format
