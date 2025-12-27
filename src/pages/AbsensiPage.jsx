// src/pages/AbsensiPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, Plus, Calendar, Filter, Save, Search, Trash2, Users, BookOpen, Download } from 'lucide-react';
import { db, STATUS_ABSENSI } from '../db';
import StudentAttendanceRow from '../components/StudentAttendanceRow';
import { utils, writeFile } from 'xlsx'; // Import Library Excel

const AbsensiPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'input'
  
  // --- MASTER DATA ---
  const [historyList, setHistoryList] = useState([]); 
  const [classes, setClasses] = useState([]);
  const [syllabusList, setSyllabusList] = useState([]); 

  // --- FILTER STATE ---
  const [filterClassId, setFilterClassId] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');

  // --- INPUT STATE ---
  const [sessionData, setSessionData] = useState({
    id: null, 
    date: new Date().toISOString().split('T')[0],
    classId: '',
    syllabusId: '',     
    customTopic: ''     
  });

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); 
  const [loading, setLoading] = useState(false);

  // --- 1. LOAD DATA (FIX: Pakai useCallback agar tidak warning) ---
  const loadHistory = useCallback(async () => {
    try {
      const cls = await db.classes.toArray();
      const syl = await db.syllabus.toArray(); 
      const journals = await db.journals.reverse().toArray();

      const joined = journals.map(j => {
         const sId = j.syllabusId ? parseInt(j.syllabusId) : 0;
         const topicItem = syl.find(s => s.id === sId);
         
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
            className: cls.find(c => c.id === j.classId)?.name || '?',
            topicName: topicDisplay
         };
      });
      setHistoryList(joined);
    } catch (error) { console.error("Gagal load history:", error); }
  }, []); // Empty dependency karena db instance stabil

  // --- useEffect 1: Load Data Master (Classes, Syllabus, History) ---
  useEffect(() => {
    const initMasterData = async () => {
        // Load Kelas
        const cls = await db.classes.toArray();
        setClasses(cls);

        // Load Silabus
        try {
            const allSyllabus = await db.syllabus.orderBy('meetingOrder').toArray();
            setSyllabusList(allSyllabus);
        } catch (err) { console.error(err); }

        // Load History
        await loadHistory();
    };
    initMasterData();
  }, [view, loadHistory]);

  // --- useEffect 2: Set Default Class (FIX WARNING) ---
  // Dipisah agar sessionData.classId bisa masuk dependency tanpa loop
  useEffect(() => {
    if (classes.length > 0 && !sessionData.classId) {
        setSessionData(prev => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, sessionData.classId]);


  // --- 2. LOGIKA FILTER ---
  const filteredHistory = useMemo(() => {
    return historyList.filter(item => {
      const matchClass = filterClassId ? item.classId === parseInt(filterClassId) : true;
      const matchTopic = filterTopicId ? item.syllabusId === parseInt(filterTopicId) : true;
      return matchClass && matchTopic;
    });
  }, [historyList, filterClassId, filterTopicId]);

  const getEmptyMessage = () => {
    if (historyList.length === 0) return "Belum ada riwayat absensi.";
    return `Tidak ada data ditemukan dengan filter ini.`;
  };


  // --- 3. FITUR EXPORT EXCEL (BARU) ---
  const handleExportExcel = async () => {
    if (!filterClassId) {
        alert("⚠️ Mohon pilih 'Kelas' pada filter di atas terlebih dahulu.");
        return;
    }

    setLoading(true);
    try {
        const cId = parseInt(filterClassId);
        const selectedClass = classes.find(c => c.id === cId);
        
        // A. Tentukan Semester (Ganjil/Genap)
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        let startDate, endDate, semesterName;
        // Juli - Desember = Ganjil
        if (currentMonth >= 7) { 
            semesterName = "GANJIL"; startDate = `${currentYear}-07-01`; endDate = `${currentYear}-12-31`;
        } else {
        // Januari - Juni = Genap
            semesterName = "GENAP"; startDate = `${currentYear}-01-01`; endDate = `${currentYear}-06-30`;
        }

        // B. Cari Tanggal Mengajar Aktual (Header Kolom)
        // Hanya ambil tanggal dimana guru benar-benar mengisi jurnal di kelas ini
        const journalsInRange = await db.journals
            .where('classId').equals(cId)
            .filter(j => j.date >= startDate && j.date <= endDate)
            .sortBy('date');

        if (journalsInRange.length === 0) {
            alert(`Belum ada data mengajar untuk Kelas ${selectedClass?.name} di Semester ${semesterName}.`);
            setLoading(false);
            return;
        }

        const dateColumns = journalsInRange.map(j => j.date); // Array Tanggal [2024-07-12, ...]
        
        // C. Ambil Data Absensi
        const attendanceInRange = await db.attendance
            .where('classId').equals(cId)
            .filter(a => a.date >= startDate && a.date <= endDate)
            .toArray();

        // Mapping Cepat: key="studentId_date" -> value=status
        const attMap = {};
        attendanceInRange.forEach(a => { attMap[`${a.studentId}_${a.date}`] = a.status; });

        // D. Ambil Siswa
        const studentList = await db.students.where('classId').equals(cId).sortBy('name');

        // E. Susun Data Excel
        const excelData = [];
        studentList.forEach((s, index) => {
            const row = { No: index + 1, NIS: s.nis, Nama: s.name };
            
            let countS = 0, countI = 0, countA = 0; 

            dateColumns.forEach(date => {
                // Header Tgl: 12/07
                const dObj = new Date(date);
                const header = `${dObj.getDate()}/${dObj.getMonth() + 1}`;
                
                const status = attMap[`${s.id}_${date}`] || STATUS_ABSENSI.HADIR;
                
                let code = '.';
                if (status === STATUS_ABSENSI.HADIR) code = 'H';
                else if (status === STATUS_ABSENSI.SAKIT) { code = 'S'; countS++; }
                else if (status === STATUS_ABSENSI.IZIN)  { code = 'I'; countI++; }
                else if (status === STATUS_ABSENSI.ALPA)  { code = 'A'; countA++; }
                else if (status === STATUS_ABSENSI.BOLOS) { code = 'B'; countA++; } // Bolos dihitung A

                row[header] = code;
            });

            // Kolom Rekap
            row['S'] = countS;
            row['I'] = countI;
            row['A'] = countA; // Termasuk Bolos
            excelData.push(row);
        });

        // F. Generate & Download
        const ws = utils.json_to_sheet(excelData);
        
        // Tambah Judul Header
        utils.sheet_add_aoa(ws, [
            [`REKAPITULASI ABSENSI SEMESTER ${semesterName} ${currentYear}`],
            [`Kelas: ${selectedClass?.name}`],
            [''] // Spasi baris
        ], { origin: "A1" });

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Rekap Absensi");
        writeFile(wb, `Rekap_Absen_${selectedClass?.name}_${semesterName}.xlsx`);

        alert("✅ File Excel berhasil diunduh!");

    } catch (e) {
        console.error(e);
        alert("Gagal export: " + e.message);
    } finally {
        setLoading(false);
    }
  };


  // --- 4. INPUT FLOW (Original) ---
  const openInputPage = async (journal = null) => {
    setLoading(true);
    
    let targetClassId = sessionData.classId || (classes[0]?.id || '');
    let targetDate = sessionData.date;
    let targetSyllabusId = '';
    let targetCustomTopic = '';
    let targetJournalId = null;

    if (journal) {
        targetClassId = journal.classId;
        targetDate = journal.date;
        targetSyllabusId = journal.syllabusId || '';
        targetCustomTopic = journal.customTopic || '';
        targetJournalId = journal.id;
    } else {
        targetClassId = sessionData.classId;
        targetSyllabusId = sessionData.syllabusId;
        targetCustomTopic = sessionData.customTopic;
    }

    setSessionData({
        id: targetJournalId,
        date: targetDate,
        classId: targetClassId,
        syllabusId: targetSyllabusId,
        customTopic: targetCustomTopic
    });

    try {
        const clsStudents = await db.students.where('classId').equals(parseInt(targetClassId)).sortBy('name');
        setStudents(clsStudents);

        const existingRecords = await db.attendance.where({ classId: parseInt(targetClassId), date: targetDate }).toArray();

        const statusObj = {};
        clsStudents.forEach(s => {
            const record = existingRecords.find(r => r.studentId === s.id);
            statusObj[s.id] = record ? record.status : STATUS_ABSENSI.HADIR;
        });
        setAttendanceMap(statusObj);
        
        setView('input');
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleStartAbsen = () => {
      if (!sessionData.classId) { alert("Pilih kelas dulu!"); return; }
      if (!sessionData.syllabusId && !sessionData.customTopic) { 
          alert("Pilih Materi dari dropdown, atau isi Topik Manual jika tidak ada!"); return; 
      }
      openInputPage(); 
  };

  const handleSyllabusChange = (e) => {
      const val = e.target.value;
      setSessionData(prev => ({ ...prev, syllabusId: val, customTopic: val ? '' : prev.customTopic }));
  };

  const handleCustomTopicChange = (e) => {
      const val = e.target.value;
      setSessionData(prev => ({ ...prev, customTopic: val, syllabusId: val ? '' : prev.syllabusId }));
  };

  const handleSave = async () => {
      if(!confirm("Simpan Data Absensi?")) return;
      try {
          await db.transaction('rw', db.journals, db.attendance, async () => {
              const journalPayload = {
                  date: sessionData.date,
                  classId: parseInt(sessionData.classId),
                  syllabusId: sessionData.syllabusId ? parseInt(sessionData.syllabusId) : null,
                  customTopic: sessionData.customTopic
              };
              
              if (sessionData.id) {
                  await db.journals.update(sessionData.id, journalPayload);
              } else {
                  await db.journals.add(journalPayload);
              }

              await db.attendance.where({ classId: parseInt(sessionData.classId), date: sessionData.date }).delete();

              const records = students.map(s => ({
                  date: sessionData.date,
                  classId: parseInt(sessionData.classId),
                  studentId: s.id,
                  status: attendanceMap[s.id]
              }));
              await db.attendance.bulkAdd(records);
          });
          alert("✅ Absensi Tersimpan!");
          setSessionData(prev => ({...prev, syllabusId: '', customTopic: '', id: null}));
          setView('list');
      } catch (error) {
          console.error(error);
          alert("Gagal menyimpan: " + error.message);
      }
  };

  const handleDelete = async (e, journal) => {
      e.stopPropagation(); 
      if(!confirm(`Hapus riwayat absensi tanggal ${journal.date}?`)) return;
      try {
          await db.transaction('rw', db.journals, db.attendance, async () => {
              await db.journals.delete(journal.id);
              await db.attendance.where({ classId: journal.classId, date: journal.date }).delete();
          });
          loadHistory(); 
      } catch (err) { alert("Gagal hapus: " + err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm sticky top-0 z-20 mb-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => { 
                    if(view === 'input') setView('list'); 
                    else if(view==='create') setView('list'); 
                    else window.history.back(); 
                }} className="p-2 bg-slate-100 rounded-full text-slate-600">
                    <ChevronLeft size={24}/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">
                        {view === 'list' ? 'Riwayat Absensi' : view === 'create' ? 'Mulai Absensi' : 'Isi Presensi'}
                    </h1>
                    <p className="text-xs text-slate-500">Jurnal & Kehadiran Siswa</p>
                </div>
            </div>
            {/* Tombol Plus (Hanya di List View) */}
            {view === 'list' && (
                <div className="flex gap-2">
                    {/* TOMBOL EXPORT EXCEL (Hijau) */}
                    <button 
                        onClick={handleExportExcel}
                        className="p-3 bg-green-100 text-green-700 rounded-2xl shadow-sm hover:bg-green-200 transition-colors"
                        title="Download Rekap Semester"
                    >
                        <Download size={24} />
                    </button>

                    <button onClick={() => {
                        setSessionData(prev => ({...prev, id: null, syllabusId: '', customTopic: ''}));
                        setView('create');
                    }} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-colors">
                        <Plus size={24} />
                    </button>
                </div>
            )}
        </div>

        {/* --- FILTER SECTION (Hanya di List View) --- */}
        {view === 'list' && (
            <div className="mt-6 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                <div className="relative">
                    <div className="absolute left-3 top-3 text-indigo-500"><Filter size={16} /></div>
                    <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)} className="w-full pl-9 p-2.5 bg-indigo-50 border-none rounded-xl text-xs font-bold text-indigo-900 outline-none">
                        <option value="">Semua Kelas</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <div className="absolute left-3 top-3 text-teal-500"><Search size={16} /></div>
                    <select value={filterTopicId} onChange={(e) => setFilterTopicId(e.target.value)} className="w-full pl-9 p-2.5 bg-teal-50 border-none rounded-xl text-xs font-bold text-teal-900 outline-none">
                        <option value="">Semua Topik</option>
                        {syllabusList.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.meetingOrder} - {s.topic}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        )}
      </div>

      <div className="p-6 pt-0">
        {/* VIEW 1: LIST RIWAYAT */}
        {view === 'list' && (
           <div className="space-y-4">
             {filteredHistory.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                     <p className="text-slate-400 font-medium text-sm px-6 leading-relaxed">{getEmptyMessage()}</p>
                 </div>
             ) : (
                 filteredHistory.map(item => (
                    <div key={item.id} onClick={() => openInputPage(item)} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group relative">
                       <div className="flex justify-between mb-2">
                           <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold">{item.className}</span>
                           <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                       </div>
                       <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.topicName}</h3>
                       
                       <button onClick={(e) => handleDelete(e, item)} className="absolute top-4 right-4 p-2 text-slate-200 hover:text-red-500 transition-colors">
                           <Trash2 size={18} />
                       </button>
                    </div>
                 ))
             )}
           </div>
        )}

        {/* VIEW 2: FORM SETUP (CREATE) */}
        {view === 'create' && (
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in zoom-in-95">
             <h2 className="font-bold text-lg mb-4 text-slate-800">Setup Absensi</h2>
             <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tanggal</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-slate-400" size={18}/>
                        <input type="date" value={sessionData.date} onChange={e => setSessionData({...sessionData, date: e.target.value})} className="w-full pl-10 p-3 bg-slate-50 border rounded-xl font-bold text-slate-700" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kelas</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-3 text-slate-400" size={18}/>
                        <select value={sessionData.classId} onChange={e => setSessionData({...sessionData, classId: e.target.value})} className="w-full pl-10 p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-900">
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                        <BookOpen size={12}/> Materi / Topik Pembelajaran
                    </label>
                    <select 
                        value={sessionData.syllabusId} 
                        onChange={handleSyllabusChange} 
                        className={`w-full p-3 border rounded-xl font-bold text-slate-700 mb-2 transition-all ${sessionData.syllabusId ? 'bg-white border-teal-500 ring-2 ring-teal-100' : 'bg-white border-slate-200'}`}
                    >
                        <option value="">-- Pilih Dari Bank Materi --</option>
                        {syllabusList.map(s => (
                            <option key={s.id} value={s.id}>{s.meetingOrder} - {s.topic}</option>
                        ))}
                    </select>
                    <div className="text-center text-[10px] text-slate-400 font-bold mb-2">- ATAU -</div>
                    <input 
                        type="text" 
                        placeholder="Ketik topik manual di sini..." 
                        value={sessionData.customTopic}
                        onChange={handleCustomTopicChange}
                        className={`w-full p-3 border rounded-xl font-bold text-slate-700 transition-all ${sessionData.customTopic ? 'bg-white border-teal-500 ring-2 ring-teal-100' : 'bg-white border-slate-200'}`}
                    />
                </div>
                <div className="pt-2">
                    <button onClick={handleStartAbsen} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all active:scale-95">
                        Lanjut ke Daftar Siswa
                    </button>
                </div>
             </div>
           </div>
        )}

        {/* VIEW 3: INPUT CHECKLIST */}
        {view === 'input' && (
             <div className="space-y-4 animate-in slide-in-from-bottom-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-indigo-900 text-sm">Kelas {classes.find(c => c.id == sessionData.classId)?.name}</h3>
                        <p className="text-xs text-indigo-600 font-medium mt-1">
                            {sessionData.syllabusId 
                                ? (syllabusList.find(s => s.id == sessionData.syllabusId)?.topic || 'Topik Terpilih')
                                : sessionData.customTopic}
                        </p>
                    </div>
                    <div className="text-right">
                         <span className="text-[10px] font-bold bg-white px-2 py-1 rounded text-indigo-400 block mb-1">Total Siswa</span>
                         <span className="font-bold text-indigo-700 text-lg">{students.length}</span>
                    </div>
                </div>

                {loading ? <p className="text-center text-slate-400">Memuat data siswa...</p> : (
                    <div className="pb-24">
                        {students.map(student => (
                            <StudentAttendanceRow
                                key={student.id}
                                student={student}
                                currentStatus={attendanceMap[student.id]}
                                onChange={(sid, stat) => setAttendanceMap(prev => ({...prev, [sid]: stat}))}
                            />
                        ))}
                    </div>
                )}
                
                <div className="fixed bottom-20 left-6 right-6 max-w-md mx-auto z-30">
                    <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl flex justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
                        <Save/> Simpan Absensi
                    </button>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default AbsensiPage;