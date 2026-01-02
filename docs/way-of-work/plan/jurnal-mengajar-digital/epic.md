Epic PRD: Sistem Manajemen Kelas Terintegrasi (Teacher-Centric Edition)
1. Epic Name
Jurnal Mengajar Digital: Offline-First Mobile Experience with AI & Cloud Sync

2. Goal
Problem: Guru di Indonesia sering bekerja di area sinyal tidak stabil dan merasa cemas jika aplikasi administrasi "loading terus" atau data hilang. Solusi yang ada seringkali terlalu rumit (berbasis tabel desktop) untuk layar HP.

Solution: Membangun Super-App berbasis PWA yang menggabungkan kecepatan input lokal (Offline-First) dari aplikasi jurnal-mengajar dengan kecerdasan backend (Google Sheets Sync & AI) dari aplikasi cloningan. Fokus utama adalah memberikan rasa aman dan kemudahan input bagi guru.

Impact:

High Adoption: Guru merasa nyaman menggunakan aplikasi karena cepat dan tidak ribet.

Zero Data Anxiety: Guru yakin datanya aman tersimpan di HP meski tidak ada internet.

Automated Reporting: Sekolah mendapatkan data real-time tanpa membebani guru dengan rekap manual.

3. User Personas (Refined)
Guru Lapangan (Primary):

Mengutamakan kecepatan. Mengisi jurnal sambil berdiri di depan kelas atau istirahat 5 menit.

Pain Point: Benci loading, jari jempol kesulitan menekan tombol kecil, takut salah pencet.

Admin Sekolah:

Mengutamakan kelengkapan data. Ingin melihat rekapitulasi tanpa bertanya satu-satu ke guru.

Wali Kelas:

Mengutamakan detail siswa. Membutuhkan catatan perilaku siswa untuk rapor.

4. High-Level User Journeys
"The 30-Second Journal Entry": Guru buka aplikasi (Instan) -> Pilih Kelas -> Tap "Hadir Semua" (Default) -> Ketik materi singkat -> Tap "Simpan". (Di belakang layar: Aplikasi menyimpan ke LocalStorage. Jika ada internet, Service Worker diam-diam mengirim ke Google Sheets).

"The Anxiety-Free Sync": Guru melihat indikator status: "Tersimpan di HP" (Saat offline) -> Berubah menjadi "Tersinkron ke Cloud" (Saat online). Tidak ada error popup yang menakutkan.

"The AI Assistant": Guru bingung mengisi catatan rapor -> Tap tombol melayang (FAB) -> Bicara/Ketik: "Buatkan catatan sikap untuk Budi yang sering terlambat tapi rajin piket" -> AI memberikan teks saran -> Copy & Paste.

5. Business Requirements
5.1 UX & UI Design Guidelines (NEW - Crucial)
Mobile-First Layout:

Dilarang menggunakan tabel lebar (datatable) untuk tampilan utama guru. Gunakan Card View atau List View vertikal.

Ukuran target sentuh (tombol) minimal 44x44px untuk mengakomodasi penggunaan jempol.

Psychological Safety Wording:

Hindari istilah teknis seperti "Sync Error 500". Gunakan bahasa manusia: "Menunggu Sinyal" atau "Belum Terkirim (Akan dicoba otomatis)".

Berikan Haptic Feedback (getaran halus) atau centang hijau visual saat tombol Simpan ditekan.

AI Interaction Pattern:

Fitur AI tidak boleh menghalangi fitur utama. Gunakan Floating Action Button (FAB) yang bisa diperluas (expandable).

5.2 Functional Modules
Core Modules (Input Cepat):

Jurnal & Absensi: Input mapel, materi, dan kehadiran (H/S/I/A).

Quick Agenda: Input kegiatan non-mengajar (Rapat, Piket).

Intelligence Modules:

Gemini Assistant: Chatbot kontekstual yang memiliki akses baca ke data lokal guru untuk analisis kinerja.

Attitude Record: Pencatatan poin pelanggaran/prestasi siswa.

Backend Integration:

Google Sheets Sync: Sinkronisasi dua arah. Data master (Guru/Siswa) dari Sheets, Data Transaksi (Jurnal) ke Sheets.

5.3 Non-Functional Requirements
Offline Capability: Wajib menggunakan IndexedDB untuk penyimpanan lokal. Aplikasi tidak boleh blank saat mode pesawat.

Performance: First Input Delay < 100ms. Sinkronisasi dilakukan secara asynchronous (tidak memblokir UI).

Data Efficiency: Implementasi Debounce (jeda waktu) pada sinkronisasi input teks untuk menghemat kuota data guru.

6. Success Metrics
Kecepatan Input: Rata-rata waktu input jurnal < 45 detik per kelas.

Tingkat Kegagalan Sync: < 1% insiden data konflik per bulan.

Kepuasan Pengguna: Skor 4.5/5 pada survei internal guru (fokus pada kemudahan penggunaan).

7. Out of Scope
Tampilan Desktop yang kompleks untuk Guru (Guru disarankan tetap pakai tampilan Mobile walau di Laptop).

Integrasi langsung ke Dapodik (Data Pokok Pendidikan Nasional).

8. Business Value
Critical. Dengan fokus pada UX yang membumi, aplikasi ini bukan hanya alat administrasi, tapi solusi yang menghargai waktu dan keterbatasan teknis guru. Ini meminimalisir resistensi (penolakan) guru terhadap digitalisasi sekolah.