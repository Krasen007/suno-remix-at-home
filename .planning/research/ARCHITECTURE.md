# Architecture Patterns

**Domain:** Local Python script for AI audio remix
**Researched:** 2026-02-28

## Recommended Architecture

Single-script, linear execution flow:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Check Credits│ -> │ Submit Job  │ -> │ Poll Status │ -> │ Save Results│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Component Structure

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Main script | Orchestration | All modules |
| Config section | User settings | - |
| API helpers calls | Suno | HTTP API |
| Poll loop | Status checking | Suno API |

### Data Flow

1. User configures TRACKS list with uploadUrl, style, prompt
2. Script checks credits via GET /get-credits
3. For each track: POST to /generate/upload-cover
4. Poll /generate/record-info until SUCCESS/FAILED
5. Save all results to remix_results.json

## Patterns to Follow

### Polling Pattern
- 30 second interval to avoid rate limiting (error 430)
- Timeout after 10 minutes (600 seconds)
- Check for SUCCESS/FAILED status

### Error Handling
- Map API error codes to user-friendly messages
- Retry on 500 errors
- Log progress for debugging

## Anti-Patterns to Avoid

### Anti-Pattern: Polling too fast
**What:** Polling every few seconds
**Why bad:** Triggers rate limit (error 430)
**Instead:** Wait 30+ seconds between polls

### Anti-Pattern: No timeout
**What:** Polling indefinitely
**Why bad:** Stuck if API is down
**Instead:** Set max wait time (10 minutes)

## Scalability

| Concern | Current | If Expanded |
|---------|---------|-------------|
| Users | 1 | Would need server/queue |
| Tracks | Batch in loop | Would need job queue |
| Storage | JSON file | Would need database |

## Sources

- Suno API documentation
