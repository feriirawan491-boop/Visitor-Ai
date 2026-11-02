# Phase 8 — UAT frontend

Status: implementasi dan QA frontend lokal. Persetujuan produksi belum diberikan.

Bukti otomatis yang berlaku adalah public/release-evidence.json apabila source dan profil cocok dengan build. artefak lengkap berada di artifacts/. Tidak ada tanda tangan stakeholder yang dibuat oleh aplikasi.

| Area | Bukti / status |
|---|---|
| Lint, TypeScript, unit, build, browser | Manifest hasil check:release |
| Rollback FE-04–FE-07 | Manifest check:flags, dua build terpisah |
| Aksesibilitas | axe WCAG 2 A/AA dan 2.1 AA pada layar yang diuji, keyboard skip/dialog |
| Responsive | 1440, 1280, 1024, 768, 390, 360 dan landscape 844×390 |
| Pembesaran | Reflow viewport 720×450 DPR2 sebagai pemeriksaan otomatis; zoom browser nyata 200% dan screen reader masih perlu UAT manual |
| Kinerja | Budget bundle lokal; bukan hasil Core Web Vitals lapangan atau SLA |
| Regresi | Phase 1–7, empat akun demo, scope role/site, penyimpanan lokal |

## Gerbang eksternal yang masih menunggu

| Gerbang | Pemilik | Persetujuan |
|---|---|---|
| Adapter data/API dan kontrak error nyata | TBD | Pending |
| Autentikasi dan otorisasi authoritative | TBD | Pending |
| Kebijakan media, privasi dan retensi | TBD | Pending |
| UAT pengguna dan persetujuan bisnis | TBD | Pending |
| AI, infrastruktur, backup dan pemulihan | TBD | Pending |

FE-07 masih berupa placeholder definisi kebutuhan. Kelulusan tes frontend tidak menyetujui workflow bisnis tersebut. Fixture identitas dan agregat adalah simulasi, bukan bukti akurasi AI.

## Lembar persetujuan

| Field | Value |
|---|---|
| Build / commit | Fingerprint manifest; workspace lokal belum memiliki commit |
| Environment / site | Local demo / SITE-001, SITE-002, SITE-003 fixtures |
| FE Owner | TBD |
| QA Owner | TBD |
| Product Owner | TBD |
| F01–F03 regression evidence | artifacts/playwright-results.json |
| F04–F07 acceptance evidence | artifacts/playwright-results.json dan laporan flags |
| Open P0 defects | Belum disahkan; gerbang eksternal di atas tetap terbuka |
| Known P1 and mitigations | TBD melalui review UAT |
| Release approval | Pending |
