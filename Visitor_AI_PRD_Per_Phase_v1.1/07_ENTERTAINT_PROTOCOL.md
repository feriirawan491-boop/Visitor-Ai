# F07 — Admin Site Entertaint & Protocol (Controlled Scope)

**Produk:** Visitor-AI Enterprise — Airport Lounge  
**Dokumen induk:** PRD-VISITOR-AI-ENT-001 v1.1 (29 Oktober 2026)  
**Status:** Draft untuk review stakeholder dan engineering  
**Sifat fase:** implementasi existing / enhancement sebagaimana dijelaskan di bawah

## Konvensi dan kendali perubahan
- **BASELINE** = tercantum di PRD v1.0/v1.1; bukan bukti implementasi sudah lulus pengujian. **ENHANCEMENT** = tambahan v1.1. **PROPOSAL** = detail rekomendasi BA/PM yang harus disetujui. **TBD** = membutuhkan keputusan stakeholder.
- Setiap perubahan model recognition, nilai threshold, dan rules counting harus diverifikasi terhadap kode dan field logs; PRD tidak otomatis mengubah implementasi.
- Untuk seluruh data sensitif (face/body embeddings, snapshot, visitor profile), wajib diberlakukan otorisasi server-side, audit, dan kebijakan retensi yang disahkan; management hanya menerima statistik agregat.
- Notasi P0 = wajib sebelum release fase, P1 = penting, P2 = pengembangan berikutnya.

## 1. Status dan prinsip
**ENHANCEMENT: FR-096 MENU ONLY.** PRD General v1.1 hanya menyatakan ada dua menu **Entertaint** dan **Protocol** untuk Admin Site. Daftar kebutuhan awal menyebut `Custom 4th Uniq ID as Entertain`, tetapi **tidak** mendefinisikan bahwa menu Entertaint identik dengan klasifikasi tersebut. `Protocol` belum dijelaskan sebagai workflow, person category, atau layanan operasional. Jangan mengarang data form, approval, hitungan, atau integrasi.

## 2. Minimum scope yang boleh diimplementasikan sekarang
| ID | Requirement | Acceptance |
|---|---|---|
| EP-01 | Side navigation Admin Site memuat `Entertaint` | Menu terlihat hanya bagi Admin Site yang diizinkan |
| EP-02 | Side navigation Admin Site memuat `Protocol` | Menu terlihat hanya bagi Admin Site yang diizinkan |
| EP-03 | Management tidak memiliki akses operasional kedua menu | Hide menu + direct route/API deny |
| EP-04 | Halaman placeholder menjelaskan `Feature definition pending approval` | Tidak menampilkan form, counter atau data fiktif |
| EP-05 | Analytics/unique/occupancy belum diubah oleh kedua menu | Existing counting regressions tetap pass |
| EP-06 | Change request perlu disetujui sebelum fitur workflow | Decision record + scope + UX + data model + UAT |

## 3. Discovery questions / decision log
| Tema | Pertanyaan wajib | Dampak |
|---|---|---|
| Definisi | Entertaint: kategori orang, jenis kunjungan, atau workflow layanan? | Entity/data and navigation |
| Definisi | Protocol: staf, kategori pengunjung, SOP, atau proses persetujuan? | Business rules & actor |
| Kepemilikan | Role siapa boleh view/create/update/approve? | Permission matrix |
| Input | Data apa yang dimasukkan, dari kamera atau manual? | Form, validation, audit |
| Output | Status / laporan / alert apa yang dibutuhkan? | Read models, notifications |
| Identitas | Ada hubungan ke VIS/EMP ID atau ID keempat? | Re-ID/gallery model |
| Counting | Hitungan apa yang berubah? employee/visitor/human occupancy? | KPI consistency & migration |
| Privacy | Apakah perlu nama, wajah, ticket data, atau durasi akses? | Legal, retention, permissions |
| Integrasi | Dari aplikasi lounge lain atau berdiri sendiri? | API contract |

## 4. Template requirement untuk workshop (belum diisi)
| Field | Entertaint | Protocol |
|---|---|---|
| Business goal | TBD | TBD |
| Trigger | TBD | TBD |
| Primary actor | TBD | TBD |
| Input data | TBD | TBD |
| Validation | TBD | TBD |
| State transitions | TBD | TBD |
| Output / KPI | TBD | TBD |
| Access control | TBD | TBD |
| Effect on VIS/EMP/AMB | TBD | TBD |
| UAT examples | TBD | TBD |

## 5. Proposed workflow for change approval
Stakeholder walkthrough → confirmed glossary → as-is/to-be flow → impact analysis against F02 and F05 → acceptance criteria → UI wireframes → API/data contract → security/privacy review → estimate and prioritization → signed change request → build & UAT.

## 6. Provisional UAT
- Admin Site can navigate into both menu placeholders (not mock operational data).
- Management cannot access routes directly.
- New menu has no side effect on traffic, unique IDs, occupancy, employee exclusion, visit sessions, or telemetry.
- Once business rules confirmed, generate a separate PRD revision F07.1 with scenarios, CRUD flows, validations, error states and traceability.

## 7. Out of scope until stakeholder signoff
Automatic visitor categorization as Entertaint; status Protocol; whitelist-based bypass; priority lounge access; customer expiry calculation; external booking integrations. All are potential interpretations, **not approved requirements**.
