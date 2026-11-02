# F01 — Core AI Camera Pipeline & Bidirectional Counting

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen induk:** PRD-VISITOR-AI-ENT-001 v1.1 (29 Oktober 2026)  
**Status:** Draft untuk review stakeholder dan engineering  
**Sifat fase:** implementasi existing / enhancement sebagaimana dijelaskan di bawah

## Konvensi dan kendali perubahan
- **BASELINE** = tercantum di PRD v1.0/v1.1; bukan bukti implementasi sudah lulus pengujian. **ENHANCEMENT** = tambahan v1.1. **PROPOSAL** = detail rekomendasi BA/PM yang harus disetujui. **TBD** = membutuhkan keputusan stakeholder.
- Setiap perubahan model recognition, nilai threshold, dan rules counting harus diverifikasi terhadap kode dan field logs; PRD tidak otomatis mengubah implementasi.
- Untuk seluruh data sensitif (face/body embeddings, snapshot, visitor profile), wajib diberlakukan otorisasi server-side, audit, dan kebijakan retensi yang disahkan; management hanya menerima statistik agregat.
- Notasi P0 = wajib sebelum release fase, P1 = penting, P2 = pengembangan berikutnya.

## 1. Tujuan dan status
**BASELINE** FR-001–FR-017 (FR-018 tidak tercantum di PRD induk; jangan dibuat ulang). Memastikan 2 kamera CCTV existing di satu pintu menghasilkan deteksi, track, serta crossing events yang benar. Roadmap induk menyebut fase pipeline dasar selesai; fase ini menuntut bukti regression/UAT.

## 2. Aktor, scope, out-of-scope
- Admin Site: melihat stream dan health; tidak otomatis boleh tuning (lihat F04).
- Super Admin / teknisi berizin: setup kamera, gate geometry, debug pipeline.
- Management: **tidak** melihat stream atau status objek individual.
- In scope: RTSP capture, frame preprocessing, YOLOv8n, ByteTrack, ROI, 4 gate modes, camera restart/reconnect, event `CROSSING_DETECTED`.
- Out: identity matching, employee exclusion, visual analytics agregat, customer expiry.

## 3. Alur utama
1. Cam1 (OUTSIDE) dan Cam2 (INSIDE) menerima stream secara independen; keduanya memantau pintu fisik yang sama.
2. Frame grabber mengelola latest frame dan reconnect; preprocessor ROI/letterbox.
3. Detector YOLOv8n menghasilkan bounding boxes; ByteTrack menghasilkan track id **sementara per kamera**.
4. Gate logic menilai track trajectory, zona asal/tujuan, dwell, guard, dan arah.
5. Setelah crossing valid, publish event yang membawa camera_id, direction, track_id, occurred_at, snapshot reference; handoff ke F02.
6. Jika stream offline, pipeline menyatakan degraded dan menghentikan klaim freshness; event yang tidak diamati tidak dibuat sintetis.

## 4. Requirement detail + acceptance criteria
| ID | Requirement spesifik | Acceptance / test evidence |
|---|---|---|
| FR-001 | Role kamera Cam1 OUTSIDE/IN, Cam2 INSIDE/OUT | Konfigurasi kedua kamera terbaca dan label arah benar |
| FR-002 | Per-camera isolated frame grabber dan auto-reconnect | Putus RTSP satu kamera tidak menghentikan yang lain; reconnect terukur |
| FR-003 | Threshold person detection konfigurabel | Nilai tervalidasi dan perubahan memengaruhi hasil uji |
| FR-004 | ByteTrack dengan IoU/max-lost config | Track continuity diuji pada orang berpapasan dan occlusion |
| FR-005 | Crop ROI + letterbox | Dimensi koordinat bbox kembali sesuai frame asli |
| FR-006 | Pipeline independen hingga track manager | Isolation test 2 kamera, shared resolver input terjaga |
| FR-007 | Start/stop seluruh pipeline | Aksi authenticated/audited menurut F04; status sinkron |
| FR-008 | Gate mode line/partial_line/polygon/near | Validasi tiap mode, geometry invalid ditolak |
| FR-009 | Two-Line A→B arah valid | Crossing arah target tercatat satu kali; reverse tidak salah hitung |
| FR-010 | Partial line memakai x start/end | Crossing di luar segmen tidak dihitung |
| FR-011 | Polygon min 3 titik; forward progress | Polygon invalid ditolak; edge crossing diuji |
| FR-012 | Near mode menggunakan bbox real frame, dwell, hysteresis | Test batas threshold dan flickering |
| FR-013 | Guard edge left/right; policy receding/always | Uji re-entry dari tepi dan track yang mengecil |
| FR-014 | Fast walker first detected in zone | Fast walker diuji terhadap video berlabel |
| FR-015 | Reverse B→A skip/log only (mode sesuai spesifikasi) | Tidak menambah crossing target |
| FR-016 | Net progress guard | Jitter lokal di garis tidak menghasilkan false crossing |
| FR-017 | Emit crossing event dengan metadata + crop | Event tervalidasi dan tidak di-publish ganda |

## 5. Business rules
- **BR-G01** Cam1 bertanggung jawab deteksi arah IN; Cam2 arah OUT menurut konfigurasi *existing*; ini tidak disamakan dengan satu kamera dua arah.
- **BR-G02** Kejadian crossing (traffic) belum sama dengan unique visitor; butuh resolusi F02.
- **BR-G03** Satu track / gate transition tidak menghasilkan dua event identik; dedup event_id (PROPOSAL penambahan metadata jika belum ada).
- **BR-G04** Stream down → kualitas periode degraded; traffic gap tidak ditebak.
- **BR-G05** Koordinat line/polygon disimpan per camera, tidak hardcode global.

## 6. UI spesifik
Stream Feed: dua tile kamera, label cam role, pipeline status, frame/stream stale state, overlay bbox + track ID + counting lines; admin tuning permission dipisahkan dari view; error camera panel memuat last-seen dan recover state.

## 7. Data/API contract
**Existing:** `/status`, `/health`, `/stream/{camera_id}`, `/api/v1/config/lines`, `/pipeline/start|stop`; gate geometry YAML per camera. **PROPOSAL event envelope:** `{event_id, site_id, camera_id, track_id, direction, occurred_at_utc, snapshot_ref, quality_flags}`; verifikasi schema existing sebelum migration.

## 8. UAT scenarios
| Test | Step singkat | Expected |
|---|---|---|
| TC-G01 | 1 customer Cam1 IN | 1 valid crossing IN |
| TC-G02 | 1 orang mendekat lalu mundur | Tidak false count |
| TC-G03 | 2 orang berpapasan | Direction masing-masing benar pada camera role |
| TC-G04 | Orang terpotong/fast walker | Hasil sesuai ground-truth; error tercatat |
| TC-G05 | Cam1 disconnect, Cam2 stabil | Cam2 tetap berjalan, Cam1 degraded |
| TC-G06 | Ubah polygon sebagai teknisi | Hot apply, audit; non-authorized forbidden |

## 9. Performance / exit
NFR existing: FPS PoC ≥6 CPU, production ≥25 CUDA, auto-reconnect exponential 1–30 s; false count rate <5%/hari **target pengujian**, belum verified. Signoff: AI Lead, QA Lead, Operations.
