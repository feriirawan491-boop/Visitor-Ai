# F08 — Production Deployment, Multi-Site Aggregation & UAT

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
**PLANNED** v1.0 roadmap fase produksi (PostgreSQL, GPU CUDA, multi-camera extensibility) dan tambahan v1.1 reporting multi-site. Fokus production readiness tanpa mengklaim 1 AI engine sudah mendukung lebih dari 2 kamera.

## 2. Deployment topology proposal
`Site Lounge A: Cam1 IN + Cam2 OUT → Edge AI Instance A → Site API/Event Store`  
`Site Lounge B: Cam1 IN + Cam2 OUT → Edge AI Instance B → Site API/Event Store`  
`Central Aggregator → Management aggregated reporting + Super Admin global operations`.

Satu edge instance per lounge adalah **PROPOSAL arsitektur** yang menjaga batas dua kamera existing; strategi centralized GPU/shared clusters adalah alternatif yang harus diuji. Tidak mengubah pipeline core saat scale-out.

## 3. Production prerequisites
| ID | Area | Definition of Ready |
|---|---|---|
| PR-01 | Camera inventory | RTSP credentials via secrets store, codec, FPS, view angle, lighting, NVR restrictions |
| PR-02 | Compute | Pilot on proposed Core i7 + RTX 4050 1080p 25+ FPS, benchmark actual dual stream |
| PR-03 | Database | Migration SQLite→PostgreSQL tested; backup+restore; index/site scoping |
| PR-04 | Identity | Stable VIS/EMP namespace per site and deterministic cross-site aggregation |
| PR-05 | Networking | TLS/VPN, private stream, firewall, no public RTSP, time synchronization |
| PR-06 | Reliability | RTSP reconnect, WS polling fallback, local buffer & replay strategy **PROPOSAL** |
| PR-07 | Governance | Retention, biometric consent/legal basis, audit, access policy signed |
| PR-08 | Observability | Camera/AI latency, FPS, backlog, telemetry errors, data quality alert |
| PR-09 | Disaster Recovery | Tested backups, restore time objective RTO/RPO **TBD** |

## 4. Core quality targets inherited from PRD
- Unique visitor count accuracy ≥90%; Re-ID match rate ≥90% for return visitors.
- Employee false-positive <5%; IN/OUT false count <5% per operation day.
- WS connected ≥95% active dashboard time; telemetry successful ≥99% sends.
- FPS ≥6 for CPU PoC and ≥25 for production CUDA as PRD-defined target.
- **These are targets, not verified results.** Define labeled dataset, evaluation window, CI, edge cases, environment and owner before signoff.

## 5. End-to-end UAT matrix
| ID | Scenario | Roles | Expected |
|---|---|---|---|
| UAT-E01 | Normal single visitor IN→OUT | Admin Site | One VIS, paired session, occupancy restored |
| UAT-E02 | Revisit within same report period | Admin Site/Management | Entry counted again, unique once if matched |
| UAT-E03 | Employee repeatedly enters | Admin Site/Management | Excluded visitor KPIs; employee operation track |
| UAT-E04 | Cam2 unknown EXIT | Admin Site | Ambiguous queued; not silently created new VIS |
| UAT-E05 | Manual ambiguous resolution | Admin Site | Correct link and aggregated stats revised |
| UAT-E06 | 2 people near door / reverse | AI QA | Direction, duplicate, false count within target |
| UAT-E07 | Cam offline / WS fallback | All | Degraded visible, no invented traffic, delayed sync |
| UAT-E08 | Management requests site outside scope | Management | Deny on API, WS and export |
| UAT-E09 | Provider updates site assignment | Super Admin | Correct access propagation + audit |
| UAT-E10 | Production destructive action | Super Admin | Safeguards, multi-step confirmation, audit |
| UAT-E11 | Entertaint/Protocol placeholders | Admin Site | Only approved menu shell, zero counting impact |
| UAT-E12 | Restore edge instance & DB | Ops | Recover correct IDs, health, historical counts |

## 6. Migration & rollout steps
1. Snapshot existing version, database schema, YAML config, snapshot file store, model versions.
2. Validate target site camera/NVR and local infrastructure; performance test in PoC mode.
3. Apply PostgreSQL migration in staging, validate VIS/EMP sequence and sessions; provide rollback script.
4. Harden API/WS/file access and secrets; validate three-role matrix with adversarial tests.
5. Pilot one lounge on shadow/parallel counting vs manual ground truth; reconcile discrepancies.
6. Enable role workspaces and central aggregation only after site scoping verified.
7. Go/no-go review: metrics, P0 defects, privacy approval, support/on-call, backup restore.
8. Progressive rollout; daily QA reconciliation, alerting and support SOP.

## 7. Operational runbook and incident categories
- Camera down (reconnect state, last good event, affected period).
- Re-ID ambiguous surge (camera angle/lighting/model drift; review queue).
- KPI mismatch between edge and management aggregator (compare event_id, timezone, corrections).
- WS down with polling active (UX freshness; capacity risk).
- Database write lag or corrupted gallery (backup/restore and integrity checks).
- Unauthorized access attempt (alert, token revoke, audit investigation).

## 8. Release acceptance & signoff
PO/Product, Site Ops, AI/Backend/Frontend leads, QA, Security/Legal, DevOps. Critical P0 tests pass; exceptions documented; incident response and rollback tested. Open decisions: number of sites, intended deployment topology, exact NFR SLA, ownership and rollout dates.
