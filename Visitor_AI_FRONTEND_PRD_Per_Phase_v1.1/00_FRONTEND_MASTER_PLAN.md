# Frontend Master Plan & Delivery Governance

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen:** Frontend/UI-UX Specific PRD v1.1  
**Tanggal:** 29 Oktober 2026  
**Referensi:** `PRD_VISITOR_AI_ENTERPRISE_v1.1_GENERAL.md` dan `Visitor_AI_PRD_Per_Phase/00–08`  
**Status:** Draft untuk Product, UI/UX, Frontend, Backend, QA review

> **Batasan:** Dokumen ini hanya mencakup pengalaman pengguna, UI, state frontend, kontrak integrasi, dan frontend testing. Tidak mengimplementasikan model AI, event bus, database, RTSP decoder, atau backend service. `BASELINE` = terdokumentasi, **bukan bukti** fitur telah lolos UAT; `ENHANCEMENT` = kebutuhan baru; `PROPOSAL` = keputusan desain yang memerlukan persetujuan; `TBD` = aturan bisnis belum tersedia.

## 1. Product outcome dan target pengguna
- **Management:** hanya statistik dan analytics agregat dari site yang diizinkan; tidak melihat wajah, ID, event operasional individual, kamera atau pengaturan.
- **Admin Site Lounge:** operasional pada site yang diizinkan: Stream Feed, Visitor, Employee, History, Settings/Tuning berdasarkan izin, Ambiguous Queue, dan dua menu tambahan Entertaint dan Protocol.
- **Super Admin Provider:** pemilik konfigurasi global, site, user, AI/camera management, system health, data/audit. Tindakan kritis memakai izin khusus.

## 2. Scope boundary frontend
**In:** information architecture, sitemap dan navigation, dashboard layout, data visualization, forms, empty/error/loading/success/degraded states, role-based UI, accessible design, responsive desktop/tablet/mobile, typed API integration, WebSocket and polling UI, telemetry freshness, frontend auth/session handling, route isolation, export user experience, client performance, testing, storybook/design system.

**Out:** model AI/re-ID, penghitungan real dari video, konfigurasi backend behavior, database migration, ThingsBoard push, server security policy, server-side token issuance, legal basis/retention policy definition, hardware sizing. Frontend **menampilkan** hasil API, tidak mengarang atau menghitung ulang final AI counts.

## 3. Phase mapping — jaga konsistensi PRD induk
| ID | Fase FE | Sumber | Pelaksanaan |
|---|---|---|---|
| FE-01 | AI gate visualization & camera UI | F01 | Audit BASELINE, enhance UI hanya jika gap |
| FE-02 | Visitor, Employee, Ambiguous UX | F02 | Audit BASELINE |
| FE-03 | Admin Site Dashboard & realtime | F03 | Audit/stabilkan BASELINE |
| FE-04 | Login, RBAC, site context | F04 | ENHANCEMENT |
| FE-05 | Management Analytics Read-Only | F05 | ENHANCEMENT |
| FE-06 | Super Admin Provider Workspace | F06 | ENHANCEMENT |
| FE-07 | Entertaint & Protocol navigation | F07 | ENHANCEMENT menu only, workflows TBD |
| FE-08 | Production readiness, accessibility, UAT | F08 | RELEASE GATE |

## 4. Sitemap v1.1 dan route proposal (harus diselaraskan dengan existing routing)
```text
/login
/admin-site/[siteId]/stream
/admin-site/[siteId]/visitors
/admin-site/[siteId]/visitors/[visitorId]
/admin-site/[siteId]/employees
/admin-site/[siteId]/history
/admin-site/[siteId]/ambiguous
/admin-site/[siteId]/entertaint         [placeholder, TBD]
/admin-site/[siteId]/protocol          [placeholder, TBD]
/admin-site/[siteId]/settings          [permission-gated]
/management/overview
/management/visitor-analytics
/management/duration-analytics
/management/site-performance
/management/reports
/provider/overview
/provider/sites
/provider/sites/[siteId]
/provider/users
/provider/cameras-ai
/provider/system-health
/provider/audit
/provider/system-config
/403, /404, /unavailable
```
Routes adalah **PROPOSAL**. Jangan mengganti URL existing tanpa migration/redirect dan tes regression.

