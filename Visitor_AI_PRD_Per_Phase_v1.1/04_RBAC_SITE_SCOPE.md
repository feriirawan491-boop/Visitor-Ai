# F04 — Authentication, RBAC & Site-Level Authorization

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
**ENHANCEMENT** FR-089, FR-091–094, FR-097. Memisahkan **Management / Admin Site Lounge / Super Admin Provider** tanpa menduplikasi AI engine. Prioritas P0 dan prerequisite untuk management multi-site serta provider tools.

## 2. Actor and permissions
| Resource/action | Management | Admin Site Lounge | Super Admin |
|---|---|---|---|
| Aggregate KPIs/reports | Read/export authorized sites | Read own site | Read all sites |
| Live Cam/snapshot/identity | Deny | Read assigned site | Authorized support only (audited) |
| Visitor/employee/ambiguous | Deny | Operate assigned site | Authorized support only (audited) |
| AI settings/gate | Deny | Deny by default; explicit technician permission | Manage, audited |
| Pipeline start/stop | Deny | Deny by default | Manage, audited |
| Counter/database reset | Deny | Deny | Restricted high-risk operation + approval/confirmation |
| Site & user management | Deny | Deny | Manage |
| Entertaint/Protocol operations | Deny | Menu visible; actions TBD | Policy control TBD |

## 3. Functional specifications
| ID | Rule / user story | Acceptance |
|---|---|---|
| SEC-01 / FR-089 | Authenticated user has role + site_scope | Every API, WS handshake, export, file path filters by role/site |
| SEC-02 / FR-090–091 | Management aggregate-only | No identity fields or stream endpoint even via URL/direct API |
| SEC-03 / FR-092 | Site admin isolated | Site-A token request for Site-B data → deny, including ids enumerated |
| SEC-04 / FR-093 | Provider administers roles/site | Account creation/update/revocation auditable |
| SEC-05 / FR-094 | Site and timezone attribution | All reports reference site_id, timezone with explicit conversion |
| SEC-06 / FR-097 | Restricted controls | Server checks explicit permission, records actor/time/site/action/outcome |
| SEC-07 / PROPOSAL | Least privilege & session expiry | Session renewal/revoke; inactive disabled users denied promptly |
| SEC-08 / PROPOSAL | Secure object access | Snapshot/embedding cannot bypass API authorization via public filesystem |

## 4. Flow & API design proposal (not existing contracts)
- Login→server creates session/access token→client uses role-aware navigation; backend verifies signature, expiry, role and site claims.
- Scope query must be derived from authenticated principal, not trusted from client `site_id` alone.
- WebSocket validates on connect and every subscription/filter change; unauthorized subscribe rejected.
- Role-sensitive action has request ID/idempotency key where needed and audit event.
- **PROPOSAL** endpoints: `/auth/login`, `/auth/me`, `/auth/logout`, `/admin/users`, `/admin/sites`, `/admin/roles/permissions` — names to confirm with engineering.

## 5. Threat/negative tests
| Test | Expected |
|---|---|
| Management opens `/stream/cam1` | 403, no frame bytes |
| Management fetches individual VIS record | 403, no identity payload |
| Site-A admin changes query to Site-B | Deny even with guessed IDs |
| WS subscribe to site not assigned | Reject/close unauthorized channel |
| Direct reset API call by site admin | 403, no state change |
| Super Admin action logged | actor, target site, request/correlation ID, result, reason |
| Disabled user reuses token | Rejected per revocation policy |

## 6. Data model changes (proposal)
`sites(id, code, timezone, status)`, `users(id, status)`, `roles`, `permissions`, `user_site_assignments`, `audit_logs`. Add `site_id` to events/visitors/employees/sessions/snapshots according to engine ownership; alternatively create explicit local↔global ID mapping. Plan migration and uniqueness constraints; **do not** simply rename current sequential VIS IDs.

## 7. UI/UX
Distinct left navigation per role; no disabled controls that reveal sensitive metadata; clear 403/expired session states; site switcher only for authorized users; confirm critical actions with target site, consequence, and reason.

## 8. DoD
All P0 permission matrix tests pass under API/WS/file routes, audit persists, security review signoff, with no regression on existing Admin Site operations.
