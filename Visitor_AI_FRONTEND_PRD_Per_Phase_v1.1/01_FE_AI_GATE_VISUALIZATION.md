# FE-01 — AI Gate & Camera Visualization

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F01 FR-001–017; F03 UI Stream, Configuration. **Delivery:** BASELINE AUDIT / UI stabilization. FE tidak memodifikasi algoritma crossing.

## User jobs
- Admin Site memantau dua kamera pada satu pintu fisik (Cam1 OUTSIDE/IN, Cam2 INSIDE/OUT) dan mengetahui status masing-masing.
- Teknisi berizin meninjau/menyesuaikan area gate tanpa restart (sesuai API existing).

## Screen FE-01.1 — Stream Feed
| Region | Detail UI | Interaction/constraint |
|---|---|---|
| Header | Site, title, last updated, global stream/pipeline status | Site scope sesuai permission |
| KPI strip | IN, OUT, unique visitor, occupancy, FPS/uptime sesuai API | Label customer vs total people konsisten |
| Cam1 tile | Source name, IN role, snapshot/stream, bbox, track ID, visitor ID/class, gate line | Aspect ratio preserve, overlay coordinates calibrated |
| Cam2 tile | Source name, OUT role, overlay yang sama | Role direction fixed by config, no label inversion |
| Health banners | connecting, active, degraded, offline, stale | No misleading green on frozen frame |
| Toolbar | refresh, focus camera, optional overlay toggles | Read-only vs technician distinguish |

## Screen FE-01.2 — Gate Geometry Editor (permission-gated)
- Mode selector: `line`, `partial_line`, `polygon`, `near`; show relevant controls only.
- Drawing surface uses **snapshot from existing API** as background; map normalized coordinates to rendered image with letterboxing accounted for.
- Line A/B handles; partial line bounds; polygon vertices and close shape; near threshold/dwell/hysteresis; guards if supported by backend parameter definitions.
- Buttons: Reset Unsaved, Preview, Save; destructive reset must not be conflated with geometry reset.
- Disable Save until valid geometry and permitted user; display server validation error; show config version/last saved.

## View states
| State | UX response |
|---|---|
| Initial connection | Camera skeleton + connecting label |
| Camera offline | Camera ID, offline timestamp, retry indicator; retain other camera |
| Stale frame | Overlay warning with last frame time; do not portray as live |
| Permission denied | View only; hide edit or link to 403 |
| Save pending | Prevent double submit; rollback visualization on failure |
| Geometry conflict | Refetch and show changed externally prompt |
| Low FPS | Performance warning and latest actual FPS from API |

## Integration contract
- **Existing:** `GET /status`, `/health`, `/stream/{camera_id}`, `GET/POST /api/v1/config/lines`, `GET/PUT /config`, `POST /config/tuning`, `POST /pipeline/start|stop`.
- Use response schemas to derive **actual normalized geometry, camera role, config version, frame timestamp**; if missing, open dependency ticket rather than inventing fields.
- Do not expose RTSP credentials in browser. Snapshot endpoint must use scoped authorization.
- Frame overlay rendering must scale anchors and bbox accurately on window resize/device pixel ratio; coordinates from BE are source of truth.

## Acceptance criteria + FE tests
| FE Test | Scenario | Expected |
|---|---|---|
| FE-G01 | Cam1 online, Cam2 offline | Cam1 active; Cam2 degraded without frozen-frame illusion |
| FE-G02 | Resize stream 1440→768→390 | Bbox and gate overlays remain aligned |
| FE-G03 | Visitor enters on Cam1 | UI displays IN event returned from API, never adds local count |
| FE-G04 | Unauthorized user opens editor via URL | No editable UI; backend denies mutation |
| FE-G05 | Invalid polygon (<3 points) | Save blocked, accessible inline error |
| FE-G06 | Save valid geometry | Pending→success then authoritative config refetched |
| FE-G07 | API rejects changed config | Original overlay restored; error with retry |
| FE-G08 | Pipeline stopped | Clear non-live status and timestamp on camera tiles |

## FE deliverables
Responsive Stream Feed layouts, CameraTile and GateEditor components, focus/keyboard support, API adapters, tests and QA screen recordings. Exclude any AI model tuning optimization itself.
