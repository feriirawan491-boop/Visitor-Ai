# FE-04 — Login, Role-Based Access & Site Context

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F04, v1.1 FR-089, 091–094, 097. **Delivery:** ENHANCEMENT. Critical dependency for FE-05/06.

## Pages and routes
`Login`, `Unauthorized 403`, `No Assigned Site`, `Session Expired`, optional site switcher, per-role landing/redirect.

## User stories
- A Management user accesses only aggregates across authorized sites and cannot navigate to operational screens.
- An Admin Site user sees operational routes for assigned site only.
- Provider Super Admin can manage authorized sites with explicit permission for critical actions.

## Login UX (PROPOSAL)
- Identity input and credential fields **only if existing identity provider uses passwords**; do not assume auth method. Include error per field, busy state, generic invalid credential message, safe redirects.
- Authenticated user with multiple roles gets explicit effective workspace and site context; avoid silently expanding privileges.
- Expired session modal leads to re-auth; do not keep showing sensitive snapshots after expiry.

## Authorization behavior
| Route | Management | Admin Site | Super Admin |
|---|---|---|---|
| `/management/*` | Yes scoped | No by default | As policy |
| `/admin-site/[siteId]/*` | Deny | Assigned site only | Support permission |
| `/provider/*` | Deny | Deny | Provider only |
| `/admin-site/[siteId]/settings` | Deny | Permission dependent | Tech permission |
| sensitive endpoint direct | Server enforcement required | Server enforcement required | Server enforcement required |

## Frontend rules
- Build `SessionProvider`, `PermissionGuard`, `SiteContextProvider`, `AuthorizedRoute` wrappers **but client-side guard is only UX**, not authorization boundary.
- On login/role or site change, invalidate cached queries, stop WS subscriptions, clear sensitive media, reconnect with new scope.
- Store no high-sensitivity credentials in localStorage or URL; prefer backend-approved httpOnly secure session model.
- Never infer scope from user-editable `siteId` alone. Every request must be authorized server-side.
- Default deny on missing permission fields; do not render UI briefly before ACL loads (prevent flash of restricted data).

## UI states
Loading session, login rejected, account suspended, no site assignment, 403 forbidden, 404 unknown site, backend unavailable, temporary session refresh, role revoked while page open, simultaneous tabs.

## Acceptance tests
| ID | Test | Expected |
|---|---|---|
| FE-A01 | Management visits Stream URL | 403, no thumbnails or cached data |
| FE-A02 | Site A admin changes URL to site B | Forbidden, content cleared |
| FE-A03 | Role revoked during active WS | WS closed, UI cleared, restricted route inaccessible |
| FE-A04 | Management downloads report | Aggregate only (server validates) |
| FE-A05 | Admin Site does not have tuning permission | Controls hidden and mutation denied by API |
| FE-A06 | Logout while visitor detail open | Media, queries and session state removed from view |
| FE-A07 | Page reload at deep link | Authorized route survives, unauthorized fails safely |
| FE-A08 | Network timeout during auth | Retry safely; no duplicate mutation or redirect loop |

## FE deliverables / handoff
Authentication user flow, role matrix tokens, signed API auth contract, routing guards, site switcher, 403/expired UI, negative e2e tests; security review jointly with backend.
