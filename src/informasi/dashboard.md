Lihat daftar tugas : [DAFTAR TUGAS](daftar-tugas.md)

# PERUBAHAN YANG DIPERLUKAN DI HALAMAN DASHBOARD (Dashboard.jsx)

1. Restrukturasi UI: 
    a. Grid yang menampilkan Jumlah Jurnal dan Siswa Aktif sebaiknya dipindahkan ke laman sendiri. Beri laman ini nama "Statistik". Laman statistik akan memuat data seperti jumlah kelas yang di ajar, jumlah jurnal, dan siswa aktif. data lain mungkin akan menyusul.
    b. Sebagai gantinya, naikkan Jadwal ke bagian paling atas di susul dengan menu.
    c. Bagian menu. Urutan bagian menu dimulai dari bagian perencanaan hingga tindak lanjut:
        - Data Kelas dan Siswa
        - Rencana Pembelajaran
        - Monitoring Perilaku // baru. Berguna untuk mencatat log perilaku siswa tertentu, rencana tindak lanjut penanganan, dan hasil penanganan 
        - Perkembangan Kelas // baru. berguna untuk melihat progres materi, progres latihan, data absensi siswa, data latihan siswa, nilai rata-rata siswa, tren situasi kelas itu berdasarkan tag jurnal. Fitur perkembangan kelas bisa digabungkan dengan fitur perkembangan siswa dengan cara, pengguna mengklik nama siswa tertentu dan diarahkan ke perkembangan individu siswa. Pengguna juga dapat merencanakan diferensiasi atau penanganan khusus untuk sebuah kelas. Pada tahap lanjut, mungkin bisa menggunakan fitur AI untuk mendapatkan insight mengenai perkembangan kelas tersebut. 
        - Perkembangan Siswa untuk melihat kehadiran individu siswa, progres latihannya (apakah tugas sudah selesai atau belum; berapa tugas yang sudah dikerjakan; tugas mana yang sudah dikerjakan dan belum), melihat perkembangan perilakunya (diambil dari monitoring perilaku), rata-rata nilainya. Pengguna juga dapat mengupdate keperluan untuk diferensiasi atau penanganan perilaku dengan mengarahkannya ke laman monitoring perilaku. Pada tahap lanjut, bisa menggunakan fitur AI untuk mendapatkan insight mengenai perkembangan siswa.
        - Statistik //jumlah jurnal, jumlah siswa, jumlah kelas yang diajar. data lain belum terpikirkan
        - Ide Mengajar // sandbox guru sekaligus fitur notetaking bagi guru untuk mengembangkan tindak lanjut pembelajarannya. 
        - Sumber Inspirasi // sumber tulisan, video, dsb yang dimanfaatkan untuk pengembangan keprofesionalan berkelanjutan.
        - Guru AI // fitur untuk membantu guru memanfaatkan AI 
    d. Bagian menu tidak harus diatur dengan urutan, bisa juga dengan grid.
    e. Penamaan menu tidak kaku seperti di atas, yang jelas dia harus ringkas dan diberi sedikit keterangan.
    