## 5. Matriks hak akses frontend (server tetap otoritatif)
| Resource | Management | Admin Site | Super Admin |
|---|---|---|---|
| Statistik agregat | Read assigned sites | Read assigned site | Read all authorized |
| Camera stream/snapshot | Deny | Read authorized | Authorized technical access |
| Visitor/employee individual | Deny | Read/update sesuai permission | Scoped support access |
| Ambiguous resolution | Deny | Resolve sesuai permission | Support-permission only |
| Tuning, line/polygon | Deny | Conditional | Authorized tech |
| Site/user provisioning | Deny | Deny | Authorized |
| Destructive reset | Deny | Deny | Restricted + confirmation + backend checks |
| Entertaint/Protocol | Deny | Menu/placeholder | Governance/admin view only jika disetujui |

## 6. Cross-cutting UX standards
- Desktop first untuk monitoring, **responsive sejak wireframe**: 1440/1280/1024/768/390/360 viewport uji. Pada mobile analytics, chart boleh horizontal scroll dengan label dan tabel alternatif; stream dual camera menjadi single-column; tidak menyembunyikan warning.
- Navigation: persistent sidebar desktop, drawer mobile, keyboard focus, active state, breadcrumbs, page title, site context.
- Data feedback: loading/skeleton, empty, error, permission denied, network offline, stale, partial data, pending-save, conflict, retry.
- Form: label, helper, required, inline errors, accessible live region; konfirmasi destructive berbeda dari Save umum.
- ID/timestamp: tampilkan waktu site timezone; label data refresh; definisi traffic vs unique jelas dalam tooltip dan detail metrik.
- Charts: warna bukan satu-satunya pembeda; tabel data alternatif; timezone dan periode terlihat.
- Media privasi: masked previews by default where applicable; no automatic caching of sensitive media; minimize thumbnail exposure in list.

## 7. Recommended frontend engineering baseline (PROPOSAL)
- Next.js App Router + TypeScript strict; pertahankan versi dan stack aktual repository sampai audit selesai.
- Feature-based folders (`features/stream`, `visitors`, `employees`, `management`, `provider`), shared `components/ui`, `lib/api`, `lib/auth`, `lib/realtime`, `config`.
- Typed DTO/contract, runtime schema validation at API boundary (mis. Zod), `fetch` wrapper with normalized API errors, abort requests on filter/navigation changes.
- Server components untuk layout/initial authorized aggregate data jika cocok; client components hanya untuk stream, charts interaktif, form dan WS.
- Reusable components: `KpiCard`, `DataTable`, `StatusBadge`, `FilterBar`, `CameraTile`, `EventTimeline`, `PermissionGuard`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `ChartCard`.
- Design tokens dari design system proyek yang disetujui; jangan tetapkan warna/brand baru tanpa sumber.
- Lint, typecheck, unit tests, component tests, end-to-end smoke, production build pada CI.

## 8. Cross-phase Definition of Done
1. UI Figma/annotated wireframe disetujui; journeys dan design states lengkap.
2. Setiap requirement FE mempunyai test ID dan evidence; tidak ada dummy KPI di production.
3. Hak akses diuji terhadap menu, URL langsung, fetch, WS, export dan media endpoint (dengan backend tests koordinasi).
4. Accessibility: keyboard, focus, labels, contrast, tables/chart alternatives; target WCAG 2.2 AA sebagai PROPOSAL.
5. Responsive diverifikasi pada matriks viewport; tidak ada critical layout overflow.
6. Kegagalan WS, loading lama, kamera mati, dan data historis parsial memiliki UI state.
7. Tidak ada token, RTSP URL atau biometric data pada console log, URL params, public cache, maupun analytics pihak ketiga.

## 9. Dependencies, ownership, approvals
| Deliverable | Owner utama | Dependency |
|---|---|---|
| UI IA, design system, wireframes | UI/UX | BA/Product signoff |
| Typed API integration | FE Engineer | OpenAPI + auth contract BE |
| Charts/aggregation semantics | FE + Product | Metric definitions backend |
| Role/scoping | FE + BE/Security | Backend enforcement |
| AI setup visualization | FE + AI Engineer | Geometry and stream contracts |
| UAT & regression evidence | QA + FE | Stable environment and fixture videos |

**Open Decisions:** detail Entertaint/Protocol, Management access to capacity vs customer counts, multi-site timezone policy, permission for tuning, realtime data freshness SLA, snapshot retention policy, existing component library, exact backend endpoints for v1.1.
