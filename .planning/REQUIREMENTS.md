# Requirements: Suno Remix at Home

**Defined:** 2026-02-28
**Core Value:** Allow users to transform their MP3 files into remixes using Suno's AI generation API with a simple local script — no server, database, or cloud infrastructure required.

## v1 Requirements

Requirements for initial release.

### Core API

- [ ] **API-01**: User can check remaining Suno API credits
- [ ] **API-02**: User can submit a remix job with uploadUrl, style, title, and prompt
- [ ] **API-03**: Script polls for task completion with 30-second interval
- [ ] **API-04**: Script handles SUCCESS and FAILED status responses
- [ ] **API-05**: Script handles API error codes (400, 401, 413, 429, 430, 451, 500)

### Configuration

- [ ] **CONF-01**: User can configure SUNO_API_KEY
- [ ] **CONF-02**: User can configure BASE_URL for Suno API
- [ ] **CONF-03**: User can define multiple tracks with custom settings
- [ ] **CONF-04**: Each track supports uploadUrl, title, style, and prompt

### Output

- [ ] **OUT-01**: Results saved to remix_results.json
- [ ] **OUT-02**: Output includes audio_url for each generated variant
- [ ] **OUT-03**: Output includes title and duration for each variant
- [ ] **OUT-04**: Errors are captured and saved to results file

### Optional Features

- [ ] **OPT-01**: User can auto-download generated MP3s to local folder (optional)

## v2 Requirements

Deferred to future release.

### Batch & Scheduling

- **BATCH-01**: Schedule remix jobs for later execution
- **BATCH-02**: Rate limit submissions to avoid credit exhaustion

### Monitoring

- **MON-01**: Email notifications when remix completes
- **MON-02**: Webhook notifications (for users who want to scale beyond single-user)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server/backend framework | Local script only |
| Database | JSON file output sufficient |
| Webhook server | Polling simpler for single-user |
| Cloud storage (S3) | GitHub Raw URLs sufficient |
| Multi-user support | Single-user script |
| OAuth/accounts | Not needed for personal use |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| API-05 | Phase 1 | Pending |
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 1 | Pending |
| CONF-04 | Phase 1 | Pending |
| OUT-01 | Phase 1 | Pending |
| OUT-02 | Phase 1 | Pending |
| OUT-03 | Phase 1 | Pending |
| OUT-04 | Phase 1 | Pending |
| OPT-01 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after initial definition*
