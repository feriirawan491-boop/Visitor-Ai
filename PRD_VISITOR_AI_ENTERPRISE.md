# PRD — Visitor-AI Enterprise

**General Product Requirements Document**

| Field | Value |
|-------|-------|
| **Document ID** | PRD-VISITOR-AI-ENT-001 |
| **Product** | Visitor-AI Enterprise |
| **Version** | 1.0 (General Draft) |
| **Status** | Draft — For Review |
| **Date** | 2026-10-29 |
| **Owner** | Product / Engineering |
| **Branch** | `feat/websocket-primary-polling-fallback` |
| **Repository** | `https://github.com/testmdm/visitor-ai-enterprise.git` |
| **Related Docs** | `docs/TECHNICAL_DESIGN.md`, `docs/NEAR_MODE.md`, `docs/TRIPWIRE_PER_CAMERA.md`, `docs/DEPLOYMENT_WINDOWS.md` |
| **Logs Reference** | `kasus-1225-A.txt`, `kasus-1225-B.txt`, `kasus-1225-C.txt` |

---

## 1. Document Control

### 1.1 Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 0.1 | 2026-08-01 | Engineering | Initial technical design draft |
| 0.5 | 2026-10-11 | Engineering | Near-mode gate, employee dual-track, ambiguous queue (kasus-1225 logs) |
| 0.9 | 2026-10-28 | Engineering | WebSocket primary + HTTP polling fallback, ThingsBoard telemetry |
| 1.0 | 2026-10-29 | Product | General PRD — consolidated from architecture, code, and field logs |

### 1.2 Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Engineering Lead | | | |
| QA Lead | | | |
| Operations | | | |

---

## 2. Executive Summary

Visitor-AI Enterprise adalah platform **Unique Visitor Recognition** berbasis Computer Vision (AI) untuk pintu masuk / lounge area perkantoran. Sistem menggunakan **setup 2 kamera** (Camera 1 di luar pintu untuk deteksi masuk/IN, Camera 2 di dalam ruangan untuk deteksi keluar/OUT) dengan deteksi orang via YOLOv8n, pelacakan track via ByteTrack, dan re-identifikasi (Re-ID) via OSNet body embedding + ArcFace face embedding.

Tujuan inti: **setiap orang unik mendapatkan satu Visitor ID permanen (`VIS000001`, dst.). Orang yang masuk, keluar, dan kembali dihitung hanya SATU kali.** Karyawan yang melewati zona kamera dikenali melalui gallery terpisah (`EMP00001`, dst.) dan **tidak pernah dihitung sebagai pengunjung.**

Sistem menyediakan dashboard realtime (Next.js) dengan WebSocket sebagai channel utama dan HTTP polling sebagai fallback, API REST (FastAPI), konfigurasi hot-reload, serta telemetri ke ThingsBoard untuk KPI pengunjung.

---

## 3. Problem Statement & Background

### 3.1 Masalah Sistem Lama (Legacy)

| Masalah | Akar Masalah | Perbaikan Enterprise |
|---------|-------------|---------------------|
| FPS = 0.0 | Blocking single-loop pipeline | Async, isolated frame grabber threads per kamera |
| Random hash UIDs (`a2589b3c`) | Tidak ada Re-ID gallery | OSNet + gallery matching → `VIS000001` |
| Visits selalu = 1 | Re-ID tidak pernah cocok | Identity Resolver dengan k-anchor gallery |
| Single tripwire → false count | Tidak ada validasi arah | Two-Line Gate + cross-camera confirmation |
| Karyawan = "promote visitor" | Tidak ada pengenalan karyawan terpisah | Dual-track employee recognition (body + face) |
| Tidak ada realtime push | Tidak ada channel realtime | WebSocket primary + HTTP polling fallback |
| Tidak ada telemetri KPI | Tidak ada integrasi monitoring | ThingsBoard HTTP push untuk visitor KPI |

### 3.2 Kebutuhan Bisnis

- Mengetahui jumlah pengunjung unik yang benar (unique visitors), bukan jumlah deteksi.
- Memisahkan karyawan dari pengunjung agar laporan kapasitas ruangan akurat.
- Melacak siapa saja yang masih di dalam ruangan (occupancy / inside list) untuk keamanan.
- Menangani kasus identitas tidak pasti (ambiguous) melalui antrian konfirmasi manual.
- Memungkinkan pengaturan gate (tripwire) per kamera secara visual tanpa restart sistem.
- Monitoring KPI pengunjung ke dashboard eksternal (ThingsBoard).

---

## 4. Goals & Objectives

### 4.1 Primary Objective

Build an enterprise-grade Unique Visitor Recognition platform yang akurat, realtime, dan konfigurabel untuk deployed di PoC maupun produksi.

### 4.2 Measurable Objectives

