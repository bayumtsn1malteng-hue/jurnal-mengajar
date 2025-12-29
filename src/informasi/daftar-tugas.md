
# DAFTAR TUGAS YANG MASIH BELUM DISELESAIKAN
    
    ! Tips: teks dengan strikethrough telah selesai. Prioritas menandakan tingkat urgensi. primer = paling mendesak; sekunder = mendesak; tersier = kurang mendesak. 

## Tambahan Fitur Pribadi
1. ~~ fix: AbsensiPage.jsx // -- Reset kehadiran di 1 kelas bila ganti hari ~~
2. ~~ fix: RencanaAjar.jsx // -- Fitur Update Materi ~~
3. ~~ fix: RencanaAjar.jsx // -- Fitur update latihan; ubah tampilan kartu latihan bila mengambang. ~~
4. fix: JurnalPage.jsx // -- tambahkan button untuk edit latihan di isian jurnal. // Prioritas: sekunder
5. fix: JurnalPage.jsx // -- "Edit Data Absen" mengarahkan ke absen yang tepat. // Prioritas: sekunder
6. fix: User Login // prioritas: tersier
7. ~~feat: backup excel~~
8. ~~fix: Dashboard.jsx // -- ubah "HALO, CIKGU" menjadi "HALO, [NAMA GURU]~~
9. ~~fix: Profil.jsx // -- tambahkan fitur memasukkan jadwal~~
10. ~~fix: Profil.Jsx // -- Ubah checkbox menjadi dropdown; terpilih tertulis di bawahnya; di samping mata pelajaran terpilih ada tong sampah untuk menghapus.~~
11. feat: notifikasi HP. "Saatnya Masuk Kelas" // Prioritas Primer
12. feat: tampilan awal cantik, selain logo tampilkan 'brand' : THE CURIOUS MIND dan tag: 'Mewawasi Dunia, Menerangi Minda' // prioritas Primer bila bisa dilakukan. 
13. [fix: Dashboard.jsx // ubah struktur dashboard, taruh jadwal di atas, lalu menu. pindahkan grid jurnal ke laman sendiri, yaitu statistik.](dashboard.md) 
14. ~~fix: navigasi lama.~~ 
15. ~~fix: menambahkan kemampuan untuk export excel di buku nilai. ~~
16. [Bila memungkinkan, menyediakan tutorial aplikasi bagi pengguna baru](tutorial.md)

---
## Tambahan dari gemini
~~### Fitur Export Excel (Prioritas Tinggi):~~

~~Di src/pages/NilaiPage.jsx, Anda perlu menambahkan tombol untuk mengunduh rekap nilai menjadi file .xlsx. Tanpa ini, guru akan kesulitan memindahkan nilai ke Raport resmi sekolah. ~~

#### Validasi Aset PWA:

Di vite.config.js, Anda mereferensikan ikon pwa-1024x1024.png. Pastikan file fisik gambar tersebut benar-benar ada di folder public dan ukurannya sesuai, agar saat diinstal di HP ikonnya tampil cantik.

~~### Navigasi Jurnal:~~

~~Pastikan tombol "Lihat Semua" di Dashboard atau menu navigasi bawah sudah benar-benar mengarah ke /jurnal (komponen JurnalPage.jsx).~~

#### Pembaruan Profil
menambahkan semester dan tahun ajaran. // Mungkin perlu juga memasukkan tanggal libur akademik dan libur nasional. Penambahan kedua informasi akan membantu guru mendapatkan informasi. Contoh informasi: di hari pertama libur akademik akan muncul notifikasi HP berisi pesan untuk memanfaatkan liburan, apa yang perlu dilakukan selama liburan, sampai kapan libur. notifikasi muncul lagi sehari sebelum libur akademik berakhir. pada Libur nasional dan cuti bersama, muncul notifikasi sehari sebelum libur memberitahukan besok adalah libur. bila libur lebih dari 1 hari, sampaikan waktu libur dari tanggal berapa sampai dengan tanggal berapa. 

---
### TAMBAHAN BARU DARI GEMINI TANGGAL 29-12-2025

🔴 Prioritas Primer (UX & Fitur Vital)
Fokus: Apa yang dirasakan dan dilihat langsung oleh pengguna.

#### ~~[UX] Redesign Dashboard (dashboard.md)~~

Deskripsi: Pindahkan Statistik ke halaman baru. Naikkan Jadwal ke atas. Tambahkan grid menu baru (Monitoring, Perkembangan, dll - walau fiturnya belum ada, siapkan tombol/grid-nya).

Benefit: Navigasi lebih logis dan informatif.

[Bug/UX] Fix Date & Timezone Handling

Deskripsi: Mengganti logic new Date().toISOString().split('T')[0] dengan logic yang sadar zona waktu lokal (WIB/WITA/WIT) agar tanggal jurnal tidak mundur ke hari kemarin saat diinput malam hari/dini hari.

Benefit: Data akurat, guru tidak bingung tanggal.

[Feat] Notifikasi HP "Saatnya Masuk Kelas" (Dari daftar lama)

Deskripsi: Integrasi Service Worker/PWA notification.

#### 🟡 Prioritas Sekunder (Green Coding, Refactoring, & Config)
Fokus: Efisiensi, Kerapian Kode, dan Skalabilitas.

[Green Coding] Optimasi Memori StudentAttendanceRow.jsx

Deskripsi: Memindahkan array options (Hadir, Sakit, Izin, dll) keluar dari komponen agar tidak dibuat ulang (re-allocated) setiap kali baris dirender.

Benefit: Aplikasi lebih ringan, hemat baterai (walau tidak terlihat langsung).

[Refactor] Pecah Komponen AbsensiPage.jsx

Deskripsi: Memisahkan UI menjadi AbsensiList, AbsensiForm, dan AbsensiInput di folder components.

Benefit: Kode lebih mudah dibaca dan di-maintain ke depannya.

[Config] Logic Semester Dinamis (excelGenerator.js)

Deskripsi: Menghapus hardcoded bulan Juli/Januari. Pindahkan penentuan semester ke db.settings atau menu Pengaturan.

Benefit: Fleksibilitas jika kalender akademik berubah.

#### PRIORITAS TERSIER
[UX] Smart Redirect di JurnalPage (daftar-prompt.md)

Deskripsi: Tombol "Edit Data Absen" harus cerdas. Cek DB dulu, jika absen hari itu ada -> Langsung edit (Buka AbsensiPage mode input). Jika tidak -> Buka mode create.

Benefit: Mengurangi klik bagi guru.
