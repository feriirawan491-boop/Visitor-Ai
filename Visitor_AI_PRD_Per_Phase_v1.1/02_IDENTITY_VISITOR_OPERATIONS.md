# F02 — Visitor Re-ID, Employee & Ambiguous Operations

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
**BASELINE** FR-019–044. Melakukan Identity Resolution global lintas 2 kamera, membuat VIS ID sekuensial, membedakan employee, mengelola visit sessions dan ambiguous queue. Roadmap menyebut identity/employee/ambiguous selesai; status bukti UAT masih diperlukan.

## 2. Alur identitas (existing)
1. `CROSSING_DETECTED` dan track data diterima resolver global.
2. OSNet body embedding dan ArcFace face embedding dicocokkan dengan k-anchor gallery, face veto dan temporal voting.
3. Resolver menetapkan salah satu status: `NEW_VISITOR`, `VISITOR_MATCH`, `EMPLOYEE_MATCH`, `AMBIGUOUS`.
4. Cam1 boleh membuat visitor baru (`VIS000001`, dst). Cam2 yang unmatched **harus** masuk queue ambiguous, bukan membuat VIS baru.
5. Jika employee match (`EMP00001`, dst), engine tidak menambahkan visitor count; event employee tetap dapat dilog.
6. Visitor Engine menghubungkan IN/OUT terhadap session, menyimpan last_seen, status inside/outside, dan total_visits.
7. Admin Site melakukan triage ambiguous bila confidence tidak mencukupi; hasil konfirmasi harus memperbaiki link/aggregation yang terdampak.

## 3. Functional requirements dan acceptance
| Cluster | FR | Requirement spesifik & acceptance |
|---|---|---|
| Resolver | FR-019–025 | OSNet+ArcFace, VIS sequential, same ID return, status 4 jenis, veto/voting/k-anchor; uji return-person, face-noise, impostor |
| Resolver | FR-026–028 | Cam1-only new ID, persistent gallery, low confidence flagged; uji Cam2 unmatched dan restart |
| Visitor Engine | FR-029–034 | Initialize counter DB, record sessions/inside, dedup, async write, meaningful snapshots, orphan event linking; uji restart/latency |
| Employee Engine | FR-035–040 | Enrollment capture/upload, EMP ID/name/dept/role, face+body anchor, persist and match; employee tidak increment visitor count |
| Ambiguous | FR-041–044 | Queue beralasan dan track link, admin pilihan new/existing/employee, UI confirmation; uji resubmit dan conflicting resolution |

## 4. Business rules rinci
| ID | Rule | Acceptance / edge case |
|---|---|---|
| BR-I01 | VIS ID untuk individu yang sama persisten lintas kunjungan | Entry ulang matched → same VIS ID; session baru bila kunjungan sebelumnya ditutup |
| BR-I02 | EMP ID terpisah dari VIS ID | Employee recognized → visitor_unique tidak berubah |
| BR-I03 | Cam2 unknown tidak membuat visitor baru | Flag AMBIGUOUS + reason + camera |
| BR-I04 | Body/face rendah → AMBIGUOUS, bukan force identity | Confidence/reason ditampilkan hanya kepada role authorized |
| BR-I05 | Visit duration dihitung pada pasangan entry/exit valid | Durasi belum final jika exit tidak ditemukan |
| BR-I06 | Correction history tidak menghapus event asli | **PROPOSAL:** correction log append-only agar audit dan re-aggregation |
| BR-I07 | Total human occupancy vs visitor/customer occupancy | **TBD:** PRD menyatakan employee excluded dari visitor count; definisikan occupancy yang dipakai Management secara eksplisit |

## 5. Spesifikasi screen Admin Site
**Visitor:** Search/pagination, VIS ID, snapshot authorized, first/last seen, total_visits, inside/outside badge, detail session list; empty/loading/error/degraded.  
**Employee:** Table EMP ID/name/dept/role, enrollment camera/upload, identity status, edit permitted; prevent duplicate enrollment.  
**Ambiguous Queue:** queue count, reason, originating camera, confidence indication, snapshot, match candidates if available, actions `New Visitor`, `Existing Visitor`, `Employee`, review state; confirmations need actor/time audit.  
**History:** Search event/visit, date filter, camera, event direction, identity status; correction must be traceable.

## 6. Data, API, privacy
**Existing data:** `visitors`, `employees`, `visit_sessions`, `vis_embeddings`, `emp_embeddings`, `snapshots`, `tracks`, `ambiguous_identities`, `events`. **Existing API:** `/visitors`, `/visitors/{id}`, `/visitors/photo-search`, `/employees`, `/employees/enroll`, `/snapshots`. **PROPOSAL:** dedicated resolution command with idempotency key / reason; confirm implementation before adding endpoint.  
Face/body embeddings adalah data biometrik sensitif; Management tidak boleh mendapat snapshot/gallery/embedding; lifecycle retention, dasar pemrosesan, akses admin, dan employee enrollment disclosure perlu approval.

## 7. Acceptance test/UAT
| Test | Setup | Expected |
|---|---|---|
| TC-I01 | A IN, OUT, re-IN | Same VIS ID, event berbeda, sessions konsisten |
| TC-I02 | Enrolled employee melintas | EMP ID, customer count unchanged |
| TC-I03 | Cam2 unknown first | Queued ambiguous; no VIS created |
| TC-I04 | Low face confidence | Flag ambiguous, no confident forced match |
| TC-I05 | Admin resolves ambiguous existing | Event linked, counters recalculated/no duplicate |
| TC-I06 | AI app restart | Galleries and sequential IDs persist |
| TC-I07 | Bad upload or unauthorized actor | Validation reject and no gallery write |

## 8. Quality gate
Re-ID returning-person ≥90%, employee false-positive <5%, unique visitor count accuracy ≥90% adalah **targets dari PRD**, bukan hasil validasi. UAT wajib menggunakan ground truth lapangan dan menyertakan false merge/false split counts. Exit: AI/Backend QA + Ops signoff.
