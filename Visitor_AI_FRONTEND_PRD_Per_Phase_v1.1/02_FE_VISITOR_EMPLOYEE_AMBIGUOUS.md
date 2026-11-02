# FE-02 — Visitor, Employee, Ambiguous UX

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F02 FR-019–044, F03 FR-048–052 and FR-072–077. **Delivery:** BASELINE AUDIT / UX refinement.

## User journey and screen inventory
1. `Visitor List` → filter/search → `Visitor Detail` with visit sessions / snapshots (where authorized).
2. `Employee List` → `Enroll Employee` (capture or upload) → validation → confirmation → list refresh.
3. `Ambiguous Queue` → inspect reason/evidence → choose new visitor/existing visitor/employee → confirm → review outcome.
4. `History` cross-links to visitor where permitted; no presumption all identities resolved.

## Screen FE-02.1 — Visitor List & Detail
| Element | UI behavior |
|---|---|
| Summary | Optional total unique, inside count **from API**, accurate current period label |
| Table | VIS ID, snapshot permitted, first/last seen, total_visits, inside/outside, identity status |
| Controls | Search, date filters, status, pagination, show counts, reset filters |
| Detail | VIS ID, identity status, visit session timeline entry/exit, duration, snapshot provenance |
| Edge cases | no snapshot, unresolved ambiguous, missing exit, deleted/expired media, stale API |
| Privacy | No raw embeddings; photo search only if permission and API support; no auto downloading media |

## Screen FE-02.2 — Employee
- List `EMP ID`, employee name, department, role, enrollment status, last seen if supported; avoid claiming nonexistent fields.
- Enrollment: explicit file/camera source; name/dept/role input as in PRD; preview image, validation max 5 MB and `image/*` server checked.
- Frontend validates size and accepted MIME subtype agreed with backend; never rely solely on extension or client-side MIME.
- Separate capture consent/information screen only after legal/security copy approved; upload error, duplicate enrollment, camera unavailable, network retry.
- Employee count never incremented as visitor by frontend; rendering uses backend classification.

## Screen FE-02.3 — Ambiguous Queue
- Queue cards: snapshot if permitted, event camera, event time, reason, confidence if available, current resolution status.
- Actions: `Mark New Visitor`, `Link Existing Visitor`, `Confirm Employee` only if backend endpoints and permission exist; confirm with identity and evidence context.
- Pending queue resolution and concurrent operator conflict require state-aware errors; optimistic count recalculation is forbidden.
- Show explicit **unresolved** state; do not imply low confidence equals identified person.

## Core interactions
| ID | User action | FE behavior |
|---|---|---|
| V-01 | Search visitor by ID | Debounced query and cancellable previous request |
| V-02 | Open visitor detail | Authorized fetch, skeleton, 404 and 403 separate |
| V-03 | Open exit without entry match | Display incomplete session, no fabricated duration |
| E-01 | Submit employee enrollment | Validate, show progress, prevent duplicate submit |
| E-02 | Upload bad file | Inline accessible error, no request for clearly invalid file |
| A-01 | Resolve ambiguous visitor | Confirm, send mutation once, show server authoritative result |
| A-02 | Two admins resolve same item | Conflict state and refetch, do not overwrite silently |

## Integration & dependencies
- Existing documented endpoints `GET /visitors`, `/visitors/{id}`, `POST /visitors/photo-search`, `GET /employees`, `POST /employees/enroll`, `GET /snapshots`.
- **Ambiguous resolution endpoints not explicitly enumerated in source PRD API summary**; request signed contract from backend instead of inventing an existing URL.
- API states should distinguish `unknown`, `ambiguous`, `confirmed`, `employee`, `visitor`, not derive identity from UI image itself.

## Acceptance / UAT
| Test | Expectation |
|---|---|
| FE-I01 | A IN/OUT/re-IN shown under same VIS ID and distinct session/events |
| FE-I02 | EMP event remains employee-classified in lists and metrics |
| FE-I03 | Cam2 unknown appears pending ambiguous, not fake new VIS |
| FE-I04 | Unmatched face shows unknown/ambiguous, no fake certainty |
| FE-I05 | Resolving queue refreshes visitor, events, stats, and queue coherently |
| FE-I06 | File >5MB rejected; server MIME failure surfaced |
| FE-I07 | No permission to view snapshot returns placeholder and 403 state |
| FE-I08 | 360 px mobile tables remain navigable without losing action semantics |

## Deliverables
Visitor and Employee pages, detail screen, enrollment modal/page, Ambiguous queue and resolution modal, typed data adapters, 403/404/loading/empty/degraded states, accessibility and component tests.
