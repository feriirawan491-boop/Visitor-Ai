# Visitor-AI Enterprise — Paket PRD Spesifik Per Fase

**Baseline:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` (2026-10-29).

Dokumen per fase dibuat sebagai pemecahan detail, **bukan** penggantian implementasi existing.

## Dokumen

1. `00_MASTER_PLAN.md` — peta fase, scope, dependency, governance, UAT gates.
2. `01_CORE_AI_GATE.md` — pipeline YOLO/ByteTrack, CCTV, gate modes, counting validation.
3. `02_IDENTITY_VISITOR_OPERATIONS.md` — Re-ID, VIS/EMP, visitor, employee, ambiguous.
4. `03_SITE_DASHBOARD_REALTIME.md` — Admin Site, REST, WebSocket, polling, ThingsBoard.
5. `04_RBAC_SITE_SCOPE.md` — authentication, management/admin/provider permissions, site isolation.
6. `05_MANAGEMENT_ANALYTICS.md` — aggregate-only dashboard, metric dictionary, reports.
7. `06_PROVIDER_SUPER_ADMIN.md` — provider site/user/config/health/audit workspace.
8. `07_ENTERTAINT_PROTOCOL.md` — two menus with safe placeholder and business rules TBD.
9. `08_PRODUCTION_MULTISITE_UAT.md` — production readiness, scale-out proposal, master UAT.

**Keterangan status:** BASELINE = tercantum di PRD terdahulu (tidak otomatis sudah UAT); ENHANCEMENT = kebutuhan baru; PROPOSAL = perlu persetujuan; TBD = belum cukup definisi untuk implementasi.

**Critical clarification:** Versi awal menggunakan dua kamera untuk satu pintu lounge. AI architecture multi-site belum menjadi fitur v1.0. Access expiry dan rincian Entertaint/Protocol masih TBD.
