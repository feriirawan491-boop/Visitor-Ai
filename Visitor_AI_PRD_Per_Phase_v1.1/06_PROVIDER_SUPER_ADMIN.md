# F06 — Super Admin Provider Workspace

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
**ENHANCEMENT** FR-093, FR-097. Provider mengelola deployment/site, user/role, operasional teknis dan sistem health. Tidak mengubah machine-learning logic existing; hanya mengelola konfigurasi dan perimeter akses.

## 2. Sitemap dan desain fungsi
| Menu | Subfeature | Authorized action |
|---|---|---|
| Global Overview | total sites, online cameras, active instances, incidents, summary KPIs | View, drill down per site |
| Site Management | site metadata, timezone, camera/instance mapping, active/suspended | Add/edit/disable, assign |
| User & Access Management | users, role, account status, site assignment | Invite/create, change, revoke, audit |
| Camera & AI Management | camera RTSP (secrets masked), gate geometry, config, pipeline | Inspect, edit, test, limited start/stop |
| System Health | FPS, uptime, RTSP, WS, event bus, DB, ThingsBoard, pipeline | View health, logs, incident context |
| Data & Audit | audit actor action timeline, retention config, support access | Query audit, restricted export, policy control |
| System Configuration | integration keys, service defaults, site policies | Controlled changes, version & rollback |

## 3. Requirements/flows
| ID | Scenario | Preconditions | Expected result |
|---|---|---|---|
| SA-01 | Create site | Provider auth, required metadata | Site created inactive until valid mapping/health |
| SA-02 | Assign two camera roles | Site exists; devices available | Cam1 OUTSIDE/IN, Cam2 INSIDE/OUT; duplicate role invalid |
| SA-03 | Add Admin Site user | User identified + site chosen | User only sees assigned site |
| SA-04 | Assign Management user multiple sites | Selected sites valid | Only aggregate data for that scope |
| SA-05 | Disable user/site | Provider permission | Access blocked and change audited |
| SA-06 | Change gate parameter | Authorized tech, valid range | Change applied, old/new version + reason in audit |
| SA-07 | Pipeline restart | Authorized and confirmed | Safe status transition; incident log |
| SA-08 | DB reset request | Restricted critical permission | Two-stage confirmation, environment/policy guard; production policy TBD |
| SA-09 | Observe failed camera | Health stream timeout | Site flagged degraded, event timestamps visible |

## 4. Business rules
- Every site has `site_id`, display name, timezone, status, owner/provider assignment, and associated **2-camera instance** per current baseline.
- Site disable must not erase historic report data unless separate authorized retention flow.
- Provider support access to biometric records requires purpose-based justification; no unrestricted default download.
- Config changes have target site + before/after + actor + timestamp + reason; rollback option is PROPOSAL.
- Secrets RTSP/API token are never returned in plaintext to browser; changes stored safely.
- Platform-wide reset and mass-deletion must not share an unguarded action with PoC `POST /database/reset`.

## 5. UX screens
Global overview health tiles, site table with filters, site detail tabs (Summary, Cameras, Users, Configuration, Logs), user form with multi-site selector, system-health timeline, incident/error details, config diff/confirm modal, audit searchable list. Screen states: loading, partial/down, unauthorized, no sites, operation pending/fail.

## 6. APIs / data (proposals)
`/provider/sites`, `/provider/sites/{id}`, `/provider/users`, `/provider/site-assignments`, `/provider/health`, `/provider/audit`, `/provider/config-changes` — no claim these exist. Need `sites`, `user_site_assignments`, `audit_logs`, `instance_health` and secret-reference store; new endpoints versioned with OpenAPI.

## 7. UAT
| Test | Expected |
|---|---|
| TC-S01 | Create active site without both required cameras | Rejected / remains setup-incomplete |
| TC-S02 | Suspend site | Client operations blocked as policy; reporting historical preserved |
| TC-S03 | Assign admin site A only | Site B unavailable via UI/API/WS |
| TC-S04 | Role changed Management → Admin site | Permissions updated and old sessions constrained |
| TC-S05 | Tuning request invalid range | No config change; audit failed action |
| TC-S06 | Pipeline restart | Event logged and site freshness changes appropriately |
| TC-S07 | Reset in production without approval | Denied |

## 8. Exit criteria
Site provisioning + user scopes demonstrated end-to-end; remote health visible; action audit complete; production safety guard documented, approved by PO/Engineering/Security.