| No | Objective | KPI / Target |
|----|-----------|--------------|
| O1 | Setiap orang unik mendapatkan satu VIS ID permanen | Re-ID match rate ≥ 90% untuk orang yang kembali |
| O2 | Karyawan dikenali dan tidak increment visitor count | Employee false-positive rate < 5% |
| O3 | Counting IN/OUT akurat dengan validasi arah | False count rate < 5% per hari operasi |
| O4 | Realtime dashboard update | WebSocket connected ≥ 95% waktu aktif |
| O5 | Sistem stabil saat beban | FPS ≥ 6 (PoC CPU) / ≥ 25 (Produksi CUDA) |
| O6 | Konfigurasi tanpa restart | Hot-reload tuning parameter via API |
| O7 | Telemetri KPI | ThingsBoard push sukses ≥ 99% kiriman |

### 4.3 Non-Goals (Out of Scope v1.0)

- Access control fisik (membuka kunci pintu otomatis)
- Integrasi HR / payroll / absensi karyawan
- Multi-site lebih dari 2 kamera dalam satu instance (fase lanjut)
- Face-only enrollment untuk pengunjung (hanya karyawan yang enroll wajah)
- Mobile app native (hanya web dashboard)

---

## 5. Target Users & Personas

| Persona | Peran | Kebutuhan Utama |
|---------|-------|-----------------|
| **Security Officer** | Memantau pintu masuk | Lihat stream live, siapa yang masuk/keluar, daftar orang di dalam ruangan |
| **Resepsionis / Admin** | Mengelola daftar karyawan & pengunjung | Enroll karyawan, konfirmasi identitas ambiguous, kelola whitelist |
| **Manajemen / Laporan** | Melihat statistik & laporan | Total unique visitors, IN/OUT count, occupancy, peak hours |

---

## 6. Scope

### 6.1 In Scope

| Area | Fitur |
|------|-------|
| **Pipeline & Deteksi** | Frame grabber per kamera (thread terpisah), YOLOv8n deteksi orang, ByteTrack pelacakan track, preprocessor (ROI + letterbox) |
| **Gate Logic** | 4 mode per kamera: `line`, `partial_line`, `polygon`, `near`; Two-Line Gate (Line A/B), dwell, hysteresis, guard tepi (from-left/from-right), motion-trail guard |
| **Identity Resolution** | Dual-track Re-ID (body OSNet + face ArcFace), visitor match / new visitor / employee match, face veto, temporal voting, k-anchor gallery |
| **Visitor Engine** | VIS ID sequential (`VIS000001`), visit session, inside/outside status, dedup visitor, DB write pool terpisah |
| **Employee Engine** | Enrollment karyawan (foto/upload), whitelist, body+face anchor, tidak increment visitor count |
| **Ambiguous Handling** | Antrian konfirmasi manual saat confidence rendah / Cam2 tidak dapat membuat visitor baru, konfirmasi sebagai visitor baru / existing / karyawan |
| **API REST** | Visitors, employees, statistics, config/tuning, lines (gate geometry), stream (snapshot), snapshots, health, database reset, pipeline start/stop |
| **Realtime** | WebSocket primary push events/stats, HTTP polling fallback saat WS terputus, date filter via WS |
| **UI Dashboard** | 5 tab: Stream Feed, Visitor, Employee, History, Settings/Tuning; stream overlay (bbox, track ID, visitor ID, classification); polygon editor visual; tuning sliders |
| **Config & Tuning** | YAML config (default.yaml + cameras.yaml), hot-reload via `PUT /config`, per-kamera gate geometry |
| **Telemetry** | ThingsBoard HTTP push untuk visitor KPI |
| **Database** | SQLite (PoC) → PostgreSQL (produksi), snapshot file di disk, ambigous identities |
| **System Control** | Start/stop semua pipeline, reset counter, reset database |

### 6.2 Out of Scope (v1.0)

- Kontrol akses fisik / pintu otomatis
- Integrasi HRIS / payroll
- Multi-camera > 2 dalam satu instance (fase 2+)
- Face enrollment untuk pengunjung
- Mobile native app

---

## 7. Functional Requirements (FR)

### 7.1 Pipeline & Kamera

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-001 | Sistem mendukung 2 kamera: Cam1 (role OUTSIDE → deteksi IN) dan Cam2 (role INSIDE → deteksi OUT). | Wajib |
| FR-002 | Setiap kamera memiliki frame grabber thread terpisah yang capture full FPS dan auto-reconnect saat putus. | Wajib |
| FR-003 | Deteksi orang menggunakan YOLOv8n dengan confidence threshold yang dapat diatur. | Wajib |
| FR-004 | Pelacakan track menggunakan ByteTrack dengan IoU threshold dan max lost frames yang dapat diatur. | Wajib |
| FR-005 | Preprocessor mendukung crop ROI dan letterbox untuk menyesuaikan input model. | Wajib |
| FR-006 | Pipeline per kamera berjalan independen hingga Track Manager; Identity Resolver dan Visitor Engine bersifat global/shared. | Wajib |
| FR-007 | Sistem dapat start dan stop semua pipeline secara bersamaan via API. | Wajib |

