// src/utils/excelGenerator.js
import { utils, writeFile } from 'xlsx';
import { STATUS_ABSENSI } from '../db';

/**
 * HELPER INTERNAL: Membuat Worksheet Absensi
 * Dipisahkan agar bisa dipakai untuk download single (AbsensiPage) maupun bulk (PengaturanPage)
 */
const createAttendanceWorksheet = async (classId, className, dbInstance) => {
  if (!classId) throw new Error("Class ID is required");

  // 1. Tentukan Semester
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let startDate, endDate, semesterName;
  if (currentMonth >= 7) {
    semesterName = "GANJIL";
    startDate = `${currentYear}-07-01`;
    endDate = `${currentYear}-12-31`;
  } else {
    semesterName = "GENAP";
    startDate = `${currentYear}-01-01`;
    endDate = `${currentYear}-06-30`;
  }

  // 2. Ambil Jurnal (Header Tanggal)
  const journalsInRange = await dbInstance.journals
    .where('classId').equals(classId)
    .filter(j => j.date >= startDate && j.date <= endDate)
    .sortBy('date');

  const dateColumns = journalsInRange.map(j => j.date);

  // 3. Ambil Data Absensi
  const attendanceInRange = await dbInstance.attendance
    .where('classId').equals(classId)
    .filter(a => a.date >= startDate && a.date <= endDate)
    .toArray();

  const attMap = {};
  attendanceInRange.forEach(a => {
    attMap[`${a.studentId}_${a.date}`] = a.status;
  });

  // 4. Ambil Siswa
  const studentList = await dbInstance.students
    .where('classId').equals(classId)
    .sortBy('name');

  // 5. Susun Data Excel
  const excelData = [];
  studentList.forEach((s, index) => {
    const row = {
      No: index + 1,
      NIS: s.nis,
      Nama: s.name
    };

    let countS = 0, countI = 0, countA = 0;

    dateColumns.forEach(date => {
      const dObj = new Date(date);
      const header = `${dObj.getDate()}/${dObj.getMonth() + 1}`;
      const status = attMap[`${s.id}_${date}`] || STATUS_ABSENSI.HADIR;

      let code = '.';
      if (status === STATUS_ABSENSI.HADIR) code = 'H';
      else if (status === STATUS_ABSENSI.SAKIT) { code = 'S'; countS++; }
      else if (status === STATUS_ABSENSI.IZIN) { code = 'I'; countI++; }
      else if (status === STATUS_ABSENSI.ALPA) { code = 'A'; countA++; }
      else if (status === STATUS_ABSENSI.BOLOS) { code = 'B'; countA++; }

      row[header] = code;
    });

    row['S'] = countS;
    row['I'] = countI;
    row['A'] = countA;
    excelData.push(row);
  });

  // 6. Buat Sheet
  const ws = utils.json_to_sheet(excelData);
  
  utils.sheet_add_aoa(ws, [
    [`REKAPITULASI ABSENSI SEMESTER ${semesterName} ${currentYear}`],
    [`Kelas: ${className}`],
    ['']
  ], { origin: "A1" });

  return { ws, semesterName };
};


/**
 * 1. DOWNLOAD SINGLE CLASS ABSENSI 
 * (Digunakan di AbsensiPage.jsx)
 */
export const downloadAttendanceExcel = async (classId, className, dbInstance) => {
  const { ws, semesterName } = await createAttendanceWorksheet(classId, className, dbInstance);
  
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Rekap Absensi");
  writeFile(wb, `Rekap_Absen_${className}_${semesterName}.xlsx`);
};


/**
 * 2. DOWNLOAD ALL CLASSES ABSENSI
 * (Digunakan di PengaturanPage.jsx)
 */
export const downloadAllAttendance = async (dbInstance) => {
    const classes = await dbInstance.classes.toArray();
    if (classes.length === 0) throw new Error("Belum ada data kelas.");

    const wb = utils.book_new();
    let hasData = false;

    for (const cls of classes) {
        try {
            const { ws } = await createAttendanceWorksheet(cls.id, cls.name, dbInstance);
            
            // Nama sheet max 31 char & karakter aman
            const sheetName = cls.name.replace(/[\\/?*[\]]/g, "").substring(0, 30);
            utils.book_append_sheet(wb, ws, sheetName);
            hasData = true;
        } catch (e) {
            // FIX ESLINT: Gunakan variabel 'e' untuk logging (walau warning),
            // atau hapus '(e)' jika environment mendukung ES2019 catch binding.
            // Di sini kita log agar 'e' terpakai dan kita tahu errornya apa.
            console.warn(`Gagal generate sheet kelas ${cls.name}:`, e);
        }
    }

    if (!hasData) throw new Error("Tidak ada data absensi untuk diekspor.");
    writeFile(wb, `FULL_ABSENSI_${new Date().getFullYear()}.xlsx`);
};


