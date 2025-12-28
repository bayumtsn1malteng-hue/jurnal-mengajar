// src/utils/excelGenerator.js
import { utils, writeFile } from 'xlsx';
import { STATUS_ABSENSI } from '../db';

/**
 * 1. REKAP ABSENSI
 */
export const downloadAttendanceExcel = async (classId, className, dbInstance) => {
  if (!classId) throw new Error("Class ID is required");

  // Tentukan Semester (Ganjil/Genap)
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

  // Ambil Tanggal Jurnal (Header Kolom)
  const journalsInRange = await dbInstance.journals
    .where('classId').equals(classId)
    .filter(j => j.date >= startDate && j.date <= endDate)
    .sortBy('date');

  if (journalsInRange.length === 0) {
    throw new Error(`Belum ada data mengajar untuk Kelas ${className} di Semester ${semesterName}.`);
  }

  const dateColumns = journalsInRange.map(j => j.date);

  // Ambil Data Absensi
  const attendanceInRange = await dbInstance.attendance
    .where('classId').equals(classId)
    .filter(a => a.date >= startDate && a.date <= endDate)
    .toArray();

  const attMap = {};
  attendanceInRange.forEach(a => {
    attMap[`${a.studentId}_${a.date}`] = a.status;
  });

  // Ambil Siswa
  const studentList = await dbInstance.students
    .where('classId').equals(classId)
    .sortBy('name');

  // Susun Data Excel
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

  // Generate Sheet
  const ws = utils.json_to_sheet(excelData);
  utils.sheet_add_aoa(ws, [
    [`REKAPITULASI ABSENSI SEMESTER ${semesterName} ${currentYear}`],
    [`Kelas: ${className}`],
    ['']
  ], { origin: "A1" });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Rekap Absensi");
  writeFile(wb, `Rekap_Absen_${className}_${semesterName}.xlsx`);
};


/**
 * 2. REKAP NILAI (NEW FEATURE)
 */
export const downloadGradesExcel = async (classId, className, subject, dbInstance) => {
    if (!classId) throw new Error("Pilih Kelas terlebih dahulu.");

    // 1. Ambil Semua Penilaian (Kolom) untuk Kelas & Mapel ini
    const assessments = await dbInstance.assessments_meta
        .where({ classId: parseInt(classId), subject: subject })
        .sortBy('date');

    if (assessments.length === 0) {
        throw new Error(`Belum ada penilaian untuk Mapel ${subject} di Kelas ${className}.`);
    }

    // 2. Ambil Siswa (Baris)
    const students = await dbInstance.students
        .where('classId').equals(parseInt(classId))
        .sortBy('name');

    if (students.length === 0) {
        throw new Error("Data siswa tidak ditemukan.");
    }

    // 3. Ambil Semua Nilai (Isi)
    // Dexie 'anyOf' untuk mengambil nilai dari daftar ID assessment
    const assessmentIds = assessments.map(a => a.id);
    const allGrades = await dbInstance.grades
        .where('assessmentMetaId').anyOf(assessmentIds)
        .toArray();

    // Mapping Nilai biar cepat akses: gradesMap[studentId_assessmentId] = score
    const gradesMap = {};
    allGrades.forEach(g => {
        gradesMap[`${g.studentId}_${g.assessmentMetaId}`] = g.score;
    });

    // 4. Susun Format Excel
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
            // Nama Kolom: "UH1 (Materi)" atau cukup Nama Penilaian
            row[a.name] = score !== undefined ? score : ''; // Kosongkan jika belum dinilai

            if (score !== undefined) {
                totalScore += score;
                countScore++;
            }
        });

        // Hitung Rata-rata
        row['Rata-Rata'] = countScore > 0 ? (totalScore / countScore).toFixed(2) : 0;
        
        return row;
    });

    // 5. Generate File
    const ws = utils.json_to_sheet(excelData);

    // Header Judul
    utils.sheet_add_aoa(ws, [
        [`DAFTAR NILAI ${subject.toUpperCase()}`],
        [`Kelas: ${className}`],
        [''] // Spasi
    ], { origin: "A1" });

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Rekap Nilai");
    
    // Nama file yang aman
    const safeSubject = subject.replace(/[^a-z0-9]/gi, '_').substring(0, 10);
    writeFile(wb, `Nilai_${safeSubject}_${className}.xlsx`);
};