### 7.2 Gate Logic (Counting)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-008 | Setiap kamera memilih salah satu gate mode: `line`, `partial_line`, `polygon`, atau `near`. | Wajib |
| FR-009 | Mode `line`: Two-Line Gate (Line A dan Line B horizontal), counting saat crossing A→B dengan validasi arah gerak. | Wajib |
| FR-010 | Mode `partial_line`: Garis horizontal terbatas antara `line_x_start` dan `line_x_end`. | Wajib |
| FR-011 | Mode `polygon`: Zona poligon bebas (min. 3 titik), counting saat entry→exit dengan net forward progress. | Wajib |
| FR-012 | Mode `near`: Deteksi berdasarkan rasio tinggi bbox terhadap tinggi gambar nyata (tanpa padding letterbox), dengan `near_threshold`, dwell, dan histeresis. | Wajib |
| FR-013 | Mode `near` mendukung guard tepi: `skip_receding_from_left/right` dengan policy `receding` (hanya skip jika bbox mengecil) atau `always` (selalu skip track dari tepi yang dijaga). | Wajib |
| FR-014 | Gate logic mendeteksi "fast walker" (track yang sudah di zona saat pertama kali terdeteksi) dan inisialisasi zona-based. | Wajib |
| FR-015 | Objek yang gerak mundur (B→A) antara dua frame berturut-turut tidak dihitung (skip/log only). | Wajib |
| FR-016 | Zone-entry net-progress guard: crossing Line B hanya dipercayakan jika track membuat progress maju sejak memasuki zona. | Wajib |
| FR-017 | Setiap crossing menghasilkan event `CROSSING_DETECTED` dengan arah (IN/OUT), kamera, track ID, dan snapshot crop. | Wajib |

### 7.3 Identity Resolution (Re-ID)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-019 | Identity Resolver menggunakan dual-track: body embedding (OSNet) + face embedding (ArcFace). | Wajib |
| FR-020 | Setiap orang unik mendapatkan Visitor ID sekuensial `VIS000001`, `VIS000002`, dst. | Wajib |
| FR-021 | Orang yang masuk, keluar, dan kembali mendapat ID yang sama (tidak membuat ID baru per kunjungan). | Wajib |
| FR-022 | Status identitas: `NEW_VISITOR`, `VISITOR_MATCH`, `EMPLOYEE_MATCH`, atau `AMBIGUOUS`. | Wajib |
| FR-023 | Face veto: jika face score di bawah `vis_face_veto_threshold`, kandidat ditolak sebagai orang berbeda. | Wajib |
| FR-024 | Temporal voting: majority vote dalam window waktu untuk stabilisasi status identitas. | Wajib |
| FR-025 | K-anchor gallery: simpan hingga k embedding per orang untuk matching yang akurat. | Wajib |
| FR-026 | Hanya Camera 1 (OUTSIDE) yang boleh membuat Visitor ID baru; identitas tidak dikenal di Cam2 di-routing ke antrian ambiguous. | Wajib |
| FR-027 | Gallery embeddings (visitor + employee) persist ke DB untuk survive restart. | Wajib |
| FR-028 | Face detection untuk crop crossing; jika face confidence rendah → flag AMBIGUOUS untuk konfirmasi manual. | Wajib |

### 7.4 Visitor Engine

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-029 | Visitor Engine menghasilkan VIS ID sekuensial dan inisialisasi counter dari DB untuk menghindari collision setelah restart. | Wajib |
| FR-030 | Melacak visit session: first_seen, last_seen, total_visits, inside/outside status. | Wajib |
| FR-031 | Dedup visitor: orang yang sama tidak dihitung berulang kali dalam satu sesi. | Wajib |
| FR-032 | DB write dilakukan pada worker thread terpisah (single-worker pool) agar tidak blokir event loop. | Wajib |
| FR-033 | Snapshot disimpan hanya pada event bermakna: FIRST_APPEARANCE, BEST_QUALITY, ENTRY, EXIT, EMPLOYEE. | Wajib |
| FR-034 | Orphan gate events di-link ke visitor yang sudah teridentifikasi setelah resolusi. | Wajib |

