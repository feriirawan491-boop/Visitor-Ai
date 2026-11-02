# Visitor AI — Frontend Phase 1–8

Workspace UI lokal berbasis Next.js, TypeScript, Tailwind CSS v4, komponen shadcn/ui yang disesuaikan, Radix Primitives, dan Lucide React. Warna utama blue-500 (`#3b82f6`), font Plus Jakarta Sans untuk UI dan Bebas Neue untuk judul/angka. Light/dark mode mengikuti sistem secara default, dengan pilihan manual tersimpan di browser. Font disajikan lokal.

## Menjalankan

```sh
cd frontend
npm install
npm run dev
```

Buka http://localhost:3000. Pada kunjungan pertama, pilih akun di halaman login demo. Gunakan **Arif Ramadhan / Teknisi berizin** untuk mencoba seluruh fitur operasional Phase 1–3; akun **Naya Putri / Admin Site** memakai izin operasional tanpa tuning. Untuk Phase 5 pilih **Management → Raka Wijaya**. Untuk memakai build produksi lokal, jalankan `npm run build` lalu `npm run start` sebagai pengganti `npm run dev`. Node.js 24+ diperlukan. Dependensi dikunci di `package-lock.json`; gunakan `npm ci` untuk instalasi identik.

## Cakupan Phase 1

- Live Monitoring: dua kamera ilustrasi SVG dengan overlay track, gate dan label demo.
- Gate Configuration: line, partial line, polygon dan near; validasi geometri; preview, simpan dan batalkan perubahan.
- System Health: skenario offline, stale, connecting, pemulihan dan pause preview.
- UI Teknisi / View only, modal aksesibel, navigasi mobile, dan filter contoh crossing.
- Penyimpanan konfigurasi per kamera melalui localStorage dengan validasi format, versi, dan deteksi konflik antar tab.

Kamera, crossing, timestamp awal dan statistik adalah fixture demonstrasi. Tidak ada koneksi CCTV atau penghitungan AI. Angka statistik tidak diubah oleh overlay/editor. Unique visitors dan occupancy kini membaca hasil adapter identitas demo Phase 2. Periode contoh 29 Oktober 2026; employee dikecualikan dari metrik visitor. Pilihan Teknisi/View only hanya simulasi UX, bukan autentikasi. Konfigurasi tersimpan pada browser dan origin yang sama; localhost dan 127.0.0.1 memiliki penyimpanan terpisah.

## Cakupan Phase 2

- **Visitor** (`/#visitors`): pencarian VIS ID, filter tanggal/status, pagination, detail sesi, kunjungan ulang dengan ID sama, placeholder snapshot hilang/kedaluwarsa. Deep link `/#visitors/VIS000001` dapat dimuat ulang.
- **Employee** (`/#employees`): direktori, pencarian/departemen, enrollment JPEG/PNG/WebP ≤5 MB dengan pemeriksaan signature dan decode, preview, review sebelum simpan, dan penolakan nama+departemen duplikat. Webcam diaktifkan hanya atas aksi pengguna dan dihentikan setelah capture/dialog ditutup.
- **Ambiguous** (`/#ambiguous`): queue pending/resolved, kandidat demo, konfirmasi visitor baru/existing/employee dengan catatan dan langkah review. Event asli dipertahankan. Cam2 unknown tetap pending sampai keputusan manual; exit tanpa entry tidak menghasilkan durasi buatan.
- Konfirmasi memperbarui direktori, occupancy, pending badge, dan event demo. Employee tidak menambah visitor count. Data disimpan sebagai satu snapshot lokal berversi; command diserialisasi antar tab memakai Web Locks jika tersedia.
- Data awal: 8 visitor, 4 employee dan 3 item ambiguous. Seluruh profil, confidence, hasil identitas dan statistik merupakan fixture/demo, bukan hasil AI nyata. Tanggal fixture sengaja tetap 29 Oktober 2026.
- Foto upload/capture disimpan lokal dalam format preview JPEG. Tidak ada pengenalan wajah, body/face embedding, photo-search otomatis, atau koneksi CCTV. Foto tidak dikirim ke layanan eksternal.
- Penyimpanan menggunakan `visitor-ai.phase2.identity.v1`. Pilihan tema dan konfigurasi gate tetap memakai key terpisah. Mode View only mencegah enrollment/konfirmasi melalui UI, bukan sistem otorisasi produksi.

