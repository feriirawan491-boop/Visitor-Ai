# F03 — Admin Site Dashboard, API, Realtime & Telemetry

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
**BASELINE** FR-045–088 untuk UI existing dan layanan data realtime. Roadmap induk menyebut WebSocket+polling/ThingsBoard dalam branch aktif. F03 adalah inspeksi, regression, serta stabilisasi. Penambahan menu Entertaint/Protocol tidak dikerjakan di sini (F07).

## 2. Peran dan sitemap existing
Admin Site Lounge menjalankan **Stream Feed | Visitor | Employee | History | Settings/Tuning**, ditambah **Ambiguous Queue** panel/submenu. View kamera berbeda dengan akses tuning. Provider/Super Admin memegang kontrol destruktif per F04/F06.

## 3. Detail screen dan state
| Screen | Komponen wajib | Interaction | State/validation |
|---|---|---|---|
| Stream Feed | Cam1/Cam2 tile, bbox, track/visitor/class, gate overlay, pipeline/WS indicator, top stats | switch camera focus, view details | loading, RTSP disconnect, stale frame, unauthorized controls |
| Visitor | table pagination, search, filters, snapshot, visits, status | open detail, photo search authorized | no-result, missing snapshot, ambiguous identity |
| Employee | table, enroll capture/upload, name/dept/role | submit enrollment, search | validate file size/type, duplicates, enrollment errors |
| History | event log, date filter, paging, type | filter/export only if authorized | empty range, delayed events, timezone ambiguity |
| Settings/Tuning | threshold sliders, geometry polygon/line editor, near mode, camera settings | save/hot apply | min/max/step validation, privilege gate, audit, rollback |
| Ambiguous | queue, snapshot, confidence reason, resolution | confirm identity | stale/conflicted resolution, authorization failures |

## 4. API dan requirements traceability
| Domain | Existing FR | Endpoint/behavior |
|---|---|---|
| Health & stats | 045–047 | GET `/status`, `/health`, `/statistics` |
| Visitors | 048–050 | GET `/visitors`, `/visitors/{id}`; POST `/visitors/photo-search` |
| Employees | 051–052 | GET `/employees`; POST `/employees/enroll` |
| Config | 053–056 | GET/PUT `/config`; POST `/config/tuning`; GET/POST `/api/v1/config/lines` |
| Snapshot & pipeline | 057–062 | GET `/stream/{camera_id}`, `/snapshots`; POST pipeline start/stop, counter/database reset |
| Realtime | 063–068 | WS `/ws`, polling fallback, date_filter over WS, connection indicator |
| UI | 069–078 | Five tabs, stream overlay, stats, gallery, history, tuning, polygon editor, ambiguous, status controls |
| Config/telemetry/store | 079–088 | YAML hot reload; ThingsBoard HTTP async; SQLite PoC→Postgres prod; snapshot/enrollment files |

## 5. Event & state flow
- When WS opens, client subscribes to authorized site events; server validates session and site scope (F04 enhancement).
- Events/stats push to UI; date_filter changes query context and must not leak data outside site.
- At >=2 failed reconnect attempts or configured max, HTTP polling fallback begins; WS recovery halts redundant polling.
- UI explicitly shows `Live`, `Reconnecting`, `Polling`, `Stale`, `Offline` rather than showing last data as current.
- ThingsBoard async push KPI: total visitors, IN, OUT, occupancy, with retry/error visibility; failures must not block detection.

## 6. UI/UX specific acceptance
| Test | Steps | Expected |
|---|---|---|
| TC-D01 | Admin loads live page | Correct 2 camera role labels, overlay, current stats |
| TC-D02 | WS network failure | Polling resumes, state indicator changes, no repeated count |
| TC-D03 | WS restored | Polling stops, no duplicated event rows |
| TC-D04 | Change date filter | Results filtered to requested date/timezone; UI clear |
| TC-D05 | Tuning value out of range | Rejected without change |
| TC-D06 | Unauthorized user clicks direct tuning endpoint | 403; no pipeline/config change |
| TC-D07 | Telemetry endpoint down | Pipeline unaffected, retries logged |
| TC-D08 | DB access failure | Health degraded and UI meaningful error |

## 7. Backend/NFR
Persist structured logs; no secrets in front-end; file uploads <=5 MB and server content validation; frontend CORS restricted; graceful shutdown flush DB pool; monitoring FPS, uptime, camera status, WS status. **PROPOSAL:** frontend component-level error boundaries, pagination state in URL, and export guards.

## 8. Exit gate
Demonstrate cross-browser dashboard for single site, realtime fallback and privacy/role guard; baseline FR matrix reviewed against actual code and UAT evidence. Missing behaviors logged as defects, not silently labeled implemented.