### 7.5 Employee Engine

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-035 | Karyawan dikenali melalui Employee Engine terpisah, tidak pernah increment visitor count. | Wajib |
| FR-036 | Enrollment karyawan via capture kamera atau upload foto, dengan body + face anchor. | Wajib |
| FR-037 | Employee ID sekuensial `EMP00001`, dst., dengan nama, departemen, role. | Wajib |
| FR-038 | Employee records dan embeddings dimuat dari DB saat startup. | Wajib |
| FR-039 | Event `EMPLOYEE_IDENTIFIED` dipublikasikan saat karyawan terdeteksi. | Wajib |
| FR-040 | Dukungan face fallback untuk employee recognition. | Wajib |

### 7.6 Ambiguous Handling

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-041 | Identitas yang tidak pasti (low face confidence, cam2 unmatched, dll.) di-routing ke antrian konfirmasi manual (`AMBIGUOUS`). | Wajib |
| FR-042 | Admin dapat mengonfirmasi ambiguous sebagai: visitor baru, visitor existing, atau karyawan. | Wajib |
| FR-043 | Ambiguous identity disimpan di DB dengan alasan (reason) dan track terkait. | Wajib |
| FR-044 | UI menampilkan panel ambiguous untuk konfirmasi manual. | Wajib |

### 7.7 API REST (FastAPI)

| ID | Endpoint | Deskripsi | Prioritas |
|----|----------|-----------|-----------|
| FR-045 | `GET /status` | Health check, FPS, uptime, active tracks | Wajib |
| FR-046 | `GET /health` | Detail component health (database, event bus, orchestrator) | Wajib |
| FR-047 | `GET /statistics` | Analytics: total visitors, IN/OUT, occupancy, avg FPS | Wajib |
| FR-048 | `GET /visitors` | List/search visitors (paginated, filter tanggal) | Wajib |
| FR-049 | `GET /visitors/{id}` | Visitor detail + visit history | Wajib |
| FR-050 | `POST /visitors/photo-search` | Pencarian pengunjung via upload foto | Wajib |
| FR-051 | `GET /employees` | List karyawan | Wajib |
| FR-052 | `POST /employees/enroll` | Enroll karyawan (capture/upload) | Wajib |
| FR-053 | `GET /config` / `PUT /config` | Baca/update runtime config (hot-reload) | Wajib |
| FR-054 | `POST /config/tuning` | Update satu parameter tuning dengan validasi range | Wajib |
| FR-055 | `GET /api/v1/config/lines` | Baca konfigurasi tripwire per kamera | Wajib |
| FR-056 | `POST /api/v1/config/lines` | Update tripwire per kamera (termasuk mode & polygon) | Wajib |
| FR-057 | `GET /stream/{camera_id}` | Ambil snapshot frame kamera (single frame) | Wajib |
| FR-058 | `GET /snapshots` | List snapshot gambar | Wajib |
| FR-059 | `POST /pipeline/start` | Mulai semua pipeline kamera | Wajib |
| FR-060 | `POST /pipeline/stop` | Hentikan semua pipeline kamera | Wajib |
| FR-061 | `POST /counter/reset` | Reset visitor counter | Wajib |
| FR-062 | `POST /database/reset` | Hapus semua record visitor, reset counter, track, cache, snapshot | Wajib |
| FR-063 | `WS /ws` | WebSocket realtime push (events + statistics) | Wajib |

### 7.8 Realtime (WebSocket + Polling)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-064 | WebSocket sebagai channel realtime utama untuk push event dan statistik ke dashboard. | Wajib |
| FR-065 | Jika WebSocket terputus (≥ 2 gagal reconnect atau max attempts tercapai), sistem otomatis beralih ke HTTP polling fallback. | Wajib |
| FR-066 | Saat WebSocket kembali terhubung, polling fallback dihentikan. | Wajib |
| FR-067 | Dashboard dapat mengirim `date_filter` via WebSocket agar statistik sesuai rentang waktu yang dipilih. | Wajib |
| FR-068 | Connection status (WS connected/disconnected) ditampilkan di UI. | Wajib |

### 7.9 UI Dashboard (Next.js)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-069 | 5 navigasi tab: Stream Feed, Visitor, Employee, History, Settings/Tuning. | Wajib |
| FR-070 | Stream feed dual-kamera dengan overlay (bbox, track ID, visitor ID, classification, garis gate/poligon). | Wajib |
| FR-071 | Statistik panel: total unique visitors, count IN, count OUT, occupancy, FPS, uptime. | Wajib |
| FR-072 | Visitor gallery (tabel terpaginasi): ID, first/last seen, total visits, snapshot, status. | Wajib |
| FR-073 | Employee management: list karyawan, enroll dari kamera atau upload foto. | Wajib |
| FR-074 | History: event log dengan filter tanggal dan paging. | Wajib |
| FR-075 | Settings/Tuning: slider threshold deteksi, tracking, Re-ID, face, gate, near mode; hot-apply tanpa restart. | Wajib |
| FR-076 | Polygon editor visual untuk atur zona gate mode `polygon` (snapshot sebagai background, bukan stream ganda). | Wajib |
| FR-077 | Ambiguous panel untuk konfirmasi identitas manual. | Wajib |
| FR-078 | Pipeline status indicator (running/stopped) dan kontrol start/stop. | Wajib |

