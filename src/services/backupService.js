// src/services/backupService.js
import { db } from '../db';
import { 
    findAppFolder, createAppFolder, uploadFileToDrive, updateFileInDrive, 
    findFileInFolder, downloadBackupFile, listBackupFiles 
} from './driveService';

const TABLES_TO_BACKUP = [
    'settings', 'classes', 'students', 'syllabus', 
    'assessments_meta', 'journals', 'attendance', 'grades', 'ideas'
];
const SYNC_FILENAME = "jurnal_auto_sync.json";

// --- HELPER DATA ---
const generateBackupData = async () => {
    const backupData = {
        version: 1,
        last_modified: new Date().toISOString(),
        device_info: navigator.userAgent,
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
    if (!data || !data.tables) throw new Error("Format data tidak valid.");
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

// --- LOGIKA SYNC OTOMATIS (SINGLE FILE) ---
export const performAutoSync = async () => {
    try {
        let folderId = await findAppFolder();
        if (!folderId) folderId = await createAppFolder();

        const backupData = await generateBackupData();
        const existingFile = await findFileInFolder(folderId, SYNC_FILENAME);

        if (existingFile) {
            await updateFileInDrive(existingFile.id, backupData);
        } else {
            await uploadFileToDrive(folderId, SYNC_FILENAME, backupData);
        }

        // Simpan timestamp lokal
        localStorage.setItem('last_sync_time', new Date().toISOString());
        return true;
    } catch (error) {
        console.error("Auto Sync Failed:", error);
        throw error;
    }
};

// --- HELPER UNTUK RESTORE & LOCAL ---
export const isLocalDbEmpty = async () => {
    try {
        const studentCount = await db.students.count();
        const classCount = await db.classes.count();
        return (studentCount + classCount) === 0;
    } catch { 
        return false; 
    }
};

export const checkCloudForSyncFile = async () => {
    try {
        const folderId = await findAppFolder();
        if (!folderId) return null;
        return await findFileInFolder(folderId, SYNC_FILENAME);
    } catch { 
        return null; 
    }
};

export const restoreFromCloudFile = async (fileId) => {
    const data = await downloadBackupFile(fileId);
    await writeDataToDb(data);
    localStorage.setItem('last_sync_time', new Date().toISOString());
    return true;
};

// --- FUNGSI PENDUKUNG (LEGACY & SCHEDULER) ---

// 1. Digunakan oleh Scheduler di Dashboard.jsx (YANG TADI HILANG)
export const getLocalBackupTimestamp = () => {
    return localStorage.getItem('last_sync_time');
};

// 2. Digunakan oleh PengaturanPage.jsx
export const getAvailableBackups = async () => {
    try {
        const folderId = await findAppFolder();
        if (!folderId) return [];
        return await listBackupFiles(folderId);
    } catch { 
        return []; 
    }
};

// 3. Digunakan oleh PengaturanPage & AuthContext
export const getLastBackupMetadata = async () => {
    try {
        // Prioritas: Cek file sync tunggal (Real-time)
        const syncFile = await checkCloudForSyncFile();
        if (syncFile) return syncFile;

        // Fallback: Cek list backup lama
        const files = await getAvailableBackups();
        if (files && files.length > 0) return files[0];
        
        return null;
    } catch { 
        return null; 
    }
};

// Alias untuk kompatibilitas kode lama
export const restoreFromCloud = restoreFromCloudFile; 
export const performCloudBackup = performAutoSync; 

// --- LOCAL FILE SUPPORT ---
export const downloadLocalBackup = async () => {
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
};

export const restoreFromLocalFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await writeDataToDb(data);
                resolve(true);
            } catch { 
                reject(new Error("File rusak/invalid.")); 
            }
        };
        reader.onerror = () => reject(new Error("Gagal baca file."));
        reader.readAsText(file);
    });
};