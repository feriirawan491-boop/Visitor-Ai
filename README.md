# Visitor AI

Frontend dashboard Visitor AI untuk demonstrasi lokal, mencakup monitoring, identitas visitor/employee, operasional, akses berbasis role/site, analytics Management, Provider Workspace, serta kesiapan rilis frontend Phase 1–8.

## Menjalankan aplikasi

Gunakan Node.js 24+.

```sh
cd frontend
npm ci
npm run dev
```

Buka http://127.0.0.1:3000. Login demo menyediakan dua akun Admin, satu Management, dan satu Super Admin, tanpa kata sandi.

Panduan fitur, akun, validasi, dan batasan tersedia di [frontend/README.md](frontend/README.md). Contoh konfigurasi aman tersedia di [frontend/.env.example](frontend/.env.example).

## Isi repository

- `frontend/`: aplikasi Next.js, TypeScript, Tailwind CSS, shadcn/ui, Radix, Lucide, serta tes.
- `Visitor_AI_FRONTEND_PRD_Per_Phase_v1.1/`: kebutuhan UI/UX dan frontend per fase.
- `Visitor_AI_PRD_Per_Phase_v1.1/`: referensi kebutuhan sistem per fase.
- `PRD_VISITOR_AI_ENTERPRISE*.md`: referensi kebutuhan umum.

## Status

Aplikasi memakai data dan adapter demo lokal. Guard frontend bukan autentikasi atau otorisasi produksi. Kamera dan identifikasi AI nyata belum terintegrasi. Kesiapan go-live menunggu integrasi dan persetujuan UAT terkait.

Dependensi terpasang, hasil build, artefak tes, dan file `.env` pribadi tidak disertakan. Setelah clone, jalankan pemeriksaan pada source dan konfigurasi setempat; bukti QA dari build lain dapat ditandai usang.