### 7.10 Configuration & Tuning

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-079 | Config driven via YAML: `default.yaml` (global) dan `cameras.yaml` (per kamera). Tidak ada magic number di kode. | Wajib |
| FR-080 | Tuning parameter tersedia via API dengan definisi default/min/max/step/deskripsi. | Wajib |
| FR-081 | Perubahan tuning langsung ditulis ke file YAML dan hot-reload ke in-memory object. | Wajib |
| FR-082 | Per-kamera gate geometry (mode, line A/B, polygon, near threshold, guard) dapat diatur via frontend dan backend. | Wajib |

### 7.11 Telemetry

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-083 | Push visitor KPI (total visitors, IN/OUT, occupancy) ke ThingsBoard via HTTP. | Wajib |
| FR-084 | Telemetry tidak mengganggu pipeline utama (async / terpisah). | Wajib |

### 7.12 Database & Storage

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-085 | PoC menggunakan SQLite; produksi mendukung PostgreSQL via config-only change. | Wajib |
| FR-086 | Tabel utama: visitors, employees, cameras, visit_sessions, vis_embeddings, emp_embeddings, snapshots, tracks, ambiguous_identities, events. | Wajib |
| FR-087 | Snapshot disimpan di disk (`./data/snapshots/`) dan path direkam di DB. | Wajib |
| FR-088 | Enrollment karyawan disimpan di `./data/enrollments/`. | Wajib |

---

## 8. Non-Functional Requirements (NFR)

| ID | Kategori | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Performance | FPS deteksi | ≥ 6 (PoC CPU), ≥ 25 (Produksi CUDA) |
| NFR-02 | Performance | CPU thread budget | 1 thread per op (anti-jitter T1) |
| NFR-03 | Reliability | Auto-reconnect kamera saat RTSP putus | Otomatis, eksponential backoff 1s→30s |
| NFR-04 | Reliability | Graceful shutdown | Flush DB write pool sebelum berhenti |
| NFR-05 | Scalability | Event bus swappable | asyncio (PoC) → Redis → Kafka (produksi) |
| NFR-06 | Maintainability | Config-driven | Semua parameter via YAML, hot-reload via API |
| NFR-07 | Security | File upload | Max 5MB, validasi content-type `image/*` |
| NFR-08 | Security | CORS | Terkonfigurasi untuk frontend dashboard |
| NFR-09 | Usability | Tidak perlu restart untuk tuning/gate | Hot-apply real-time |
| NFR-010 | Observability | Health check endpoint | `/status` dan `/health` |
| NFR-011 | Observability | Logging | Structured log (loguru) dengan event detail |
| NFR-012 | Reliability | Database write isolation | Single-worker pool untuk visitor/event writes |
| NFR-013 | Reliability | Idempotent reset | Reset database/counter dapat dipanggil berulang kali |

---

## 9. User Stories

| ID | As a | I want | So that |
|----|------|--------|---------|
| US-01 | Security Officer | Lihat stream live kedua kamera dengan overlay bbox dan visitor ID | Tahu siapa yang sedang masuk/keluar secara realtime |
| US-02 | Security Officer | Lihat daftar orang yang masih di dalam ruangan (inside list) | Mengetahui kapasitas ruangan saat ini untuk keamanan |
| US-03 | Resepsionis | Enroll karyawan dengan foto dan wajah | Karyawan dikenali dan tidak dihitung sebagai pengunjung |
| US-04 | Resepsionis | Konfirmasi identitas ambiguous dari antrian manual | Tidak ada pengunjung yang hilang dari pencatatan karena low confidence |
| US-05 | Manajemen | Lihat statistik total unique visitor, IN/OUT, occupancy | Membuat laporan harian dan analisis traffik |
| US-06 | System Admin | Atur posisi gate line per kamera via slider visual | Menyesuaikan deteksi sesuai letak kamera tanpa restart |
| US-07 | System Admin | Ubah threshold deteksi/Re-ID dan lihat efek segera | Menyesuaikan sensitivitas sistem terhadap kondisi lapangan |
| US-08 | System Admin | Lihat health status database, event bus, orchestrator | Memantau kondisi sistem dan melakukan troubleshooting cepat |

---

## 10. System Architecture (High Level)

### 10.1 Design Philosophy

**Event-Driven + State Machine.** Modul tidak memanggil satu sama lain secara langsung. Komunikasi melalui **Event Bus**. Setiap modul memiliki single responsibility dan hanya subscribe ke event yang relevan.

