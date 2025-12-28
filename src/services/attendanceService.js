// src/services/attendanceService.js
import { db } from '../db';

export const attendanceService = {
  // --- GET DATA ---
  
  // Ambil semua kelas
  getClasses: async () => {
    return await db.classes.toArray();
  },

  // Ambil semua silabus/materi
  getSyllabus: async () => {
    return await db.syllabus.orderBy('meetingOrder').toArray();
  },

  // Ambil history jurnal (digabung dengan data kelas & topik untuk tampilan list)
  getHistoryLog: async () => {
    const classes = await db.classes.toArray();
    const syllabus = await db.syllabus.toArray();
    const journals = await db.journals.reverse().toArray();

    // Kita lakukan join data di sini (Service Layer), bukan di UI
    return journals.map(j => {
      const sId = j.syllabusId ? parseInt(j.syllabusId) : 0;
      const topicItem = syllabus.find(s => s.id === sId);

      let topicDisplay = 'Topik Tidak Diketahui';
      if (topicItem) {
        topicDisplay = `${topicItem.meetingOrder} - ${topicItem.topic}`;
      } else if (j.customTopic) {
        topicDisplay = `(Manual) ${j.customTopic}`;
      } else {
        topicDisplay = 'Topik Terhapus / Kosong';
      }

      return {
        ...j,
        className: classes.find(c => c.id === j.classId)?.name || '?',
        topicName: topicDisplay
      };
    });
  },

  // Ambil data siswa di kelas tertentu
  getStudentsByClass: async (classId) => {
    return await db.students
      .where('classId')
      .equals(parseInt(classId))
      .sortBy('name');
  },

  // Ambil data absensi yang sudah ada (untuk pre-fill saat edit)
  getExistingAttendance: async (classId, date) => {
    return await db.attendance
      .where({ classId: parseInt(classId), date: date })
      .toArray();
  },

  // --- WRITE DATA (TRANSAKSI) ---

  // Simpan Absensi (Bisa Baru atau Update)
  saveAttendance: async (journalData, studentRecords) => {
    return await db.transaction('rw', db.journals, db.attendance, async () => {
      // 1. Simpan/Update Jurnal
      let journalId = journalData.id;
      const payload = {
        date: journalData.date,
        classId: parseInt(journalData.classId),
        syllabusId: journalData.syllabusId ? parseInt(journalData.syllabusId) : null,
        customTopic: journalData.customTopic
      };

      if (journalId) {
        await db.journals.update(journalId, payload);
      } else {
        journalId = await db.journals.add(payload);
      }

      // 2. Reset Absensi Lama untuk Tanggal & Kelas ini
      await db.attendance
        .where({ classId: parseInt(journalData.classId), date: journalData.date })
        .delete();

      // 3. Simpan Absensi Baru
      // Pastikan format record sesuai
      const recordsToSave = studentRecords.map(r => ({
        date: journalData.date,
        classId: parseInt(journalData.classId),
        studentId: r.studentId,
        status: r.status
      }));
      
      await db.attendance.bulkAdd(recordsToSave);
      
      return journalId;
    });
  },

  // Hapus Riwayat Absensi
  deleteAttendanceLog: async (journalId, classId, date) => {
    return await db.transaction('rw', db.journals, db.attendance, async () => {
      await db.journals.delete(journalId);
      await db.attendance
        .where({ classId: parseInt(classId), date: date })
        .delete();
    });
  }
};