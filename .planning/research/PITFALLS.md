# Domain Pitfalls

**Domain:** Local Python script for AI audio remix
**Researched:** 2026-02-28

## Critical Pitfalls

### Pitfall 1: Private GitHub Repository
**What goes wrong:** Suno cannot download the audio file, returns 451 error
**Why it happens:** GitHub Raw returns 404 for private repos to external services
**Consequences:** Remix job fails immediately
**Prevention:** Use a public repository for hosting MP3s
**Detection:** Check URL in browser first - must be publicly accessible

### Pitfall 2: Polling Too Fast
**What goes wrong:** Rate limit error (430) from Suno API
**Why it happens:** Polling more frequently than every 30 seconds
**Consequences:** API throttles requests
**Prevention:** Use 30+ second sleep between polls
**Detection:** Watch for 430 error code

### Pitfall 3: Expired Audio Links
**What goes wrong:** Generated audio URLs stop working after 15 days
**Why it happens:** Suno deletes files after 15 days
**Consequences:** Cannot download remixes after expiration
**Prevention:** Download remixes immediately or within 15 days

## Moderate Pitfalls

### Pitfall: Insufficient Credits
**What goes wrong:** API returns 429 error
**Prevention:** Check credits before submitting jobs
**Detection:** Error code 429 means credits exhausted

### Pitfall: Invalid API Key
**What goes wrong:** API returns 401 error
**Prevention:** Verify SUNO_API_KEY is correct
**Detection:** Error code 401 - check key

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Setup | Wrong API key | Test with get-credits first |
| Hosting | Private repo | Use public repo |
| Polling | Rate limits | 30s interval |
| Download | Expired links | Download within 15 days |

## Sources

- Suno API error codes documentation
- GitHub Raw URL requirements
