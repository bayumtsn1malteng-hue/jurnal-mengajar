---
goal: Implementasi Infrastruktur Sinkronisasi Google Drive dan Backup Database
version: 1.0
date_created: 2025-01-03
status: 'Planned'
tags: ['infrastructure', 'feature', 'backup', 'google-drive']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Rencana ini bertujuan untuk membangun layanan koneksi ke Google API, menangani autentikasi pengguna (OAuth), dan menyediakan fungsi untuk mencadangkan (backup) serta memulihkan (restore) seluruh database Dexie ke Google Drive pengguna dalam format JSON.

## 1. Requirements & Constraints

- **REQ-001**: Aplikasi harus dapat melakukan autentikasi pengguna menggunakan Google Sign-In.
- **REQ-002**: Aplikasi harus meminta izin scope `https://www.googleapis.com/auth/drive.file` untuk keamanan (hanya akses file yang dibuat aplikasi).
- **REQ-003**: Proses backup harus mengekspor seluruh tabel Dexie ke satu file JSON.
- **REQ-004**: Proses restore harus dapat membaca file JSON dari Drive dan menimpa/mengisi ulang database lokal.
- **CON-001**: Menggunakan library `gapi-script` untuk interaksi dengan Google API.
- **CON-002**: File backup harus disimpan dengan nama konsisten (misal: `jurnal_mengajar_backup.json`) untuk memudahkan penemuan.

## 2. Implementation Steps

### Implementation Phase 1: Service & Authentication

- GOAL-001: Membuat layanan dasar untuk menangani inisialisasi GAPI dan Login/Logout.

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-001 | Install dependency `gapi-script` menggunakan npm. |           |      |
| TASK-002 | Buat file `src/services/driveService.js`. Implementasi fungsi `initGoogleClient` dengan parameter Client ID dan Scope. |           |      |
| TASK-003 | Implementasi fungsi `signIn` dan `signOut` di `src/services/driveService.js`. |           |      |
| TASK-004 | Implementasi listener status login (`isSignedIn`) untuk memperbarui state UI secara real-time. |           |      |

### Implementation Phase 2: Backup & Restore Logic

- GOAL-002: Implementasi logika ekspor database ke JSON dan operasi file Google Drive (Upload/Download).

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-005 | Di `src/services/driveService.js`, buat fungsi helper `exportDbToJson` untuk mengambil semua data dari tabel `db.js`. |           |      |
| TASK-006 | Di `src/services/driveService.js`, buat fungsi helper `importJsonToDb` untuk menulis data JSON kembali ke Dexie. |           |      |
| TASK-007 | Implementasi fungsi `findBackupFile` untuk mencari file backup spesifik di Drive. |           |      |
| TASK-008 | Implementasi fungsi `backupToDrive` (Upload/Update file ke Drive). |           |      |
| TASK-009 | Implementasi fungsi `restoreFromDrive` (Download & Parse file dari Drive). |           |      |

### Implementation Phase 3: UI Integration

- GOAL-003: Integrasi fitur backup ke halaman Pengaturan.

| Task     | Description            | Completed | Date |
| -------- | ---------------------- | --------- | ---- |
| TASK-010 | Update `src/pages/PengaturanPage.jsx` untuk menampilkan status login Google. |           |      |
| TASK-011 | Tambahkan tombol "Hubungkan Google Drive", "Backup Sekarang", dan "Restore Data" di `src/pages/PengaturanPage.jsx`. |           |      |
| TASK-012 | Implementasi feedback visual (Toast loading/success/error) saat proses backup/restore berjalan. |           |      |

## 3. Alternatives

- **ALT-001**: Menggunakan Firebase Auth dan Firestore. (Tidak dipilih karena memerlukan migrasi database total dari Dexie).
- **ALT-002**: Menggunakan File System Access API untuk backup lokal. (Tidak dipilih karena pengguna meminta sinkronisasi Cloud/Drive).

## 4. Dependencies

- **DEP-001**: `gapi-script` (Google API Client Library for JavaScript).
- **DEP-002**: `dexie` (Database lokal yang sudah ada).
- **DEP-003**: `react-hot-toast` (Untuk notifikasi UI).

## 5. Files

- **FILE-001**: `src/services/driveService.js` (Baru)
- **FILE-002**: `src/pages/PengaturanPage.jsx` (Modifikasi)
- **FILE-003**: `src/db.js` (Referensi bacaan)

## 6. Testing

- **TEST-001**: Verifikasi popup Google Login muncul dan berhasil login.
- **TEST-002**: Verifikasi file `jurnal_mengajar_backup.json` muncul di Google Drive pengguna setelah tombol backup ditekan.
- **TEST-003**: Hapus data lokal (Clear Application Data), lalu lakukan Restore, verifikasi data kembali muncul.

## 7. Risks & Assumptions

- **RISK-001**: Browser memblokir popup login (perlu izin pop-up).
- **ASSUMPTION-001**: Pengguna memiliki akun Google aktif.
- **ASSUMPTION-002**: Pengguna telah membuat Project di Google Cloud Console dan memiliki Client ID yang valid.

## 8. Related Specifications / Further Reading

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/reference)
- [Dexie.js Export/Import Documentation](https://dexie.org/docs/ExportImport/dexie-export-import)