## Cakupan Phase 3

- **History** (`/#history`): timeline event visitor/employee/ambiguous, gate crossing, enrollment dan audit tuning. Filter jenis event, arah, kamera, pencarian, pagination, snapshot dan tautan ke direktori identitas. Event disortir menurut timestamp lalu ID; ID stabil mencegah duplikasi saat pembaruan.
- **Global Date Range Filter**: preset dan rentang manual berlaku pada KPI historis, Visitor, dan History. Tanggal menggunakan Asia/Jakarta, tersimpan pada URL `?from=...&to=...`. Occupancy tetap menunjukkan kondisi terkini; Employee dan antrean Ambiguous tidak difilter secara historis. Rentang tidak valid tidak mengubah filter aktif.
- **Settings / Tuning** (`/#settings`): lima kelompok parameter demo, validasi min/max/step, review before/after, alasan perubahan, versioning, audit dan rollback sebagai draft yang perlu dikonfirmasi. Nilai tidak menjalankan model AI atau mengubah hitungan visitor. Definisi min/max/default adalah metadata simulator, bukan kontrak konfigurasi layanan produksi.
- **Realtime lab** (`/#health`): simulasi WS live (heartbeat lokal 3 detik), dua percobaan reconnect lalu polling lokal 5 detik, pemulihan WS, stale/offline dan kondisi sesi/izin/site. Hanya satu timer transport aktif; saat scope/skenario berubah, timer dan pembacaan yang usang dibatalkan. Metrik membaca snapshot identitas, tidak mengincrement counter dari heartbeat.
- **Freshness & data quality**: status koneksi dan waktu pembaruan ditampilkan, gangguan kamera/koneksi ditandai partial. Hasil kosong saat sumber bermasalah tidak dianggap traffic nol. Simulasi sesi berakhir/izin dicabut menyembunyikan media/identitas dan menghentikan subscription; kembali ke workspace harus melalui tombol pemulihan demo.
- **Telemetry**: preview sehat/gagal dengan pesan bahwa gangguan telemetry tidak menghentikan kamera. Tidak ada kiriman ThingsBoard, koneksi WebSocket, atau HTTP polling ke layanan nyata; semua transport menggunakan adapter demo lokal.
- Tidak ada tombol export, reset database, atau penghapusan data yang mengklaim dukungan layanan produksi.
- Konfigurasi disimpan di `visitor-ai.phase3.settings.v1`. Penyimpanan gagal mempertahankan draft, dan perubahan dari tab lain tidak menimpa draft yang sedang diedit.

## Cakupan Phase 4

- **Login demo** (`/#/login`): pilih role dan akun contoh tanpa kata sandi, kondisi normal/timeout/tidak tersedia, kondisi lifecycle sesi ditangguhkan.
- **Admin Site**: hanya operasional pada site yang ditugaskan. Tuning, gate edit dan kontrol pipeline tidak diberikan secara default. Akun teknisi Arif memiliki grant teknis eksplisit untuk SITE-001 dan SITE-002. Mode View only tersedia untuk membatasi aksi demo.
- **Management** (`/#/management/overview`): dashboard agregat read-only Phase 5 untuk site ditugaskan. Identitas, media, tuning dan transport operasional tidak dimuat.
- **Provider** (`/#/provider/overview`): workspace Super Admin Phase 6. Masuk mode dukungan membutuhkan site dan alasan, dicatat pada audit lokal; scope dukungan terbatas pada site Active yang dipilih.
- **SessionProvider / SiteContextProvider / AuthorizedRoute / PermissionGuard**: default deny sebelum sesi dan route siap, batas role/view/site, halaman 403/404, expired/revoked/suspended/unavailable, serta akun tanpa site. Role efektif mengikuti akun demo yang dipilih.
- Logout, expiry, revocation dan perpindahan role/site membongkar runtime lama: dialog/media ditutup, hook/cache tampilan dibersihkan dan timer transport dihentikan. Perubahan metadata sesi disinkron melalui event storage antar tab. Sesi demo berlaku 45 menit.
- Data identity, tuning dan gate dipisahkan per site. SITE-001 mempertahankan key lama agar data Phase 1–3 tidak hilang; SITE-002/003 memakai suffix site. VIS/EMP ID adalah ID lokal di dalam scope site, bukan identitas global lintas lounge.
- URL kanonis mengikuti pola hash yang sudah digunakan: `/#/admin-site/SITE-001/visitors/VIS000001`. Tautan lama seperti `/#visitors` tetap menjadi alias untuk site aktif yang diizinkan. URL tidak dapat menambah site assignment atau grant teknis.
- `visitor-ai.phase4.demo-session.v1` menyimpan pemilihan **akun fiktif**, role efektif, preferensi site dan masa berlaku demo. Tidak ada token, credential, password atau sesi produksi. `visitor-ai.phase4.access-audit.v1` menyimpan audit akses demo, tanpa foto/embedding.
- Guard frontend dan adapter lokal mendemonstrasikan UX izin. Kode ini **bukan batas keamanan, autentikasi atau otorisasi produksi**. Pengguna dengan akses browser tetap dapat mengubah penyimpanan demo.

