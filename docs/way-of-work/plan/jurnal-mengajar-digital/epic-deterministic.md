0. Epic Name
Jurnal Mengajar Digital: Offline-First Mobile Experience with AI & Cloud Sync

1. META INFORMATION
Project_ID: JM-PWA-CORE

Doc_Version: 1.0.0

Architecture_Type: Offline-First Progressive Web Application (PWA)

Primary_Runtime: Client-Side Browser (V8 Engine equivalent)

Data_Persistence_Model: Local-First (IndexedDB) with Async Cloud Replication

Language: Indonesian (Bahasa Indonesia)

2. SYSTEM DEFINITIONS & CONSTANTS
Definisi berikut bersifat absolut dan mengikat seluruh spesifikasi di bawahnya.

USER_TEACHER: Entitas manusia yang memiliki hak akses READ/WRITE terhadap data operasional (Jurnal, Absensi, Nilai).

STATE_OFFLINE: Kondisi dimana navigator.onLine === false.

STATE_ONLINE: Kondisi dimana navigator.onLine === true DAN server endpoint dapat dijangkau (HTTP 200).

LOCAL_DB: Penyimpanan IndexedDB di browser pengguna.

SYNC_QUEUE: Struktur data First-In-First-Out (FIFO) yang menyimpan mutasi data saat STATE_OFFLINE.

3. FUNCTIONAL REQUIREMENTS (DETERMINISTIC)
3.1 Module: Authentication & Session
ID: MOD-AUTH

Logic:

Sistem WAJIB menyimpan kredensial sesi (Token/User_ID) di LocalStorage.

JIKA STATE_OFFLINE adalah TRUE, MAKA sistem WAJIB mengizinkan login menggunakan hashed credentials yang tersimpan di LocalStorage (Re-authentication tanpa network).

JIKA kredensial lokal tidak ditemukan, MAKA akses DITOLAK.

3.2 Module: Class & Schedule Management
ID: MOD-CLASS

Input_Constraints:

Class_ID: String (Unique).

Subject_Name: String (Min 3 chars).

Process:

Sistem memuat daftar kelas dari LOCAL_DB.

Render daftar kelas dalam format Grid atau List.

Event OnSelectClass(Class_ID) WAJIB menginisialisasi konteks data untuk MOD-JOURNAL dan MOD-ATTENDANCE.

3.3 Module: Attendance (Absensi)
ID: MOD-ATTENDANCE

Data_Structure: Lihat Section 4.1.

Logic:

Sistem merender daftar siswa berdasarkan Class_ID yang aktif.

Default status kehadiran untuk semua siswa saat inisialisasi adalah HADIR (H).

User Interface WAJIB menyediakan toggle/selector untuk status: SAKIT (S), IZIN (I), ALPA (A), BOLOS (B).

Event SaveAttendance() memicu penulisan ke LOCAL_DB tabel attendance_logs.

3.4 Module: Teaching Journal (Jurnal)
ID: MOD-JOURNAL

Data_Structure: Lihat Section 4.2.

Logic:

Input Field Materi WAJIB diisi (Non-nullable).

Input Field Catatan bersifat Opsional (Nullable).

Event SaveJournal() memicu penulisan ke LOCAL_DB tabel journal_entries.

Setelah penyimpanan sukses ke LOCAL_DB, sistem WAJIB memicu SYNC_AGENT (Lihat 3.6).

3.5 Module: Grading (Nilai)
ID: MOD-GRADING

Logic:

Sistem mendukung input nilai numerik (0-100).

Validasi: JIKA Input < 0 ATAU Input > 100, MAKA tolak input dan tampilkan Error_Message.

Penyimpanan dilakukan per Student_ID dan per Topic_ID.

3.6 Module: Synchronization Agent
ID: SYNC_AGENT

Execution_Trigger:

Event: window.addEventListener('online')

Event: App_Initialization

Event: Manual_Refresh_Button_Click

Logic:

Periksa SYNC_QUEUE di LOCAL_DB.

JIKA SYNC_QUEUE kosong, MAKA hentikan proses (Status: IDLE).

JIKA SYNC_QUEUE terisi, MAKA ambil item teratas (Pop).

Kirim payload ke API Endpoint yang dikonfigurasi.

JIKA respons HTTP == 200/201, MAKA hapus item dari antrian dan ulangi langkah 1.

JIKA respons HTTP != 200/201, MAKA kembalikan item ke antrian (Retry Logic) dan setel jeda eksponensial.

4. DATA SCHEMAS (JSON SPECIFICATION)
Seluruh pertukaran data internal dan eksternal WAJIB mematuhi skema ini.

4.1 Schema: Attendance Record
JSON

{
  "entity_name": "AttendanceRecord",
  "fields": {
    "id": "UUID (v4)",
    "timestamp": "ISO8601 String",
    "class_id": "String",
    "teacher_id": "String",
    "records": [
      {
        "student_id": "String",
        "status": "Enum('H', 'S', 'I', 'A')"
      }
    ],
    "is_synced": "Boolean"
  }
}
4.2 Schema: Journal Entry
JSON

{
  "entity_name": "JournalEntry",
  "fields": {
    "id": "UUID (v4)",
    "created_at": "ISO8601 String",
    "class_id": "String",
    "subject_id": "String",
    "content_material": "String",
    "content_notes": "String (Nullable)",
    "attachment_url": "String (Nullable)",
    "is_synced": "Boolean"
  }
}
5. UI/UX CONSTRAINTS (FOR CODE GENERATION)
Parameter ini harus diterjemahkan langsung ke dalam properti CSS/Tailwind atau logika komponen React.

Touch_Target_Size: Elemen interaktif (tombol, input toggle) WAJIB memiliki dimensi minimal 44px x 44px.

Layout_Responsiveness:

Viewport < 768px: Render Single Column.

Viewport >= 768px: Render Multi Column atau Dashboard Layout.

Feedback_Latency:

UI WAJIB merespons input pengguna (state change) dalam waktu < 100ms.

Operasi async (Simpan/Sync) WAJIB menampilkan indikator visual (Loading Spinner atau Toast) jika durasi eksekusi > 200ms.

Color_Semantics:

Action Primary (Simpan/Submit): Blue-600 (atau hex setara).

Action Destructive (Hapus): Red-600.

Status Success: Green-500.

Status Warning/Offline: Amber-500.

6. EXTERNAL DEPENDENCIES LIMITATION
Sistem ini didefinisikan sebagai Closed Loop untuk logika bisnis inti.

DILARANG melakukan pemanggilan API eksternal (Third-party) secara sinkronus yang memblokir Main Thread.

DILARANG memiliki hard dependency pada ketersediaan internet untuk fungsi MOD-AUTH, MOD-ATTENDANCE, MOD-JOURNAL, dan MOD-GRADING.