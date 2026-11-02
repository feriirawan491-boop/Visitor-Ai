# Phase 8 — Runbook lokal

Gunakan Node.js 24+, npm ci, kemudian npm run check:flags dan npm run check:release. Kedua perintah mengelola server QA sendiri. Jangan menjalankan keduanya bersamaan. Setelah lulus, jalankan npm run start untuk mengakses build lokal pada port 3000.

Build deployment memakai `npm run build` tanpa hook laporan bundle. QA release dan rollback memakai `npm run build:verified`, yang menjalankan build lalu `npm run analyze:bundle` secara wajib. Analisis eksplisit gagal jika chunk hilang atau kosong; kondisi tersebut tidak dianggap lulus budget. Untuk Vercel, gunakan Root Directory `frontend`, preset Next.js, dan Output Directory default framework.

Manifest public/release-evidence.json hanya berlaku untuk fingerprint source dan profil yang sama. Perubahan source/package lock/config mengharuskan QA ulang. Manifest bukan tanda tangan, autentikasi, ataupun approval produksi. artifacts/ menyimpan laporan lokal; jangan memublikasikan laporan mentah sebagai diagnostik pengguna.

## Rollback

Salin .env.example ke .env.local untuk preferensi lokal bila perlu. NEXT_PUBLIC_PHASE4_ACCESS_ENABLED=false menutup seluruh aplikasi sebelum provider sesi aktif. NEXT_PUBLIC_PHASE5_ANALYTICS_ENABLED=false menutup analytics; NEXT_PUBLIC_PHASE6_PROVIDER_ENABLED=false menutup Provider dan mode dukungannya; NEXT_PUBLIC_PHASE7_DEFINITIONS_ENABLED=false menutup dua placeholder. Nilai harus literal true atau false. Build ulang diperlukan dan direct link tetap ditutup. Flag tidak menambah izin role dan tidak menghapus penyimpanan pengguna.

Untuk kembali ke versi sebelumnya, gunakan salinan source dan package-lock.json yang telah lolos QA, npm ci, lalu build dan QA ulang. Simpan data browser pada origin yang sama; jangan membersihkan localStorage sebagai langkah rollback. Port QA 3100/3110 terpisah dari origin pengguna 3000. Jangan menjalankan dev dan start pada output .next yang sama secara bersamaan.

## Batas rilis

NEXT_PUBLIC_APP_MODE hanya mendukung demo; NEXT_PUBLIC_DATA_SOURCE hanya demo. Production/API ditolak saat build. Variabel publik yang menyerupai secret ditolak tanpa mencetak nilainya. Credential tidak boleh dimasukkan ke bundle frontend.

Lazy loading memisahkan dashboard, gate editor, analytics dan Provider. Budget sementara: total JavaScript gzip 1.5 MiB, chunk terbesar 256000 byte. Ukuran ini bukan waktu muat lapangan. Validasi jaringan lambat, zoom browser nyata, screen reader, perangkat fisik dan persetujuan stakeholder masih membutuhkan sesi UAT manual. Error boundary menyediakan referensi frontend acak dan retry tanpa mengirim payload error; referensi bukan ID insiden backend.

Produksi tetap menunggu semua gerbang eksternal pada lembar UAT. Tidak ada deployment, migrasi backend, koneksi kamera nyata, atau pengiriman telemetry dari implementasi ini.