## Cakupan Phase 5

- **Overview** (`/#/management/overview`): enam KPI berikon, traffic IN/OUT, entries vs unique, ringkasan site, timestamp sumber, versi, coverage, serta snapshot occupancy yang terpisah dari tanggal historis.
- **Visitor Analytics** (`/#/management/visitors`): tren per jam/hari, peak bucket teramati, perbandingan periode sebelumnya dengan panjang sama, serta penjelasan entries versus distinct pengunjung.
- **Duration Analytics** (`/#/management/duration`): mean/median/P90, jumlah sesi selesai, sesi terbuka dan exit tanpa pasangan, distribusi durasi beserta tabel alternatif. Hanya sesi valid berpasangan yang selesai masuk sampel; N=0 menghasilkan N/A.
- **Site Performance** (`/#/management/performance`): tabel site dengan sorting IN/unique/coverage/duration/occupancy serta perbandingan coverage dan uptime sumber.
- **Reports** (`/#/management/reports`): preview dan unduhan CSV UTF-8 ringkasan per site, traffic time series, dan distribusi durasi. Filter, zona waktu, granularitas, versi, timestamp, serta definisi agregasi disertakan. Hanya kolom agregat, tanpa VIS/EMP ID atau media. Sel CSV di-quote dan formula di-escape; nama file memakai metric/tanggal/versi tervalidasi. Export dicatat pada audit demo sebelum unduhan.
- **Filter global**: multi-select site yang ditugaskan, rentang tanggal valid maksimal 366 hari, granularitas per jam/hari, apply/reset eksplisit, dan ringkasan scope aktif. Tersimpan di query hash URL dan mengikuti navigasi/back/reload; deep link laporan mempertahankan scope setelah login Management. Filter URL yang tidak sah ditolak dan dikembalikan ke scope default dengan pesan. Draft belum diterapkan tidak memengaruhi data/CSV.
- **ChartWithTable** memakai SVG lokal tanpa dependency atau telemetri grafik eksternal. Setiap grafik memiliki tabel alternatif; time series dipaginasi agar semua bucket tetap dapat diperiksa pada mobile. Lima layar mendukung light/dark mode dan navigasi mobile.
- **Typed aggregate adapter** terpisah dari repository operational/identity dan tidak membaca penyimpanan Phase 1–3. Request lokal dibatalkan ketika scope berubah; hasil lama tidak ditampilkan pada scope baru. Guard tetap membatasi halaman ini pada workspace Management. Bundle operasional di-load secara dinamis hanya ketika route operasional yang berizin dibuka, agar fixture identitas tidak ikut diunduh pada kunjungan awal Management.
- **Fixture sintetis** tersedia 20–29 Oktober 2026, default 29 Oktober. SITE-002 memiliki 20 menit offline pada 29 Oktober (coverage 98.61%). Tanggal 21 Oktober per site memiliki IN=2, OUT=3, unique=1, 1 sesi selesai 45 menit, 1 sesi terbuka dan 2 exit tanpa pasangan. Tanggal 22 Oktober traffic nol dengan sumber sehat; 20 Oktober seluruh sumber offline. Tanggal di luar fixture adalah data tidak tersedia, bukan nol traffic.
- Unique periode adalah distinct fixture per site, bukan penjumlahan unique bucket. Multi-site menampilkan **jumlah unique per site tanpa deduplikasi lintas site**. Aturan unique global, unknown/ambiguous dan agregasi lintas zona waktu tetap TBD. Fixture recognized-only tidak mengklaim keputusan bisnis final. Durasi memakai sampel representatif 8/23/45/90/150 menit.
- **Uji skenario analytics demo**: sehat nol, offline, tanpa sesi selesai, sumber unavailable, zona waktu tidak kompatibel, ekspor gagal/dilarang, serta koreksi agregat v2. Koreksi mensimulasikan +1 IN pada pukul 10:00 tanggal 29 Oktober per site; notifikasi mempertahankan v1 sampai refresh, lalu KPI/chart/CSV berubah serentak ke v2. Skenario/versi bersifat sementara pada workspace, terpisah dari resolusi identitas operasional nyata. Reload kembali ke fixture v1.
- Statistik historis demo diberi tanggal sumber secara eksplisit, tanpa klaim freshness produksi. Pada zona waktu berbeda, bucket gabungan ditahan; tabel/CSV tetap berlabel waktu lokal masing-masing site. Coverage hilang bukan nol kedatangan. **Belum ada integrasi layanan agregat atau generator laporan; seluruh perhitungan/CSV berjalan lokal di browser.** Manajemen provider tersedia pada Phase 6; data analytics historis tetap memakai adapter agregat tersendiri.

