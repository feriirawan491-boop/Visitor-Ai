# FE-03 — Admin Site Dashboard, History & Realtime

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F03 FR-045–088; existing Next.js 5 tabs, WebSocket primary, HTTP polling fallback. **Delivery:** BASELINE verification and stabilization.

## Sitemap operational
`Stream Feed` | `Visitor` | `Employee` | `History` | `Settings/Tuning` + `Ambiguous Queue` panel + future `Entertaint` / `Protocol` (FE-07).

## FE-03.1 — Admin site shell
- Site title, role-aware nav, global site selector only for authorized multi-site users, notifications, connection status, user/profile.
- Preserve existing active route where possible; mobile nav drawer, full keyboard navigation, breadcrumb and page heading.
- Site-specific errors must not redirect to another site's data without deliberate switch.

## FE-03.2 — Operational dashboard / Stream stats
- KPI: unique visitors, counted IN, counted OUT, occupancy, FPS, uptime. Label **people vs customers** per approved metric contract.
- Show camera-specific status and site data freshness. FPS does not imply count accuracy.
- Realtime event feed; new event may update only server-returned count (avoid duplicating increment on reconnect).

## FE-03.3 — History
- Paginated event log with date range, event type, direction, camera, visitor/employee reference if authorized, snapshot access if available.
- Show timezone, query range, missing/late events, stable sort, `no result` vs `offline gap` distinction.
- Export action only if backend export and permission are confirmed, else not rendered.

## FE-03.4 — Settings/Tuning
- Slider input derived from server-provided min/max/step/default. Preview changes, save confirmation, pending/rollback, audit feedback.
- Clearly separate reversible config update from destructive pipeline and data actions. Critical buttons provider-only by default per F04.

## FE-03.5 — Realtime state machine
```text
INIT → CONNECTING → WS_LIVE ──disconnect──> RECONNECTING
                               │               │
                               └───────────────┼── after threshold → POLLING_FALLBACK
                                               └── restored WS → WS_LIVE
any mode → SESSION_EXPIRED / PERMISSION_REVOKED / SITE_UNAVAILABLE
```
- Connection banner state and last-successful-update visible. On fallback, stop duplicate WS/poll subscriptions when switching.
- Resume from server snapshot/sequence if supported. Dedup event client-side by event ID for display only; server authoritative statistics.
- Date filter changes must update all tabs/queries or explicitly scope to current page; ensure old WS messages don't overwrite newer filter context.
- Do not show data from another site in a stale cache after switching.

## API boundaries
Existing `GET /status`, `/health`, `/statistics`, `/visitors`, `/employees`, `GET /config`, `PUT /config`, `GET /snapshots`, and `WS /ws` (plus documented subordinate endpoints). Typed API wrapper with bearer/session mode per backend design. **Do not assume WS message shape beyond documented behavior.**

## Scenarios and acceptance
| ID | Action | Expected FE |
|---|---|---|
| FE-R01 | Initial load | Skeleton then latest authorized stats with timestamp |
| FE-R02 | WS live | New counts/events from API displayed without page reload |
| FE-R03 | WS fails repeatedly | Banner says Polling Fallback; stats continue if HTTP healthy |
| FE-R04 | WS restored | Polling stops; no count duplication/flicker |
| FE-R05 | Change date filter while messages in flight | UI always reflects latest query context |
| FE-R06 | Camera offline | Show degraded/incomplete, never convert missing into zero |
| FE-R07 | Force 401/403 | Re-auth / access denied; no sensitive stale display |
| FE-R08 | One site to another | Clear previous scoped cache before new render |

## Deliverables
Role-aware site shell, history table, filters, KPI cards, WS connection hook, polling adapter, status badges, error and retry patterns, unit/e2e tests for reconnect race conditions.
