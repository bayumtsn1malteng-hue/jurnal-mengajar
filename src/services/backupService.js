// src/services/backupService.js
import { db } from '../db';
import { findAppFolder, createAppFolder, uploadFileToDrive, listBackupFiles, downloadBackupFile } from './driveService';

// Daftar tabel yang akan di-backup
const TABLES_TO_BACKUP = [
    'settings', 'classes', 'students', 'syllabus', 
    'assessments_meta', 'journals', 'attendance', 'grades', 'ideas'
];

// --- CORE LOGIC ---

const generateBackupData = async () => {
    const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        tables: {}
    };
    for (const tableName of TABLES_TO_BACKUP) {
        if (db[tableName]) {
            backupData.tables[tableName] = await db[tableName].toArray();
        }
    }
    return backupData;
};

const writeDataToDb = async (data) => {
    if (!data || !data.tables) throw new Error("Format data backup tidak valid.");

    await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) await table.clear();
        for (const tableName of TABLES_TO_BACKUP) {
            const rows = data.tables[tableName];
            if (rows && rows.length > 0 && db[tableName]) {
                await db[tableName].bulkAdd(rows);
            }
        }
    });
};

// --- HELPER BARU UNTUK AUTOMATION ---

// Cek apakah DB lokal kosong (hanya cek tabel siswa & kelas sebagai indikator)
export const isLocalDbEmpty = async () => {
    try {
        const studentCount = await db.students.count();
        const classCount = await db.classes.count();
        return (studentCount + classCount) === 0;
    } catch (e) {
        return false;
    }
};

// Simpan timestamp backup terakhir ke LocalStorage (Untuk Scheduler)
const saveLocalTimestamp = () => {
    localStorage.setItem('last_cloud_backup', new Date().toISOString());
};

export const getLocalBackupTimestamp = () => {
    return localStorage.getItem('last_cloud_backup');
};

// --- FITUR CLOUD ---

export const performCloudBackup = async () => {
    try {
        let folderId = await findAppFolder();
        if (!folderId) folderId = await createAppFolder();

        const backupData = await generateBackupData();
        const fileName = `jurnal_backup_${new Date().getTime()}.json`;

        await uploadFileToDrive(folderId, fileName, backupData);
        
        // UPDATE: Simpan timestamp ke localstorage agar scheduler tahu
        saveLocalTimestamp();
        
        return true;
    } catch (error) {
        console.error("Cloud Backup Failed:", error);
        throw error;
    }
};

export const getAvailableBackups = async () => {
    try {
        const folderId = await findAppFolder();
        if (!folderId) return [];
        return await listBackupFiles(folderId);
    } catch (error) {
        console.error("Gagal list backup:", error);
        throw error;
    }
};

export const restoreFromCloud = async (fileId) => {
    try {
        const data = await downloadBackupFile(fileId);
        await writeDataToDb(data);
        saveLocalTimestamp(); // Anggap restore sebagai sync terakhir
        return true;
    } catch (error) {
        console.error("Cloud Restore Failed:", error);
        throw error;
    }
};

export const getLastBackupMetadata = async () => {
    try {
        const files = await getAvailableBackups();
        if (files && files.length > 0) return files[0];
        return null;
    } catch { 
        return null; 
    }
};

// --- FITUR LOCAL (OFFLINE) ---

export const downloadLocalBackup = async () => {
    try {
        const data = await generateBackupData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `backup-jurnal-lokal-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error("Local Backup Failed:", error);
        throw error;
    }
};

export const restoreFromLocalFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await writeDataToDb(data);
                resolve(true);
            } catch (err) {
                reject(new Error("File rusak atau bukan format JSON yang benar."));
            }
        };
        reader.onerror = () => reject(new Error("Gagal membaca file."));
        reader.readAsText(file);
    });
};