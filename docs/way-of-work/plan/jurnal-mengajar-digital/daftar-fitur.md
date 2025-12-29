# Daftar Fitur

1. Modul Inti: Jurnal & Absensi (The Core Experience)
​Modul ini dirancang dengan filosofi Mobile-First dan Deterministic untuk meminimalkan waktu input guru hingga di bawah 30 detik.
​"The 30-Second Journal Entry" (Input Cepat):
​Alur kerja instan: Buka Aplikasi -> Pilih Kelas -> Tap "Hadir Semua" (Default) -> Simpan.
​Penyimpanan lokal langsung (LocalStorage) untuk responsivitas instan.
​Deterministic Jurnal (Otomasi Rencana Ajar):
​One-Click Confirmation: Jika hari ini sesuai jadwal, guru hanya perlu mengonfirmasi materi yang sudah direncanakan, tidak perlu mengetik ulang.
​Smart Rescheduling: Jika guru berhalangan hadir, sistem otomatis menggeser urutan materi (Syllabus) ke pertemuan berikutnya.
​Manajemen Kehadiran:
​Pencatatan status detail: Hadir (H), Sakit (S), Izin (I), Alpa (A).
​Default status adalah "Hadir Semua" untuk mempercepat input.
​Jurnal Refleksi:
​Kolom opsional untuk catatan kualitatif guru (misal: "Siswa X kurang paham", "Metode diskusi efektif").
​Quick Agenda:
​Input khusus untuk kegiatan non-mengajar seperti Rapat, Piket, atau Upacara.
​2. Modul Data & Sinkronisasi (Zero Data Anxiety)
​Fitur ini menjamin keamanan data dan integrasi dengan sistem pelaporan sekolah.
​Offline-First Capability:
​Aplikasi wajib menggunakan IndexedDB untuk penyimpanan lokal penuh. Aplikasi tidak boleh blank saat mode pesawat.
​Guru bisa input data kapan saja tanpa koneksi internet.
​"The Anxiety-Free Sync" (Sinkronisasi Cerdas):
​Indikator Status Visual: Tampilan status yang jelas ("Tersimpan di HP" vs "Tersinkron ke Cloud") dengan bahasa manusia, bukan kode error.
​Auto-Sync: Service Worker secara diam-diam mengirim data ke server saat koneksi internet tersedia.
​Robust Data Sync: Validasi ketat di backend untuk mencegah kerusakan data ("Dirty Data") saat sinkronisasi.
​Google Sheets Integration:
​Sinkronisasi dua arah (Two-way sync):
​Read: Mengambil Data Master (Guru/Siswa) dari Google Sheets.
​Write: Mengirim Data Transaksi (Jurnal/Absen) ke Google Sheets untuk pelaporan otomatis.
​3. Modul Kecerdasan (Intelligence & AI)
​Memanfaatkan AI untuk membantu tugas administratif dan pedagogis.
​Gemini AI Assistant:
​Contextual Chatbot: Asisten berbasis chat yang memiliki akses baca ke data lokal guru untuk analisis kinerja.
​Generative Reporting: Fitur untuk membuat narasi raport otomatis (misal: "Buatkan catatan sikap untuk Budi").
​AI Proxy Architecture: Frontend mengirim prompt ke Backend, Backend meneruskan ke Google Gemini (menjaga API Key tetap aman).
​Progress Tracking:
​Indikator visual kemajuan materi (misal: "Topik 3 dari 15 selesai") berdasarkan data silabus.
​Attitude Record:
​Pencatatan poin pelanggaran atau prestasi siswa sebagai bahan pendukung rapor karakter.
​4. Manajemen Rencana Ajar (Syllabus Planner)
​Bagian dari konsep Deterministic untuk mengatur alur pembelajaran di awal semester.
​Input Silabus Awal: Guru menginput daftar topik/materi (Rencana Ajar) sekali saja di awal semester.
​Mapping Jadwal: Menghubungkan topik dengan estimasi pertemuan.
​5. Fitur Teknis & Keamanan (Technical Enablers)
​Infrastruktur pendukung untuk memastikan performa dan integritas data.
​Validasi Data (Zod Schema):
​Implementasi Zod di sisi Client dan Server untuk memastikan tipe data valid (pengganti TypeScript).
​Optimasi Performa:
​First Input Delay < 100ms.
​Debounce: Penundaan sinkronisasi pada input teks untuk menghemat kuota data guru.
​UI/UX Mobile-First:
​Larangan penggunaan tabel lebar (datatable); wajib menggunakan Card View atau List View.
​Ukuran tombol minimal 44x44px untuk kemudahan akses jari jempol.
​Psychological Safety Wording: Pesan error yang menenangkan (misal: "Menunggu Sinyal" alih-alih "Error 500").