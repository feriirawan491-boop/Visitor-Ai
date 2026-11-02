# FE-08 — Frontend Production Readiness, UAT & Rollout

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F08 production/multi-site, nonfunctional requirements, existing roadmap. **Delivery:** RELEASE GATE.

## Platform readiness
| Workstream | Required evidence |
|---|---|
| Performance | Production build bundle report, split charts/stream components, avoid unnecessary rerender on high-volume events |
| Security | Token/session inspection, safe cached data, no PII in logging/telemetry, direct route negative tests |
| Accessibility | Keyboard-only flows; focus and validation; chart accessible table; screen-reader labels; color contrast |
| Responsive | 1440, 1280, 1024, 768, 390, 360 widths; orientation; zoom 200% |
| Reliability | Simulated WS failure/polling recovery, camera offline, partial API outage, stale event, session expiry |
| Observability | Redacted frontend error reporting, correlation ID if backend supplies, health banner and last updated |
| Release | Env config validation, `npm run lint`, `typecheck`, `test`, `build` (adapt actual scripts), rollback plan |

## Cross-role end-to-end test matrix
| ID | Role | Flow | Expected |
|---|---|---|---|
| FE-U01 | Admin Site | View Cam1/Cam2 live then offline | Correct direction/health state |
| FE-U02 | Admin Site | Revisited visitor | Same VIS ID shown from API |
| FE-U03 | Admin Site | Employee enrollment + ambiguous resolution | Validation and server-authoritative updates |
| FE-U04 | Management | View site A+B and filter A | Aggregated metrics and exports consistent |
| FE-U05 | Management | Deep-link into snapshots | Denied at UI + server |
| FE-U06 | Provider | Create site + assign roles | Site scope and context reflected |
| FE-U07 | Provider | Attempt dangerous config/reset | Permission, confirmations, audit evidence |
| FE-U08 | Admin Site | Entertaint/Protocol | Placeholder only, no changes to counting |
| FE-U09 | All roles | WS down then recovery | Polling fallback, state updated, no duplicate event |
| FE-U10 | All roles | Session revoked mid-navigation | Sensitive UI cleared, 403/login according to auth contract |
| FE-U11 | All roles | 390px keyboard/zoom access | No hidden critical control or clipped alerts |
| FE-U12 | Management | Incomplete 20-min camera gap | Coverage warning visible, not zero traffic |

## Release gates (P0)
- RBAC E2E negative tests verified by FE + BE Security.
- No dummy visitor figures in production; all metrics sourced from API with last-updated and coverage.
- No browser leakage of raw faces/embeddings, RTSP secrets, or high-risk logs.
- Existing F01–F03 regression tests pass; screen and API contract mismatch list closed or approved waiver.
- Management sees only aggregate data, no individual IDs/media.
- Rollback/feature flags available for FE-04–FE-07 enhancements as technically feasible.

## UAT signoff template
| Field | Value |
|---|---|
| Build / commit | TBD |
| Environment / site | TBD |
| FE Owner | TBD |
| QA Owner | TBD |
| Product Owner | TBD |
| F01–F03 regression evidence | TBD |
| F04–F07 acceptance evidence | TBD |
| Open P0 defects | 0 before go-live |
| Known P1 and mitigations | TBD |
| Release approval | Pending |

## Out of scope
Server load tests, CV inference accuracy benchmark, DB migration and backup restores belong to corresponding AI/BE/DevOps plans, with FE participating only to validate surfaced data/health and product journey.
