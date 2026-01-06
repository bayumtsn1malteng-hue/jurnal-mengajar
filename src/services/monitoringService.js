// src/services/monitoringService.js
import { db, STATUS_ABSENSI } from '../db';

// --- KONSTANTA BATASAN (THRESHOLD) ---
const RISK_THRESHOLDS = {
    ATTENDANCE_CRITICAL: 75, // Dibawah 75% kehadiran = Merah
    ATTENDANCE_WARNING: 90,  // Dibawah 90% kehadiran = Kuning
    BEHAVIOR_MAX_NEGATIVE: 3 // Lebih dari 3 catatan negatif = Merah
};

// 1. Hitung Persentase Kehadiran Siswa
export const calculateAttendanceStats = async (studentId) => {
    // Ambil semua data absensi siswa ini
    const logs = await db.attendance.where('studentId').equals(studentId).toArray();
    
    // Total hari efektif (asumsi: logs hanya mencatat ketidakhadiran, 
    // jadi kita butuh total hari sekolah. Untuk simplifikasi, kita hitung based on logs yg ada dulu
    // atau jika Anda punya data 'totalSchoolDays', itu lebih akurat.
    // Di sini kita pakai logika sederhana: "Jumlah S/I/A"
    
    let sakit = 0, izin = 0, alpa = 0, bolos = 0;
    logs.forEach(log => {
        if (log.status === STATUS_ABSENSI.SAKIT) sakit++;
        if (log.status === STATUS_ABSENSI.IZIN) izin++;
        if (log.status === STATUS_ABSENSI.ALPA) alpa++;
        if (log.status === STATUS_ABSENSI.BOLOS) bolos++;
    });

    const totalAbsent = sakit + izin + alpa + bolos;
    
    // CATATAN: Idealnya kita tahu total hari sekolah efektif. 
    // Karena Dexie lokal sulit tahu hari libur, kita pakai estimasi atau data dari settings jika ada.
    // Untuk sekarang, kita kembalikan raw data saja.
    return { sakit, izin, alpa, bolos, totalAbsent };
};

// 2. Analisis Risiko Siswa (The Brain)
export const analyzeStudentRisk = async (studentId) => {
    const riskFactors = [];
    let riskLevel = 'GREEN'; // Default Aman

    // A. Cek Perilaku (30 Hari Terakhir)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const negativeBehaviors = await db.student_behaviors
        .where('[studentId+date]')
        .between([studentId, dateStr], [studentId, '\uffff']) // Query range index
        .filter(b => b.type === 'NEGATIVE')
        .count();

    if (negativeBehaviors >= RISK_THRESHOLDS.BEHAVIOR_MAX_NEGATIVE) {
        riskLevel = 'RED';
        riskFactors.push(`${negativeBehaviors} Perilaku Negatif (30 hari)`);
    } else if (negativeBehaviors > 0) {
        if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
        riskFactors.push(`${negativeBehaviors} Perilaku Negatif`);
    }

    // B. Cek Absensi (Alpa/Bolos itu fatal)
    const attStats = await calculateAttendanceStats(studentId);
    if (attStats.alpa + attStats.bolos >= 3) {
        riskLevel = 'RED';
        riskFactors.push(`Sering Alpa/Bolos (${attStats.alpa + attStats.bolos}x)`);
    }

    // C. Cek Intervensi Aktif
    const activeInterventions = await db.interventions
        .where('[studentId+status]')
        .equals([studentId, 'OPEN'])
        .count();

    return {
        level: riskLevel, // GREEN, YELLOW, RED
        factors: riskFactors,
        hasActiveIntervention: activeInterventions > 0,
        stats: { negativeBehaviors, ...attStats }
    };
};

// 3. Fungsi CRUD Helper
export const addBehaviorLog = async (data) => {
    // data: { studentId, date, type, category, description }
    return await db.student_behaviors.add(data);
};

export const createIntervention = async (data) => {
    // data: { studentId, startDate, trigger, problemSummary, actionPlan, status: 'OPEN' }
    return await db.interventions.add(data);
};

export const resolveIntervention = async (id, notes) => {
    return await db.interventions.update(id, {
        status: 'RESOLVED',
        resultNotes: notes,
        resolvedDate: new Date().toISOString()
    });
};

export const getStudentHistory = async (studentId) => {
    // Gabungkan Behavior & Intervensi jadi satu timeline
    const behaviors = await db.student_behaviors
        .where('studentId').equals(studentId).toArray();
        
    const interventions = await db.interventions
        .where('studentId').equals(studentId).toArray();

    // Normalisasi data agar bisa disortir tanggalnya
    const timeline = [
        ...behaviors.map(b => ({ ...b, kind: 'BEHAVIOR', dateObj: new Date(b.date) })),
        ...interventions.map(i => ({ ...i, kind: 'INTERVENTION', dateObj: new Date(i.startDate) }))
    ];

    // Sort Newest First
    return timeline.sort((a, b) => b.dateObj - a.dateObj);
};