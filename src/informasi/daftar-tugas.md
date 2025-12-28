
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

### Validasi Aset PWA:

Di vite.config.js, Anda mereferensikan ikon pwa-1024x1024.png. Pastikan file fisik gambar tersebut benar-benar ada di folder public dan ukurannya sesuai, agar saat diinstal di HP ikonnya tampil cantik.

~~### Navigasi Jurnal:~~

~~Pastikan tombol "Lihat Semua" di Dashboard atau menu navigasi bawah sudah benar-benar mengarah ke /jurnal (komponen JurnalPage.jsx).~~

### Pembaruan Profil
menambahkan semester dan tahun ajaran. // Mungkin perlu juga memasukkan tanggal libur akademik dan libur nasional. Penambahan kedua informasi akan membantu guru mendapatkan informasi. Contoh informasi: di hari pertama libur akademik akan muncul notifikasi HP berisi pesan untuk memanfaatkan liburan, apa yang perlu dilakukan selama liburan, sampai kapan libur. notifikasi muncul lagi sehari sebelum libur akademik berakhir. pada Libur nasional dan cuti bersama, muncul notifikasi sehari sebelum libur memberitahukan besok adalah libur. bila libur lebih dari 1 hari, sampaikan waktu libur dari tanggal berapa sampai dengan tanggal berapa. 