## Cakupan Phase 6

- **Global Overview** (`/#/provider/overview`): enam KPI berikon, total site, instance aktif, kamera online/terpasang, incident, site perlu perhatian, serta akun login. Status global dan detail memakai satu direktori metadata.
- **Site Management** (`/#/provider/sites`): pencarian/filter status/pagination, detail URL `/#/provider/sites/SITE-001` dengan Summary, Cameras, Users, Configuration, Logs. Wizard metadata → dua slot kamera → review/alasan. Nama/instance/perangkat unik; role Cam1 OUTSIDE/IN dan Cam2 INSIDE/OUT tidak boleh duplikat.
- Site baru atau mapping berubah disimpan sebagai **Setup**, pipeline stopped, tanpa mengklaim Active. Validasi setup demo eksplisit memeriksa instance, kedua role, dan perangkat online. Suspend menutup operasi dan menghentikan pipeline demo tanpa menghapus identitas atau laporan historis. Buka kembali mengembalikan Setup sebelum validasi ulang.
- Seed awal: SITE-001 sehat, SITE-002 degraded (CAM-004 offline dan telemetry failed), SITE-003 Setup dengan satu kamera. Inventory mencakup CAM-001–010, termasuk perangkat yang belum dialokasikan. Seluruh perangkat adalah metadata contoh; tidak ada RTSP nyata.
- **User & Access** (`/#/provider/users`): empat akun login awal, filter/search, kelola role Admin/Management, status, grant teknisi, searchable multi-select site dan preview hak/scope. Review before/after dan alasan wajib sebelum simpan. Akun Super Admin pengelola dilindungi dari perubahan/disable melalui UI ini.
- Undangan baru adalah **draft lokal**, tidak mengirim email, membuat password, atau menambah akun login. Ini mempertahankan instruksi empat akun demo. Jumlah dua Admin/satu Management/satu Super Admin adalah seed awal; perubahan role akun yang ditinjau akan mengubah workspace efektif akun tersebut.
- Setiap perubahan akses menaikkan `accessVersion`. Sesi lama akun terkait menjadi revoked dan data/dialog/subscription dibersihkan pada pembaruan direktori lintas tab. Masuk ulang memakai role dan assignment baru. Site suspended/setup ditolak pada route dan adapter operasional; Management tetap dapat meninjau agregat historis site yang ditugaskan.
- **Camera & AI** (`/#/provider/cameras`): mapping per site, role, device, FPS/current range, heartbeat, secret reference dan kredensial masked. Tombol geometri/tuning meminta support purpose sebelum masuk editor Phase 1/3 yang sudah ada. Akses media/identitas tetap tidak dimuat secara default.
- Start/stop/restart pipeline memakai target, before/after, alasan dan acknowledgment; pending menonaktifkan submit dan mencegah duplikasi. Kegagalan menyimpan status lama dan mencatat incident ID. Perintah hanya mengubah metadata lokal. Pipeline/provider camera state menjadi kondisi awal preview operasional ketika runtime site dimuat ulang.
- **System Health** (`/#/provider/health`): health per site, FPS/range, uptime fixture, WS/polling, DB/event bus, telemetry, timestamp snapshot dan timeline gangguan. Skenario healthy/offline/stale memperbarui metadata yang sama di Overview/detail/health, dengan audit. Snapshot historis tidak diklaim sebagai koneksi live.
- **Data & Audit** (`/#/provider/audit`): log perubahan provider dan lifecycle akses Phase 4, filter actor/alasan/incident, action, site, outcome dan periode UTC; tampilan waktu WIB. Detail before/after tanpa payload biometrik. Export CSV membutuhkan review/alasan, mencerminkan filter dan snapshot baris sebelum aksi export dicatat; sel di-quote dan formula di-escape. Export hanya metadata dan ikut diaudit.
- **System Configuration** (`/#/provider/configuration`): shared defaults detection confidence, heartbeat/stale/polling, draft retention policy, telemetry; bounds/step serta relasi stale > heartbeat divalidasi. Diff, alasan, version history dan rollback sebagai versi baru. Defaults tidak otomatis menimpa tuning site. Retention policy tidak menjalankan penghapusan.
- `visitor-ai.phase6.directory.v1` menyimpan snapshot metadata site/device/user/config/audit secara atomik, dengan schema validation, revision check dan Web Locks. Event custom pada tab yang sama dan storage event lintas tab menyegarkan state. Draft tidak ditimpa saat konflik; muat versi terbaru adalah tindakan eksplisit. Penyimpanan gagal mempertahankan draft. Direktori invalid gagal tertutup tanpa menghapus data.
- Mutasi meninjau ulang sesi saat commit dan membatalkan pekerjaan tertunda ketika dialog/workspace ditutup atau sesi hilang. Metadata revision membongkar runtime operasional/agregat lama agar site/role yang berubah tidak meninggalkan cache atau media lama. Bundle provider dan operasional dimuat hanya pada route yang diizinkan.
- State loading, unavailable, no-results, Setup/Suspended, stale, konflik, pending/failure, empty directory (presentasi), export denied, dan unknown site tersedia. Seluruh tujuh halaman, dialog dan varian mobile mempertahankan **font minimum 12px**, light/dark mode, Plus Jakarta Sans, Bebas Neue, dan primary blue-500.
- Tidak ada capability DB reset, counter reset, mass deletion, secret reveal, layanan email atau endpoint provider nyata. **Seluruh alur adalah frontend demo lokal**, bukan autentikasi/otorisasi produksi atau provisioning deployment nyata. Navigasi Entertaint/Protocol tersedia pada Phase 7, tanpa workflow operasional.

