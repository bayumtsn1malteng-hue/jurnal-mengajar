# DAFTAR PROMPT
[Penambahan Fitur](#penambahan-fitur)

## TEMPLATE ILUSTRASI - SITUASI IDEAL - MASALAH - SOLUSI - ILUSTRASI SOLUSI - KEINGINAN
ILUSTRASI:
Saya telah mengajar di kelas VII-1 pada hari Senin. Materi hari itu, Bab 1 - Ta'aruf. Hari itu siswa di kelas VII-1 mengerjakan dua latihan. Dalam situasi ideal berikut langkah penggunaan aplikasi:
1. Saya mengisi Rencana Ajar. Saya memasukkan rencana materi dan rencana latihan.
2. Saya masuk kelas, mengisi absen.
3. Saya mengajar sesuai dengan rencana materi.
4. Siswa mengerjakan latihan sesuai dengan rencana latihan.
5. Saya menginput nilai latihan siswa.
6. Saya melakukan refleksi.

Di lapangan, situasi ideal tidak selalu dapat dilakukan. Berdasarkan pengalaman saya, ada sejumlah situasi yang mungkin terjadi bila nantinya aplikasi ini saya pakai. Inilah daftar situasi itu, namun tidak terbatas pada situasi itu saja:

Situasi #1:
Saya tidak sempat / lupa mengisi Absen pada hari itu

Situasi #2:
Saya tidak sempat / lupa mengisi rencana mengisi Rencana Ajar dan/atau Latihan.

Situasi #3:
Saya lupa mengisi refleksi. Ada kala saya teringat mengisi refleksi beberapa hari setelah mengajar. 

Situasi #4:
Materi yang saya sampaikan dan latihan yang dikerjakan siswa pada hari itu tidak sesuai rencana. 

KEINGINAN:
Dalam pemikiran saya, keempat situasi itu bisa diatasi dengan hanya mengubah JurnalPage. bila memang solusi ini sulit diterapkan, kamu bisa menyarankan solusi lain yang lebih efektif dan efisien.

ILUSTRASI SOLUSI:
Setelah mengajar di kelas VII-1 pada hari Senin, apakah segera atau lama setelahnya, saya akan masuk ke halaman Jurnal. saya akan memeriksa di Kartu Jurnal, apakah kegiatan mengajar hari ini sudah tercatat. Bila belum tercatat, saya akan ke AbsensiPage; atau tetap di JurnalPage untuk mengisi absensi sesuai fitur yang saya inginkan di bawah.

Saya kemudian menekan kartu jurnal, kartu akan mekar dan mengambang. di dalam kartu yang mengambang itu saya bisa:
1. membaca nama materi (fitur saat ini)
2. CRUD refleksi pembelajaran (fitur saat ini, sudah lengkap)
3. CRUD Tag refleksi pembelajaran (fitur saat ini)
3. Mengupdate Absen (fitur saat ini)

Semua fitur saat ini sudah sesuai dan tidak perlu diubah. Saya hanya menginginkan penambahan fitur:
4. Ada fitur menambahkan jurnal baru
5. pada button "Edit Data Absen" saat ini, saya akan diarahkan ke AbsensiPage, lalu melihat daftar kartu absensi. Saya masih harus menelusuri satu per satu atau menggunakan filter untuk mengedit Data Absen. Apakah bisa, ketika menekan "Edit Data Absen", aplikasi akan mencari apakah hari itu saya sudah membuat absen atau belum. Bila sudah ada, saya akan langsung diarahkan pada tampilan absen kelas V


---
# PENAMBAHAN FITUR 

1. fix: AbsensiPage.jsx // -- Reset kehadiran di 1 kelas bila ganti hari
2. fix: RencanaAjar.jsx // -- Fitur Update Materi
3. fix: RencanaAjar.jsx // -- Fitur update latihan; ubah tampilan kartu latihan bila mengambang.
4. fix: JurnalPage.jsx // -- tambahkan button untuk edit latihan di isian jurnal.
5. fix: JurnalPage.jsx // -- "Edit Data Absen" mengarahkan ke absen yang tepat.
6. fix: User Login
7. feat: backup excel
8. ~~fix: Dashboard.jsx // -- ubah "HALO, CIKGU" menjadi "HALO, [NAMA GURU]~~
9. ~~fix: Profil.jsx // -- tambahkan fitur memasukkan jadwal~~
10. ~~fix: Profil.Jsx // -- Ubah checkbox menjadi dropdown; terpilih tertulis di bawahnya; di samping mata pelajaran terpilih ada tong sampah untuk menghapus.~~
11. feat: notifikasi HP. "Anda harus mengajar Hari ini.


---
## Halaman Absensi
SITUASI SAAT INI: 


