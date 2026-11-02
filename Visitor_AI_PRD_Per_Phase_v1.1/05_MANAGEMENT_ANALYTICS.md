# F05 — Management Dashboard, Analytics & Aggregated Reports

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen induk:** PRD-VISITOR-AI-ENT-001 v1.1 (29 Oktober 2026)  
**Status:** Draft untuk review stakeholder dan engineering  
**Sifat fase:** implementasi existing / enhancement sebagaimana dijelaskan di bawah

## Konvensi dan kendali perubahan
- **BASELINE** = tercantum di PRD v1.0/v1.1; bukan bukti implementasi sudah lulus pengujian. **ENHANCEMENT** = tambahan v1.1. **PROPOSAL** = detail rekomendasi BA/PM yang harus disetujui. **TBD** = membutuhkan keputusan stakeholder.
- Setiap perubahan model recognition, nilai threshold, dan rules counting harus diverifikasi terhadap kode dan field logs; PRD tidak otomatis mengubah implementasi.
- Untuk seluruh data sensitif (face/body embeddings, snapshot, visitor profile), wajib diberlakukan otorisasi server-side, audit, dan kebijakan retensi yang disahkan; management hanya menerima statistik agregat.
- Notasi P0 = wajib sebelum release fase, P1 = penting, P2 = pengembangan berikutnya.

## 1. Tujuan/status
**ENHANCEMENT** FR-090, FR-095, FR-098. Management hanya merekap statistik/analytics dari site yang diizinkan, **tanpa mengakses** admin operational data, live feeds, snapshot, visitor identifiers, employee data, ambiguous queue, AI tuning.

## 2. Sitemap per layar
| Screen | KPI/komponen | Filter/action | Catatan |
|---|---|---|---|
| Overview | unique visitors, customer IN/OUT, occupancy latest, peak hour, site summaries | date range, authorized sites | Last updated + coverage completeness |
| Visitor Analytics | hourly/daily entries/exits, unique count trend, returning visitors if reliable | period, site, compare previous | Distinguish events from unique people |
| Duration Analytics | average/median/percentile stay, completed sessions, duration buckets | period, site | Show N/A if sessions unpaired/unreliable |
| Site Performance | aggregated site comparison by traffic, unique, occupancy, dwell | selected sites, sorting | Site-level only; no employee operational record |
| Reports | summary table, time series, site breakdown | filter, export CSV/Excel | Server-side aggregation, safe filename, audit export |

## 3. Metric contract (proposed; PO approval required)
| Metric | Definition | Caveat |
|---|---|---|
| Customer IN | valid `VISITOR_ENTER` events within site+period | Excludes employee; ambiguous treatment TBD |
| Customer OUT | valid `VISITOR_EXIT` events within site+period | Count event, not person |
| Unique Visitors | distinct resolved VIS ID for eligible entries in range | Pending ambiguous may underestimate; global/site uniqueness TBD |
| Occupancy latest | latest reconciled inside customer count at timestamp | Must show timestamp, quality/staleness; may differ from all-human occupancy |
| Average Stay | sum duration of paired completed sessions / completed sessions | Do not use live sessions as complete; timezone UTC storage |
| Peak Hour | bucket with max eligible IN events | Specify site-local bucket boundaries |
| Coverage/Health | data good/degraded/offline based on source health | Missing interval cannot be assumed zero traffic |

## 4. Core user stories and rules
| ID | Story | Acceptance criteria |
|---|---|---|
| MG-01 | View all authorized sites overview | KPIs cover only assigned site IDs |
| MG-02 | Filter by date/site | All tiles/charts/table/export reflect same filters |
| MG-03 | Compare sites | Site order and timezones explicit, no cross-site identifier leakage |
| MG-04 | Inspect duration distribution | Only paired valid sessions contribute; sample count visible |
| MG-05 | Download report | Aggregate-only columns; no VIS/EMP IDs, images, embeddings |
| MG-06 | Assess stale or incomplete data | Visible `Last updated`, coverage %, camera degraded indicator |
| MG-07 | Read-only permission | UI no operation buttons AND API denies direct calls |

## 5. Screen states & UI behavior
- Loading skeleton, empty site scope, empty period, no data, partial data, complete data, API down, access denied.
- Date picker uses site-local day; multiple-site comparisons show timezone context. Avoid conflating 'today' across different timezones.
- Every card shows unit and time scope; occupancy clearly marked **current** not sum of entries.
- Report export reflects filters and the same aggregation definition as the chart; csv formula injection sanitized (PROPOSAL).

## 6. Data integration / API proposal
Aggregator consumes `VISITOR_ENTER`, `VISITOR_EXIT`, identity updates, visit sessions, camera/health events; handles late corrections and deduplicated `event_id`. Read model: `site_daily_stats`, `site_hourly_stats`, `site_occupancy_latest`, `site_data_quality` (PROPOSAL).  
New versioned aggregate-only endpoints as proposal: `GET /management/overview`, `/management/traffic`, `/management/duration`, `/management/sites`, `/management/reports/export` with mandatory server-side scope. Do not expose legacy `/visitors` for this role.

## 7. UAT tests
| ID | Test | Expected |
|---|---|---|
| TC-M01 | Filter site A from A+B dashboard | All cards/chart/export change consistently |
| TC-M02 | Compare daily IN vs unique, one return visitor | IN=2, unique=1 (if matched) |
| TC-M03 | Missing EXIT | Session excluded from completed-average |
| TC-M04 | Stream offline 20 minutes | Coverage marked incomplete; not zero inferred |
| TC-M05 | Management direct calls visitor/snapshot | Access denied |
| TC-M06 | Export multi-site date range | Only authorized site aggregates and matching totals |
| TC-M07 | Ambiguous later resolved | Aggregates recompute/adjust per agreed rule |

## 8. Decisions needed
- Visitor uniqueness scope: across site vs per site (PRD says permanent VIS ID; platform namespace undefined).
- Operational definition of occupancy: visitors only vs all persons, and employees handling.
- Ambiguous/unknown inclusion in live traffic and unique KPI.
- Thresholds for freshness indicator and required report formats; not specified in v1.1.

## 9. Exit criteria
All 5 screens have UX signoff, metric dictionary approved, API response contract validated against reconciled test dataset, and negative access tests passed.
