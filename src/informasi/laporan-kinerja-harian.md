---
goal: Implementasi Fitur LKH dengan Dukungan Foto (Online) dan Metadata Profil Lengkap
version: 2.0
date_created: 2025-01-03
status: 'Planned'
tags: ['feature', 'LKH', 'google-drive', 'google-sheets', 'profile']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Rencana ini mencakup pembuatan modul Laporan Kinerja Harian (LKH) yang sesuai dengan format standar (PDF). Fitur ini mencakup input data kinerja, upload bukti foto ke Google Drive (hanya saat online), sinkronisasi data ke Google Sheets, dan pengaturan profil pegawai lengkap untuk kebutuhan header laporan.

## 1. Requirements & Constraints

- **REQ-001**: Aplikasi harus menyediakan form input LKH: Kegiatan, Output, Volume, Satuan, Keterangan, dan Bukti Foto (Opsional).
- **REQ-002**: **Fitur Foto**: Foto harus diupload ke folder "Laporan Kinerja (App Guru)" di Google Drive. Link foto harus disisipkan ke kolom "Keterangan" di Spreadsheet. Fitur ini hanya aktif saat online.
- **REQ-003**: **Metadata Profil**: Aplikasi harus menyimpan data tambahan di Pengaturan: NIP, Pangkat/Golongan, Jabatan, Unit Kerja, Nama Atasan, NIP Atasan.
- **REQ-004**: **Spreadsheet**: Aplikasi harus membuat/mengisi Spreadsheet dengan kolom: No, Hari/Tanggal, Kegiatan, Output, Volume, Satuan, Keterangan (berisi teks + link foto).
- **REQ-005**: Data LKH (Teks) harus tersimpan di IndexedDB (`lkh` table) agar bisa diakses offline.
- **CON-001**: Tidak menyimpan blob/file foto di database lokal (Dexie), hanya URL-nya (jika ada).

## 2. Implementation Steps

### Implementation Phase 1: Enhanced Settings & Database Schema

- GOAL-001: Menyiapkan penyimpanan data profil lengkap dan skema tabel LKH.

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-001 | Update `src/db.js`: Tambahkan tabel `lkh` dengan skema `++id, date, activity, output, volume, unit, note, photoUrl, isSynced`. |           |      |
| TASK-002 | Update `src/pages/PengaturanPage.jsx`: Tambahkan input field untuk `nip`, `rank` (Pangkat/Gol), `position` (Jabatan), `workUnit` (Unit Kerja), `supervisorName` (Nama Atasan), `supervisorNip`. |           |      |
| TASK-003 | Update logic `handleSaveProfile` di `PengaturanPage.jsx` untuk menyimpan data baru tersebut ke tabel `db.settings`. |           |      |

### Implementation Phase 2: Drive & Sheets Service Logic

- GOAL-002: Implementasi logika upload foto ke Drive dan tulis data ke Sheets.

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-004 | Update `src/services/driveService.js`: Pastikan fungsi `uploadPhotoToFolder` (dari diskusi sebelumnya) tersedia dan mengembalikan `webViewLink`. |           |      |
| TASK-005 | Update `src/services/driveService.js`: Buat fungsi `findOrCreateLkhSheet`. Header Spreadsheet: `No, Hari/Tanggal, Kegiatan, Output, Volume, Satuan, Keterangan`. |           |      |
| TASK-006 | Update `src/services/driveService.js`: Buat fungsi `appendLkhRow`. Logika: Terima parameter `(date, activity, output, volume, unit, note, photoUrl)`. Gabungkan `note` dan `photoUrl` di kolom Keterangan. |           |      |

### Implementation Phase 3: LKH Page & Logic

- GOAL-003: Membuat antarmuka pengguna untuk input LKH dengan penanganan kondisi Online/Offline.

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-007 | Buat file `src/pages/LkhPage.jsx`. Tambahkan layout form input sesuai REQ-001. |           |      |
| TASK-008 | Implementasi `Network Status Detection`: Gunakan `navigator.onLine` atau event listener `online/offline` untuk mendeteksi koneksi. Disable input file foto jika offline. |           |      |
| TASK-009 | Implementasi `handleSubmit` di `LkhPage.jsx`: <br>1. Jika ada foto & online: Upload foto dulu -> dapat Link. <br>2. Simpan data teks + link ke Dexie (`db.lkh`). <br>3. Panggil `appendLkhRow` untuk sync ke Sheets. |           |      |
| TASK-010 | Implementasi List View di `LkhPage.jsx`: Tampilkan riwayat LKH hari ini/bulan ini dari Dexie. Tampilkan indikator jika ada foto (link). |           |      |

### Implementation Phase 4: Integration

- GOAL-004: Integrasi akhir ke navigasi aplikasi.

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-011 | Daftarkan route `/lkh` di `src/App.jsx`. |           |      |
| TASK-012 | Tambahkan menu akses ke LKH di `Dashboard.jsx` atau Sidebar. |           |      |

## 3. Alternatives

- **ALT-001**: Menyimpan foto sebagai Base64 di Dexie. (Ditolak: Membuat database berat dan lambat).
- **ALT-002**: Membuat Sheet terpisah untuk Metadata (Info Guru). (Opsional: Saat ini metadata disimpan di HP, Spreadsheet hanya berisi tabel data harian agar mudah direkap).

## 4. Dependencies

- **DEP-001**: `src/services/driveService.js` (Core upload logic).
- **DEP-002**: Google Drive & Sheets API enabled.

## 5. Files

- **FILE-001**: `src/pages/LkhPage.jsx` (New)
- **FILE-002**: `src/pages/PengaturanPage.jsx` (Modified)
- **FILE-003**: `src/services/driveService.js` (Modified)
- **FILE-004**: `src/db.js` (Modified)

## 6. Testing

- **TEST-001**: Isi LKH dengan Foto saat Online -> Foto masuk Drive, Link masuk Sheet, Data masuk Dexie.
- **TEST-002**: Isi LKH saat Offline -> Input foto disabled, Data teks masuk Dexie. (Sync ke Sheet tertunda/manual nanti).
- **TEST-003**: Cek Pengaturan -> Simpan NIP/Atasan -> Refresh halaman -> Data tetap ada.

## 7. Risks & Assumptions

- **RISK-001**: Upload foto gagal di tengah jalan (perlu error handling/toast yang jelas).
- **ASSUMPTION-001**: Kolom "Keterangan" di Spreadsheet cukup untuk menampung URL panjang (Google Sheets support ini).