## Cakupan Phase 7

- Dua menu Admin Site dengan ejaan persis **Entertaint** dan **Protocol**. Keduanya memakai navigasi yang sama dengan monitoring, tanpa badge, counter, status, kategori orang, atau aturan hitungan baru.
- URL kanonis `/#/admin-site/SITE-001/entertaint` dan `/#/admin-site/SITE-001/protocol`; alias `/#entertaint` dan `/#protocol` mengikuti site aktif yang diizinkan. Deep link dapat dibuka setelah login dan dimuat ulang. Tambahan record ID pada route placeholder ditolak sebagai 404.
- Kedua halaman hanya memuat nama menu, konteks site, judul **Fitur dalam tahap definisi kebutuhan**, penjelasan menunggu definisi/persetujuan, dan pesan eksplisit bahwa belum ada tindakan operasional. Tidak ada form bisnis, visitor list, approval, assignment workflow, status, atau counter.
- Permission `definition:read` hanya untuk role efektif Admin Site pada site Active yang ditugaskan. Management tidak melihat menu dan menerima 403 untuk direct link. Provider, termasuk mode dukungan teknisi, tidak otomatis diberi izin. Belum ada mekanisme grant Provider untuk placeholder.
- Halaman dipisahkan dari runtime operasional: tidak mengimpor atau membaca repository identitas/tuning/gate, tidak memuat fixture individu/media, tidak menjalankan transport realtime atau timer interval, dan tidak melakukan mutation/counter request. Pemuatan dan navigasi berulang tidak mengubah penyimpanan, hitungan, sesi kunjungan, pipeline, atau audit bisnis.
- Shell tetap mendukung tema, profil, navigasi mobile, keyboard/skip link, dan konteks site. Font minimum 12px, Plus Jakarta Sans, Bebas Neue, dan primary blue-500 dipertahankan.
- Template workshop dan decision log disiapkan di [docs/phase7-business-workshop.md](docs/phase7-business-workshop.md). Semua definisi, impact analysis, actor, data, validasi, counting effect, UAT, dan persetujuan tetap TBD / belum disetujui. Tidak ada tanda tangan atau approval yang dibuat atas nama stakeholder.
- Workflow lanjutan membutuhkan revisi FE-07.1/F07.1 terpisah setelah definisi dan persetujuan tersedia. Tidak ada penafsiran bahwa Entertaint adalah kategori `Entertain` atau ID keempat, maupun Protocol adalah SOP, approval, atau hak akses. Kesiapan rilis frontend diperiksa pada Phase 8.