/**
 * 3. DOWNLOAD SINGLE NILAI 
 * (Digunakan di NilaiPage.jsx)
 */
export const downloadGradesExcel = async (classId, className, subject, dbInstance) => {
    if (!classId) throw new Error("Pilih Kelas terlebih dahulu.");

    // Ambil Data
    const assessments = await dbInstance.assessments_meta
        .where({ classId: parseInt(classId), subject: subject })
        .sortBy('date');

    if (assessments.length === 0) throw new Error(`Belum ada penilaian Mapel ${subject} di Kelas ${className}.`);

    const students = await dbInstance.students
        .where('classId').equals(parseInt(classId))
        .sortBy('name');

    if (students.length === 0) throw new Error("Data siswa tidak ditemukan.");

    const assessmentIds = assessments.map(a => a.id);
    const allGrades = await dbInstance.grades
        .where('assessmentMetaId').anyOf(assessmentIds)
        .toArray();

    const gradesMap = {};
    allGrades.forEach(g => {
        gradesMap[`${g.studentId}_${g.assessmentMetaId}`] = g.score;
    });

    // Susun Data
    const excelData = students.map((s, index) => {
        const row = {
            No: index + 1,
            NIS: s.nis,
            Nama: s.name
        };

        let totalScore = 0;
        let countScore = 0;

        assessments.forEach(a => {
            const score = gradesMap[`${s.id}_${a.id}`];
            row[a.name] = score !== undefined ? score : ''; 

            if (score !== undefined) {
                totalScore += score;
                countScore++;
            }
        });

        row['Rata-Rata'] = countScore > 0 ? (totalScore / countScore).toFixed(2) : 0;
        return row;
    });

    const ws = utils.json_to_sheet(excelData);

    utils.sheet_add_aoa(ws, [
        [`DAFTAR NILAI ${subject.toUpperCase()}`],
        [`Kelas: ${className}`],
        [''] 
    ], { origin: "A1" });

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Rekap Nilai");
    
    const safeSubject = subject.replace(/[^a-z0-9]/gi, '_').substring(0, 10);
    writeFile(wb, `Nilai_${safeSubject}_${className}.xlsx`);
};


/**
 * 4. DOWNLOAD ALL GRADES
 * (Digunakan di PengaturanPage.jsx)
 */
export const downloadAllGrades = async (dbInstance) => {
    const classes = await dbInstance.classes.toArray();
    if (classes.length === 0) throw new Error("Belum ada data kelas.");

    const wb = utils.book_new();
    let hasData = false;

    for (const cls of classes) {
        // Ambil Siswa
        const students = await dbInstance.students.where('classId').equals(cls.id).sortBy('name');
        if (students.length === 0) continue;

        // Ambil Penilaian
        const assessments = await dbInstance.assessments_meta.where('classId').equals(cls.id).toArray();
        if (assessments.length === 0) continue;

        // Ambil Nilai
        const metaIds = assessments.map(a => a.id);
        const grades = await dbInstance.grades.where('assessmentMetaId').anyOf(metaIds).toArray();
        const gradeMap = {};
        grades.forEach(g => gradeMap[`${g.studentId}_${g.assessmentMetaId}`] = g.score);

        // Susun Data Flat
        const excelData = students.map((s, idx) => {
            const row = { No: idx + 1, NIS: s.nis, Nama: s.name };
            
            assessments.forEach(ass => {
                const val = gradeMap[`${s.id}_${ass.id}`];
                // Header format: "MTK - UH1"
                const header = `${ass.subject?.substring(0,3) || 'Mapel'} - ${ass.name}`; 
                row[header] = val !== undefined ? val : '';
            });
            return row;
        });

        if (excelData.length > 0) {
            const ws = utils.json_to_sheet(excelData);
            utils.sheet_add_aoa(ws, [[`REKAP NILAI KELAS ${cls.name}`], ['']], { origin: "A1" });
            
            const sheetName = cls.name.replace(/[\\/?*[\]]/g, "").substring(0, 30);
            utils.book_append_sheet(wb, ws, sheetName);
            hasData = true;
        }
    }

    if (!hasData) throw new Error("Belum ada data nilai untuk diekspor.");
    writeFile(wb, `FULL_NILAI_${new Date().getFullYear()}.xlsx`);
};