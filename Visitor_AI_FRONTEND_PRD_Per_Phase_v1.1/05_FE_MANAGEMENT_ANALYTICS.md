# FE-05 — Management Dashboard & Analytics (Read-Only)

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F05, General v1.1 FR-090, 095, 098. **Delivery:** ENHANCEMENT. Data is **aggregated only**.

## Screens
| Screen | Key UI | Filters | Access |
|---|---|---|---|
| Overview | site count, IN, OUT, unique, occupancy, data freshness / coverage | date + assigned sites | aggregated |
| Visitor Analytics | hourly/daily traffic, unique vs entries, peak times, category if approved | date, sites, granularity | aggregated |
| Duration Analytics | mean/median stay, duration buckets, completed session count | date, sites | aggregated |
| Site Performance | site comparative table/chart, uptime/coverage | sites and period | aggregated |
| Reports | aggregate table, filter summary, export | date, site, metric | aggregated only |

## Definitions shown in UI
- **IN/OUT** = count of valid movement events in selected period; **Unique** = distinct recognized visitor tokens as backend defines; **Occupancy** = point-in-time, not simply sum over filtered period.
- **Duration** = completed valid sessions only; open sessions excluded from completed average, sample size displayed.
- **Unknown/Ambiguous** handling and cross-site unique dedup are **TBD**; display method/source tooltip until decision.
- **Coverage** = quality/availability of source data. Camera offline period must be marked incomplete, not interpreted as zero arrivals.
- **Timezones** = per-site timestamps; cross-site comparison aggregation policy TBD and explicitly labeled.

## Filter synchronization and export
- One global FilterBar with site multi-select (restricted to authorized sites), date range + valid range check, granularity; filters serialized to URL only if non-sensitive.
- All KPI/chart/table/export use same normalized filter state; user changes cancel stale requests; reset to default explicit.
- Export button shows progress, error, downloaded report scope; server generates aggregate-only columns. No VIS/EMP ID, faces, snapshots, body/face embeddings.

## Suggested dashboard layout (PROPOSAL)
Top utility header → scoped site/date selectors → data health banner → 4–6 KPI cards → Traffic line/chart and Unique vs Entry breakdown → by-hour/peak view → authorized site summary table. Chart alternative table mandatory.

## Key UX states
No assigned site, no traffic observed while cameras healthy, degraded/offline source interval, some site partial data, loading, filter no-results, export prohibited/unavailable, incompatible timezones, no completed visits.

## Acceptance tests
| ID | User action / data fixture | Expected |
|---|---|---|
| FE-M01 | Select site A from A+B | All cards, charts and export only A |
| FE-M02 | Visitor A re-enters twice | Entries=2, unique=1 if matching successful |
| FE-M03 | Unpaired exit | Excluded from completed-stay average |
| FE-M04 | Camera offline 20m | Incomplete banner + coverage label; no false zero claim |
| FE-M05 | Try stream/visitor endpoints | UI no entry; API denies (joint test) |
| FE-M06 | Export selected period | Same filters and timezones as chart, aggregate-only |
| FE-M07 | Ambiguous resolved after chart loaded | Refresh aggregate according to version/timestamp and no silent mismatch |
| FE-M08 | 390px viewport | KPI stacks, chart supports accessible tabular alternative |

## Dependencies/API proposal (not existing)
`GET /management/overview`, `/management/analytics/traffic`, `/management/analytics/duration`, `/management/sites/performance`, `/management/reports` are conceptual endpoint examples only; must be matched to backend-approved OpenAPI. Required shapes include `site_scope`, `timezone`, `coverage`, `last_updated`, `filters`, `metrics`, `series`.

## Deliverables
5 page designs + responsive variants, chart library selection with privacy review, reusable `FilterBar`, `AnalyticsCard`, `ChartWithTable`, export UX, typed adapters, test fixtures, a11y/e2e.