### Empat akun demo

| Akun | Role / scope |
|---|---|
| Naya Putri | Admin, SITE-001, operasional tanpa tuning |
| Arif Ramadhan | Admin dengan izin teknisi, SITE-001 + SITE-002 |
| Raka Wijaya | Management, agregat SITE-001 + SITE-002 |
| Dewi Kartika | Super Admin, dukungan site dengan tujuan tercatat |

Hanya empat akun awal ini tersedia untuk login; role/status/assignment dapat dikelola melalui Phase 6. Sesi browser yang masih merujuk akun demo lama yang sudah dihapus kembali ke halaman login. Akun Arif mempertahankan izin teknis agar gate editor dan tuning tetap dapat dicoba.

Semua ukuran teks UI minimal **12px**, termasuk caption, badge, tabel, kontrol, dialog, dan varian mobile. Font tetap Plus Jakarta Sans dan Bebas Neue. Label SVG mengompensasi ukuran viewBox agar tidak mengecil di bawah 12px saat grafik/kamera diperkecil; layout menyesuaikan dengan teks yang lebih besar.

## Validasi

```sh
npm run typecheck
npm run build
npm run test:e2e
```

Tes browser mengharapkan server lokal aktif di `127.0.0.1:3000` dan Google Chrome pada lokasi standar macOS. Atur `VISITOR_CHROME_PATH` jika Chrome memakai lokasi lain. Screenshot hasil tersimpan di `test-results/`.

## Struktur

- `src/components/dashboard.tsx` — shell, monitoring, gate workspace, health.
- `src/components/camera-scene.tsx` — ilustrasi dan overlay dalam koordinat relatif.
- `src/components/gate-editor.tsx` — editor dan validasi tampilan.
- `src/components/ui/` — komponen shadcn/ui yang disesuaikan untuk design system light/dark; Dialog/Switch memakai Radix.
- `src/lib/demo.ts` — tipe konfigurasi, fixtures, validasi dan penyimpanan.
- `src/app/globals.css` — design tokens dan responsive layout.
- `src/components/identity/` — Visitor, Employee, enrollment, Ambiguous dan komponen bersama.
- `src/lib/identity.ts` — tipe domain, fixture, validasi, repository demo dan metrik.
- `src/lib/use-identity.ts` — state controller dan sinkronisasi antar tab.
- `src/app/identity.css` — gaya responsive light/dark Phase 2.
- `src/components/operations/` — filter global, History, Settings/Tuning dan simulator koneksi.
- `src/lib/history.ts`, `date-range.ts` — normalisasi event dan tanggal site.
- `src/lib/settings.ts`, `use-settings.ts` — definisi parameter, penyimpanan berversi dan audit lokal.
- `src/lib/use-realtime.ts` — state koneksi, pembatalan transport dan lifecycle timer demo.
- `src/app/operations.css` — layout light/dark Phase 3.
- `src/components/access/` — login, session/site providers, guard, profil dan workspace berdasarkan role.
- `src/lib/access.ts` — akun/izin demo, parsing route dan audit akses.
- `src/app/access.css` — halaman akses responsif light/dark.
- `src/components/management/` — lima halaman analytics, FilterBar, AnalyticsCard, grafik/tabel, dan export UX.
- `src/lib/analytics.ts`, `analytics-routes.ts` — kontrak agregat, fixture terpisah, izin scope, CSV dan route Management.
- `src/app/analytics.css` — desain responsif Management Phase 5.
- `tests/phase5.spec.ts` — filter, metrik, kualitas, ekspor, guard dan responsivitas analytics.
- `src/components/provider/` — tujuh halaman Super Admin, wizard site, user scope/review, health, audit dan konfigurasi.
- `src/lib/provider-directory.ts`, `provider.ts`, `use-provider.ts` — schema metadata bersama, command adapter atomik, audit/revision, state controller.
- `src/app/provider.css` — gaya responsif Phase 6 dengan minimum 12px.
- `tests/phase6.spec.ts` — provisioning demo, user scope/revocation, pipeline, audit/config, negative access dan responsive QA.
- `src/lib/site-navigation.ts` — nama dan tipe dua menu Phase 7.
- `src/components/operations/navigation.tsx`, `definition-page.tsx` — navigasi bersama dan halaman definisi kebutuhan tanpa runtime operasional.
- `src/app/definition.css` — placeholder responsif dengan minimum 12px.
- `tests/phase7.spec.ts` — negative permission, deep link, no-side-effect, counting regression, keyboard dan responsive QA.
- `tests/fixtures.ts` — sesi teknisi yang diprovisikan secara eksplisit untuk regresi Phase 1–3.

