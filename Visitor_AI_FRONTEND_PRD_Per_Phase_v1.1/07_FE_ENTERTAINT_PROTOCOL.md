# FE-07 — Entertaint & Protocol (Navigation-Only Until Signoff)

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

**Source:** F07; General v1.1 FR-096. **Delivery:** ENHANCEMENT, **MENU ONLY**. Entertaint / Protocol operational definitions are **TBD**.

## Approved UI scope now
- Admin Site sidebar shows **Entertaint** and **Protocol** as distinct menu items using stakeholder-provided spellings (do not silently rename Entertaint to Entertainment).
- Clicking opens titled placeholder `Fitur dalam tahap definisi kebutuhan` with explicit no-action message.
- Management cannot see or navigate these pages; direct route attempt forbidden.
- No form, mocked visitor list, badge, status, counter, approvals, assignments, or downstream counting mutation added.
- Provider view of placeholder only if explicitly assigned; not assumed.

## Screens FE-07.1 and FE-07.2
| Screen | Elements | Excluded |
|---|---|---|
| Entertaint | heading, short pending-description, support contact text optional if supplied | visitor category rule, business form, analytics |
| Protocol | heading, short pending-description, support contact text optional if supplied | SOP steps, approvals, person category, access rights |

## Validation/discovery checklist before feature build
1. Business definition for each term (person classification, service process, or workflow?).
2. Primary actor/actions (view/create/edit/confirm/approve) and secondary stakeholders.
3. Input data and source, identity linking (VIS/EMP ID), privacy classification.
4. State machine, required validations, error/retry and audit.
5. Counting/unique/occupancy effect (if any); access expiry effect.
6. Approved integration/API and UAT scenarios.

## Acceptance & negative tests
| ID | Scenario | Result |
|---|---|---|
| FE-EP01 | Admin Site opens Entertaint | Placeholder render with exact menu name |
| FE-EP02 | Admin Site opens Protocol | Placeholder render with exact menu name |
| FE-EP03 | Management tries either deep link | Forbidden; no operational data |
| FE-EP04 | Load placeholders repeatedly | No mutation/counter request |
| FE-EP05 | Existing visitor stream / stats regression | Unchanged by new navigation |
| FE-EP06 | Future approval granted | Separate FE-07.1 PRD required before implementation |

## Deliverables
Sidebar additions, placeholder screens, route permission tests, signed business workshop template; no new workflow implementation.
