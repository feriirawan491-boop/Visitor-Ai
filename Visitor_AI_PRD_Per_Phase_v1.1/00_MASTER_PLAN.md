# Master Delivery Plan — PRD Per Fase

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen induk:** PRD-VISITOR-AI-ENT-001 v1.1 (29 Oktober 2026)  
**Status:** Draft untuk review stakeholder dan engineering  
**Sifat fase:** implementasi existing / enhancement sebagaimana dijelaskan di bawah

## Konvensi dan kendali perubahan
- **BASELINE** = tercantum di PRD v1.0/v1.1; bukan bukti implementasi sudah lulus pengujian. **ENHANCEMENT** = tambahan v1.1. **PROPOSAL** = detail rekomendasi BA/PM yang harus disetujui. **TBD** = membutuhkan keputusan stakeholder.
- Setiap perubahan model recognition, nilai threshold, dan rules counting harus diverifikasi terhadap kode dan field logs; PRD tidak otomatis mengubah implementasi.
- Untuk seluruh data sensitif (face/body embeddings, snapshot, visitor profile), wajib diberlakukan otorisasi server-side, audit, dan kebijakan retensi yang disahkan; management hanya menerima statistik agregat.
- Notasi P0 = wajib sebelum release fase, P1 = penting, P2 = pengembangan berikutnya.

## 1. Objective dan batasan
Memecah General PRD v1.1 menjadi spesifikasi implementasi yang dapat ditelusuri dan diuji tanpa mendesain ulang engine yang telah dikembangkan. Konfigurasi **satu pintu fisik, dua kamera existing** tetap dipertahankan: Cam1 OUTSIDE/IN dan Cam2 INSIDE/OUT; pipeline per kamera independen, identity resolver shared.

## 2. Peta fase dan status sumber
| Fase | Nama | Asal | Status menurut General PRD | Artefak |
|---|---|---|---|---|
| F01 | Core Detection, Tracking & Gate | v1.0 FR-001–017 | Diklaim selesai di roadmap; UAT belum dibuktikan | `01_CORE_AI_GATE.md` |
| F02 | Re-ID, Visitor, Employee, Ambiguous | v1.0 FR-019–044 | Diklaim selesai di roadmap; UAT belum dibuktikan | `02_IDENTITY_VISITOR_OPERATIONS.md` |
| F03 | API, Realtime, Site Dashboard, Telemetry | v1.0 FR-045–088 | Aktif pada branch yang tercantum; perlu verifikasi | `03_SITE_DASHBOARD_REALTIME.md` |
| F04 | Access Control, RBAC & Site Scoping | v1.1 FR-089, 091–094, 097 | ENHANCEMENT | `04_RBAC_SITE_SCOPE.md` |
| F05 | Management Analytics & Reporting | v1.1 FR-090, 095, 098 | ENHANCEMENT | `05_MANAGEMENT_ANALYTICS.md` |
| F06 | Provider Super Admin | v1.1 FR-093, 097 | ENHANCEMENT | `06_PROVIDER_SUPER_ADMIN.md` |
| F07 | Entertaint & Protocol Menu Extension | v1.1 FR-096 | MENU ONLY; detail TBD | `07_ENTERTAINT_PROTOCOL.md` |
| F08 | Production, Multi-Site & UAT | v1.0 roadmap F4 + v1.1 multi-site | Planned | `08_PRODUCTION_MULTISITE_UAT.md` |

**Penting:** F01–F03 adalah *workstreams verifikasi baseline*, bukan pengakuan development dari nol. F04–F08 adalah *delivery workstreams* yang perlu dikonfirmasi estimation dan dependensinya. Penomoran ini adalah struktur dokumen per fase; roadmap v1.0 Fase 4 tetap bermakna production.

## 3. Dependency dan gate keputusan
1. F01 dan F02 menyediakan event/counting yang tervalidasi → F03 menampilkan data operasional.
2. F04 (authorization backend dan site scoping) **harus selesai** sebelum akses F05/F06 dipublikasikan lintas site.
3. F05 membutuhkan definisi event, timezone, data completeness, dan metode aggregation yang konsisten.
4. F06 membutuhkan site registry, authorization, audit log, dan mekanisme operator override.
5. F07 boleh menampilkan placeholder menu, **tidak boleh** mengklaim proses bisnis aktif tanpa keputusan Entertaint/Protocol.
6. F08 adalah release gate: akurasi, kualitas data, keamanan, privasi, backup, dan operasional.

## 4. Deliverable lintas fase
| Deliverable | Owner usulan | Evidence/exit |
|---|---|---|
| Requirement traceability | BA/PM | Setiap FR menunjuk test dan bukti UAT |
| UX flows / wireframe | Product Designer | Review Admin Site, Management, Provider |
| API contract & auth | Backend Lead | OpenAPI, schema, unauthorized tests |
| Counting / Re-ID validation | AI Lead + QA | Dataset video berlabel, scorecard |
| Security/privacy review | Security/Legal + PO | Retensi, biometrik, access review |
| Deployment/runbook | DevOps/Operations | Restore, rollback, monitoring drill |
| UAT signoff | Product Owner + Site Operations | Critical tests pass, open risks accepted |

## 5. Risk & assumption register
| ID | Risiko / asumsi | Mitigasi atau keputusan |
|---|---|---|
| R01 | Kamera existing tidak cocok untuk crop wajah | Survey dan benchmark lapangan sebelum target Re-ID disahkan |
| R02 | VIS ID permanen bentrok antar instance/site | Tetapkan global ID atau composite `(site_id, local_vis_id)`; TBD |
| R03 | Penghitungan traffic customer vs total manusia berbeda | Definisikan KPI pelanggan dan coverage employee secara eksplisit |
| R04 | Cam2 unmatched menghasilkan exit tanpa visitor baru | Tetap masuk AMBIGUOUS; observasi counting vs visitor identity dipisahkan |
| R05 | Multi-site belum supported engine >2 cam/instance | Satu edge instance per site + aggregator pusat sebagai proposal, bukan fakta |
| R06 | Access expiry disebut sebelumnya, tidak didukung data hak akses | Pending scope, perlu sumber eligibility, jangan implementasi asumtif |
| R07 | Menu Entertaint/Protocol belum terdefinisi | Workshop stakeholder, change request sebelum backend/workflow dibuat |

## 6. Definition of Done (seluruh fase)
- Acceptance criteria semua P0 dinyatakan **Pass** dengan referensi bukti dan data uji.
- Role authorization diuji untuk akses lintas site, API, WS, export, dan file/snapshot.
- Telemetry dan health/freshness diberi status ketika kamera offline; laporan tidak menyamarkan gap.
- Tidak ada reset/destructive operation tanpa otorisasi dan audit; pembatasan prod disepakati.
- Changelog, deployment instructions, runbook, rollback, serta user training tersedia.

## 7. Proposal urutan pengerjaan (tanpa komitmen jadwal)
Baseline verification F01→F02→F03, kemudian F04 sebagai fondasi security, F05 dan F06 bisa berjalan paralel setelah kontrak event & scope stabil, F07 setelah business signoff, lalu F08 untuk rollout dan UAT final. Estimasi sprint, biaya, target tanggal, pemilik aktual: **TBD**.
