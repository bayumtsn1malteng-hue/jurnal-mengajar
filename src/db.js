import Dexie from 'dexie';

export const db = new Dexie('jurnal_guru_v2'); // Ganti nama DB biar fresh

// Ini kita tambahkan agar di UI nanti kita bisa panggil STATUS_ABSENSI.SAKIT
export const STATUS_ABSENSI = {
  HADIR: 1,
  SAKIT: 2,
  IZIN: 3,
  ALPA: 4,
  BOLOS: 5
};

db.version(1).stores({
  // --- MASTER DATA (PENGHUNI) ---
  // settings: Guru & Sekolah
  settings: 'key', 
  
  // classes: Daftar Kelas (X-1, XI-2)
  classes: '++id, name', 
  
  // students: Data Siswa (800 orang masuk sini)
  // [classId+name] adalah compound index untuk sorting
  students: '++id, name, classId, nis, gender, [classId+name]', 

  // --- PEMBELAJARAN (RPP / BANK MATERI) ---
  // syllabus: Rencana Pembelajaran (Bank Materi)
  // level: Tingkat (Kelas 10/11/12), subject: Mapel
  syllabus: '++id, topic, subject, level, meetingOrder', 

  // assessments_meta: Definisi Penilaian (Soal/Tagihan)
  // syllabusId: Menghubungkan Latihan ke Materi (Ex: Latihan 1 punya Bab 1)
  // type: Formatif/Sumatif/Diagnostik
  assessments_meta: '++id, syllabusId, name, type',

  // --- TRANSAKSI (KEGIATAN HARIAN) ---
  // journals: Log Harian Guru
  // syllabusId: Menandakan hari ini bahas materi apa
  journals: '++id, date, classId, syllabusId', 
  
  // attendance: Log Absensi
  // Hanya mencatat yang TIDAK HADIR (Hemat data)
  // Kita tambahkan [date+classId] agar pencarian "Absen Kelas X hari Senin" cepat.
  attendance: '++id, date, classId, studentId, status, [date+classId]', 

  // grades: Buku Nilai
  // assessmentMetaId: Menghubungkan nilai ke "Latihan 1"
  grades: '++id, studentId, assessmentMetaId, score, date' 
});

// Seed Data (Contoh Data Awal agar tidak kosong melompong saat dev)
db.on('populate', () => {
  db.settings.bulkAdd([
    { key: 'teacherName', value: 'Nama Guru' },
    { key: 'schoolName', value: 'Nama Sekolah' }
  ]);
});

export default db;