```
NO:  visitor_engine.resolve(track)           # direct call — FORBIDDEN
YES: event_bus.publish(IDENTITY_REQUESTED)   # event — REQUIRED
```

### 10.2 Per-Camera Pipeline (2 instances)

Setiap kamera menjalankan pipeline independen hingga Track Manager. Identity Resolution dan Visitor Engine bersifat global (shared) untuk menyatukan identitas lintas kamera.

```
FRAME GRABBER → PREPROCESSOR → DETECTOR → TRACKER → TRACK MANAGER → GATE LOGIC
                                                              │
                                                              ▼
                                                       IDENTITY RESOLVER (GLOBAL)
                                                              │
                                                              ▼
                                                       VISITOR ENGINE (GLOBAL)
                                                       EMPLOYEE ENGINE (GLOBAL)
                                                              │
                                                              ▼
                                                       EVENT BUS → API / WS / DB / Analytics
```

### 10.3 Concurrency Model

| Komponen | Konsep | Alasan |
|----------|--------|--------|
| Frame Grabber | 1 thread dedikasi per kamera (full FPS) | Tidak blokir I/O, selalu punya frame terbaru |
| Motion/Timer Gate | Async task per kamera | Pengecekan background subtraction ringan |
| YOLO Detection | Async task per kamera | Heavy, terisolasi |
| ByteTrack + Track Mgr | Async task per kamera | Cepat, in-process |
| Identity Resolver | Async worker (shared) | Re-ID mahal, serialisasi untuk menghindari kontensi |
| Event Bus | Single async event loop | Semua modul async coroutine |
| REST API + WS | Async (FastAPI + uvicorn) | Non-blocking serving |
| Database | Async writes (batched) | Hindari write-per-event stall |

### 10.4 Event Schema (contoh)

- `FRAME_RECEIVED` — frame baru dari grabber
- `PERSON_DETECTED` — deteksi YOLO
- `TRACK_CREATED` / `TRACK_UPDATED` / `TRACK_LOST` — lifecycle track
- `CROSSING_DETECTED` — gate crossing terdeteksi (IN/OUT)
- `IDENTITY_REQUESTED` — permintaan resolusi identitas
- `IDENTITY_RESOLVED` — hasil resolusi (NEW_VISITOR / VISITOR_MATCH / EMPLOYEE_MATCH / AMBIGUOUS)
- `VISITOR_REIDENTIFIED` — visitor dikenal kembali
- `EMPLOYEE_IDENTIFIED` — karyawan dikenal
- `VISITOR_ENTER` / `VISITOR_EXIT` — visitor masuk/keluar ruangan
- `CAMERA_DROPPED` — kamera terputus

---

## 11. Data Model (Ringkasan ERD)

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│  visitors   │       │  employees   │       │   cameras    │
│─────────────│       │──────────────│       │──────────────│
│ id (PK)     │       │ id (PK)      │       │ id (PK)      │
│ visitor_id  │◄───┐  │ employee_id  │   ┌──►│ name         │
│ created_at  │   │  │ created_at   │   │   │ source       │
└──────┬──────┘   │  └──────┬───────┘   │   │ role (IN/OUT)│
       │ 1    * │          │ *       * │   │ line_a_y     │
       ▼        │          ▼           │   │ line_b_y     │
┌─────────────┐   │   ┌──────────────┐   │   │ mode / polygon│
│visit_sessions│   │   │emp_embeddings│   │ └──────┬───────┘
│─────────────│   │   │──────────────│   │          │
│ id (PK)     │   │   │ id (PK)      │   │          │ 1
│ visitor_id  │───┘   │ employee_id  │───┘          │ *
│ entry_at    │       │ embedding    │              ▼
│ exit_at     │       │ anchor_type  │       ┌──────────────┐
│ camera_in   │       └──────────────┘       │   tracks     │
│ camera_out  │       ┌──────────────┐       │──────────────│
│ duration_s  │       │vis_embeddings│       │ id (PK)      │
└─────────────┘       │──────────────│       │ camera_id    │──┐
                      │ id (PK)      │       │ track_id     │  │
                      │ visitor_id   │──┐    │ visitor_id   │  │ *
                      │ embedding    │  │    │ employee_id  │  │
                      │ anchor_type  │  │    │ bbox         │  │
                      └──────────────┘  │    │ state        │  │
                                        │    │ first_seen   │  │
                                        │    │ last_seen    │  │
                                        │    └──────────────┘
