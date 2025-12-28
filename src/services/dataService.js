// src/services/dataService.js
import { db } from '../db';

export const dataService = {
  // 1. Ambil semua data untuk Backup
  exportData: async () => {
    const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];
    const data = { 
      timestamp: new Date().toISOString(), 
      version: 2,
      source: 'JurnalGuruApp'
    };

    for (const table of tables) {
      try {
          data[table] = await db[table].toArray();
      } catch (err) {
          console.error(`Gagal ambil tabel ${table}:`, err);
          data[table] = [];
      }
    }
    return JSON.stringify(data, null, 2);
  },

  // 2. Restore Data (Merge/Overwrite)
  importData: async (jsonString) => {
    try {
      const backupData = JSON.parse(jsonString);
      
      // Validasi sederhana
      if (!backupData.timestamp || !backupData.version) {
        throw new Error("Format file backup tidak valid.");
      }

      const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];

      await db.transaction('rw', db.classes, db.students, db.settings, db.syllabus, db.assessments_meta, db.journals, db.attendance, db.grades, async () => {
        for (const table of tables) {
          if (backupData[table] && Array.isArray(backupData[table])) {
            // Gunakan bulkPut agar data yang ID-nya sama akan ditimpa (Update), 
            // data baru ditambahkan. Data lama yang tidak ada di backup TETAP ADA (Merge).
            await db[table].bulkPut(backupData[table]);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Gagal memproses file: " + error.message);
    }
  }
};