Acuan: `../Visitor_AI_FRONTEND_PRD_Per_Phase_v1.1/01_FE_AI_GATE_VISUALIZATION.md`, `02_FE_VISITOR_EMPLOYEE_AMBIGUOUS.md`, `03_FE_ADMIN_SITE_REALTIME.md`, `04_FE_AUTH_RBAC_SITE_SCOPE.md`, `05_FE_MANAGEMENT_ANALYTICS.md`, `06_FE_PROVIDER_SUPER_ADMIN.md` dan `07_FE_ENTERTAINT_PROTOCOL.md`. Fase berikutnya dikerjakan setelah instruksi pengguna.


## Phase 8 — Quality dan kesiapan UAT

Super Admin → **Release Readiness** menampilkan bukti QA yang terikat fingerprint source dan konfigurasi build. Bukti hilang atau usang ditandai secara eksplisit. Ringkasan unduhan hanya memuat metadata pemeriksaan; diagnostik frontend bersifat sementara, maksimal 50 referensi tanpa stack, media, identitas, URL, atau credential.

```sh
npm run check:flags
npm run check:release
```

Pemeriksaan release menjalankan lint, TypeScript, unit, build/budget bundle, dan seluruh browser test dengan server QA sendiri pada port 3100. Pemeriksaan flags membangun dua profil rollback pada port 3110. Hasil ada di `artifacts/` dan manifest aman `public/release-evidence.json`. Jalankan flags dahulu, kemudian release tanpa mengubah source di antaranya. Server lokal pengguna tetap terpisah pada port 3000.

`.env.example` berisi konfigurasi demo. Flag FE-04–FE-07 dibaca saat build, bukan izin pengguna. Mode production dan data source API diblokir karena adapter produksi belum diimplementasikan. Build lokal optimal bukan persetujuan go-live. Lihat [runbook](docs/phase8-rollout-runbook.md) dan [lembar UAT](docs/phase8-uat-signoff.md).

## Build di Vercel

- Root Directory: `frontend`.
- Framework Preset: `Next.js`.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: gunakan default framework; jangan isi `.next/static/chunks`.

`npm run build` hanya menjalankan build Next.js. Analisis bundle tidak memakai hook `postbuild` karena lokasi/waktu tersedianya artefak pada hosting dapat berbeda dari lingkungan QA lokal. Jalankan `npm run analyze:bundle` setelah build untuk mengukur bundle secara eksplisit, atau `npm run build:verified` untuk build dan pemeriksaan budget sekaligus. `check:release` dan `check:flags` tetap menggunakan build yang memeriksa budget; artefak hilang/kosong tetap gagal pada pemeriksaan tersebut.

Deployment ini tetap menggunakan adapter demo. Untuk target produksi sebenarnya, persyaratan integrasi dan persetujuan UAT tetap berlaku.