```

Tabel tambahan: `snapshots`, `ambiguous_identities`, `events`.

---

## 12. API Overview (Ringkasan)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/status` | System health, FPS, uptime, active tracks |
| GET | `/health` | Detail component health |
| GET | `/statistics` | Analytics metrics |
| GET | `/visitors` | List visitors (paginated, filter tanggal) |
| POST | `/visitors/photo-search` | Cari visitor via foto |
| GET | `/employees` | List karyawan |
| POST | `/employees/enroll` | Enroll karyawan |
| GET | `/config` | Baca config |
| PUT | `/config` | Update config (hot-reload) |
| POST | `/config/tuning` | Update parameter tuning |
| GET | `/api/v1/config/lines` | Baca tripwire per kamera |
| POST | `/api/v1/config/lines` | Update tripwire per kamera |
| GET | `/stream/{camera_id}` | Snapshot frame kamera |
| GET | `/snapshots` | List snapshot |
| POST | `/pipeline/start` | Start pipeline |
| POST | `/pipeline/stop` | Stop pipeline |
| POST | `/counter/reset` | Reset visitor counter |
| POST | `/database/reset` | Reset database & semua state |
| WS | `/ws` | WebSocket realtime push |

---

## 13. UI/UX Requirements

| Area | Requirement |
|------|-------------|
| Navigasi | 5 tab: Stream Feed, Visitor, Employee, History, Settings/Tuning |
| Stream | Dual-kamera side-by-side, overlay bbox/track ID/visitor ID/classification, garis gate & poligon |
| Statistik | Total unique visitors, count IN, count OUT, occupancy, avg FPS, uptime |
| Visitor | Tabel paginasi: ID, first/last seen, total visits, snapshot, status, action |
| Employee | List karyawan, enroll via kamera/upload foto, body+face anchor |
| History | Event log dengan filter tanggal dan paging |
| Tuning | Slider untuk deteksi, tracking, Re-ID, face, gate, near mode; hot-apply |
| Polygon Editor | Visual editor untuk zona gate `polygon` (background snapshot, bukan stream ganda) |
| Ambiguous | Panel konfirmasi manual identitas yang tidak pasti |
| Pipeline | Status indicator running/stopped, tombol start/stop |
| Realtime | Indikator WS connected/disconnected, polling fallback aktif saat WS putus |

---

## 14. Integration & Dependencies

| Komponen | Teknologi | Versi / Catatan |
|----------|-----------|-----------------|
| Deteksi orang | YOLOv8n (`yolov8n.pt`) | CPU / CUDA |
| Re-ID body | OSNet (`osnet_x1_0`) | Embedding 512 dim |
| Face | ArcFace | Deteksi + embedding wajah |
| Pelacakan | ByteTrack | Kalman + IoU matching |
| Backend | FastAPI + Python | uvicorn, asyncio |
| Database | SQLite (PoC) / PostgreSQL (produksi) | SQLAlchemy-ish repository |
| Frontend | Next.js + React | Axios, WebSocket |
| Realtime | WebSocket + HTTP polling | Fallback otomatis |
| Telemetry | ThingsBoard | HTTP push KPI |
| Logging | loguru | Structured logging |
| Config | YAML | `default.yaml`, `cameras.yaml` |
| Model weights | `yolov8n.pt`, OSNet, ArcFace | Didownload otomatis saat startup |

---

## 15. Deployment & Environments

| Phase | Hardware | Resolution | FPS | Cameras | Device |
|-------|----------|------------|-----|---------|--------|
| PoC (saat ini) | Intel Core i5 Gen8, 16GB RAM | 720p | 6–10 | 2 | CPU-only |
| Production | Core i7 + RTX 4050 (CUDA) | 1080p | 25+ | 2 (extensible) | CUDA |

> Sama codebase, perubahan hanya melalui config (device: cpu → cuda, mode: poc → production).

### 15.1 Direktori Data

| Path | Deskripsi |
|------|-----------|
| `./data/visitor_ai.db` | Database SQLite (PoC) |
| `./data/snapshots/` | Snapshot gambar event |
| `./data/enrollments/` | Foto enroll karyawan |
| `./data/` | Root data (config YAML di `./data/config/` atau `config/`) |

---

## 16. Testing Strategy

| Level | Scope | Contoh |
|-------|-------|--------|
| Unit | Setiap modul secara terisolasi (mocked dependencies) | `test_track_manager.py` — state transitions dengan fake tracks |
| Integration | Interaksi multi-modul via Event Bus nyata | `test_pipeline.py` — feed video → assert events teremit |
| End-to-End | Sistem penuh pada video sampel dengan verifikasi manual | Jalankan pada RTSP + test video, verifikasi count & ReID match |
| ReID Validation | Akurasi Re-ID spesifik | Orang dikenal masuk/keluar → harus tetap sama VIS ID |

Test case kunci dari field logs (`kasus-1225`):
- Near mode ENTER/SKIP/OUT pada cam1 dan cam2
- Face veto → AMBIGUOUS → antrian konfirmasi manual
- Cam2 unmatched visitor → di-routing ke AMBIGUOUS (tidak buat VIS ID baru)
- Employee match (EMP ID) → tidak increment visitor count
- Visitor match → VIS ID sama untuk kunjungan berulang

