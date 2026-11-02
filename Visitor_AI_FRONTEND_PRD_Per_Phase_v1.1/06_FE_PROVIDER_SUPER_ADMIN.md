# FE-06 — Super Admin Provider Workspace

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F06, General v1.1 FR-093, 097. **Delivery:** ENHANCEMENT. All mutation/API behavior conditional on backend permission and contract.

## Screen map
| Page | Core UI | Mutation |
|---|---|---|
| Global Overview | sites, active instances, total camera health, incidents | None by default |
| Site Management | site directory, create/edit, timezone, status, camera/instance association | guarded create/update/disable |
| User & Access | user list, invite/create, role, site assignments, disabled status | guarded user changes |
| Camera & AI Management | camera mapping, online state, gate config, pipeline status | permission-specific |
| System Health | uptime, FPS, WS, DB, telemetry, degraded timelines | incident view, approved controls |
| Data & Audit | actor/time/site/action log, filter/export | audit read scoped; restricted export |
| System Configuration | shared defaults, integration state, config versions | authorized update only |

## Screen FE-06.1 — Site Management
- Site table name, site ID, timezone, state, mapping completeness, last heartbeat; filters search/status.
- Create/edit wizard (PROPOSAL): metadata → 2 camera roles Cam1 OUTSIDE/IN Cam2 INSIDE/OUT → validate assignments → review/save.
- Field errors inline. Do not permit duplicate camera role; do not claim site 'active' without validated health/config from backend.

## Screen FE-06.2 — User & Access
- User table role, status, assignment count (no secrets).
- Assign sites via searchable multi-select with explicit scope preview; rights table review before confirm.
- Role change confirmation shows consequences; revoked sessions handled by backend, frontend stops showing stale data.

## Screen FE-06.3 — Camera/AI Management
- Camera detail with redacted credentials, geometry preview/edit if tech-authorized, status and last heartbeat.
- Separate info buttons vs high-risk controls (start/stop/restart). DB/counter reset must be restricted behind explicit backend capability and irreversible-action confirmation (may be disabled in production).
- Settings version diff and expected update result; show incident ID on failure if backend provides.

## Screen FE-06.4 — Health and Audit
- System health dashboard per site: online/degraded/offline, FPS current and range, last telemetry push, current WS/polling states, DB health.
- Audit log filters actor, action, site, outcome and period; visual status does not expose biometric payloads.

## States, validation, empty/error
No sites, setup incomplete, suspended site, stale health, forbidden, save conflict, long-running action, partial multi-site outage, lost provider session, no audit records, masked secret.

## FE acceptance tests
| ID | Scenario | Expected |
|---|---|---|
| FE-S01 | Create site without complete camera mapping | Form shows incomplete, server behavior authoritative |
| FE-S02 | Map duplicate IN cameras | Client rejects and server rejects |
| FE-S03 | Assign Management two sites | Scope preview reflects exactly 2 authorized sites |
| FE-S04 | Disable Admin Site account | Change confirmation, status update and audit visible |
| FE-S05 | Force invalid tuning values | Inline bounds error; API reject preserved |
| FE-S06 | Pipeline stop pending | Button disabled, action state visible, incident/result logged |
| FE-S07 | Production DB reset without permission | Control inaccessible; API denies |
| FE-S08 | Site camera offline | Global and site detail health both degraded |

## API contract proposals
Provider route family is **not present in existing v1.0 API**. Example categories `/provider/sites`, `/provider/users`, `/provider/health`, `/provider/audit`, `/provider/config-changes` are proposals from F06 only; FE must not hardcode them until backend OpenAPI signed.

## Deliverables
7 pages + site detail, create/edit flows, privilege-aware controls, modal & confirmation patterns, status/audit UI, tests with mocked safe API and production UAT.