---

## 17. Success Metrics / KPI

| KPI | Target | Cara Pengukuran |
|-----|--------|-----------------|
| Unique visitor count accuracy | ≥ 90% | Bandingkan VIS ID unik vs ground truth manual |
| Re-ID match rate (returning visitor) | ≥ 90% | Orang yang kembali mendapat VIS ID yang sama |
| Employee false-positive rate | < 5% | Karyawan salah dihitung sebagai visitor |
| False count rate (IN/OUT) | < 5% per hari | Cross-check gate count vs visual |
| WebSocket uptime | ≥ 95% | Waktu WS terhubung vs total waktu dashboard aktif |
| FPS | ≥ 6 (PoC), ≥ 25 (Prod) | Monitoring `/status` |
| Telemetry delivery success | ≥ 99% | Kiriman ThingsBoard sukses vs gagal |

---

## 18. Risks & Mitigations

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Orang terlalu dekat ke kamera terpotong frame → YOLO gagal deteksi | Missing count | Turunkan `detection.confidence_threshold` (0.55 → 0.45) via panel Tuning |
| Face confidence rendah → AMBIGUOUS banyak | Beban konfirmasi manual naik | Terima AMBIGUOUS sebagai alur normal; admin konfirmasi lewat panel |
| Cam2 tidak boleh membuat visitor baru | Orang keluar lewat Cam2 tanpa VIS ID | Route ke AMBIGUOUS; konfirmasi manual atau tunggu masuk lewat Cam1 |
| Thread contention (torch/OpenMP) → jitter FPS | Pipeline macet secara acak | T1: set `OMP_NUM_THREADS=1`, `torch.set_num_threads(1)` |
| SQLite write stall saat banyak event | Event loop blokir | Single-worker DB write pool di Visitor Engine |
| WebSocket putus terus-menerus | Dashboard tidak realtime | HTTP polling fallback otomatis (≥ 2 gagal reconnect) |

---

## 19. Roadmap / Phases

| Fase | Fitur Utama | Target |
|------|-------------|--------|
| Fase 1 | Pipeline dasar, line gate, visitor Re-ID (VIS ID) | Selesai |
| Fase 2 | Near mode, polygon gate, employee dual-track, ambiguous queue | Selesai (kasus-1225) |
| Fase 3 | WebSocket primary + HTTP polling fallback, ThingsBoard telemetry | Aktif (branch ini) |
| Fase 4 | Produksi: PostgreSQL, multi-kamera extensible, optimasi CUDA | Rencana |

---

## 20. Appendices

### 20.1 Glossary

| Istilah | Arti |
|---------|------|
| VIS ID | Visitor ID sekuensial (contoh: `VIS000001`) |
| EMP ID | Employee ID sekuensial (contoh: `EMP00001`) |
| Re-ID | Re-identification — mencocokkan orang yang sama lintas deteksi |
| Dedup | Deduplikasi — satu orang tidak dihitung lebih dari sekali |
| Face Veto | Penolakan kandidat karena face score di bawah ambang |
| Ambiguous | Identitas tidak pasti yang butuh konfirmasi manual |
| Dwell | Waktu minimum harus berada di zona dekat sebelum dihitung |
| Hysteresis | Margen anti-flicker saat keluar dari kondisi "dekat" |
| Near Mode | Gate mode berbasis proximity (tinggi bbox) bukan tripwire |
| T1 | Teknik jinjakan thread CPU (1 thread per op) untuk anti-jitter |

### 20.2 Referensi Dokumen

- `docs/TECHNICAL_DESIGN.md` — Arsitektur teknis lengkap
- `docs/NEAR_MODE.md` — Spesifikasi gate mode `near`
- `docs/TRIPWIRE_PER_CAMERA.md` — Konfigurasi tripwire per kamera
- `docs/DEPLOYMENT_WINDOWS.md` — Panduan deployment Windows
- `kasus-1225-A.txt` / `kasus-1225-B.txt` / `kasus-1225-C.txt` — Log lapangan & kasus nyata
- Git branch: `feat/websocket-primary-polling-fallback`

### 20.3 Pertanyaan Terbuka (Open Questions)

1. Apakah multi-site (> 2 kamera) akan di-scale dalam satu instance atau pisah instance per site?
2. Apakah enroll karyawan akan diintegrasi dengan sistem HR/aktif directory exist?
3. Apakah perlu notifikasi push (email/WhatsApp) saat ambiguous menumpuk?
4. Target peluncuran produksi (tanggal dan lokasi)?

---

*Dokumen ini adalah General PRD untuk Visitor-AI Enterprise. Detail implementasi teknis lihat `docs/TECHNICAL_DESIGN.md` dan kode sumber di `backend/` serta `frontend/`.*