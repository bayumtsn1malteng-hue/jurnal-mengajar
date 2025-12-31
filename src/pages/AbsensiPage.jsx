// src/pages/AbsensiPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, Plus, Calendar, Filter, Save, Search, Trash2, Users, BookOpen, Download } from 'lucide-react';
import { STATUS_ABSENSI } from '../db';
import StudentAttendanceRow from '../components/StudentAttendanceRow';
import { downloadAttendanceExcel } from '../utils/excelGenerator';
import { attendanceService } from '../services/attendanceService';
// --- NEW IMPORTS ---
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AbsensiPage = () => {
  const [view, setView] = useState('list'); 
  
  const [historyList, setHistoryList] = useState([]); 
  const [classes, setClasses] = useState([]);
  const [syllabusList, setSyllabusList] = useState([]); 

  const [filterClassId, setFilterClassId] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');

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

  // --- MODAL STATE (NEW) ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });

  // Helper untuk membuka modal
  const confirmAction = (title, message, action, isDanger = false) => {
    setModal({ isOpen: true, title, message, onConfirm: action, isDanger });
  };

  const loadHistory = useCallback(async () => {
    try {
      const data = await attendanceService.getHistoryLog();
      setHistoryList(data);
    } catch (error) { 
      console.error(error); 
      toast.error("Gagal memuat riwayat"); 
    }
  }, []); 

  useEffect(() => {
    const initMasterData = async () => {
        try {
            const [clsData, sylData] = await Promise.all([
                attendanceService.getClasses(),
                attendanceService.getSyllabus()
            ]);
            setClasses(clsData);
            setSyllabusList(sylData);
            await loadHistory();
        } catch (err) { console.error(err); }
    };
    initMasterData();
  }, [view, loadHistory]);

  useEffect(() => {
    if (classes.length > 0 && !sessionData.classId) {
        setSessionData(prev => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, sessionData.classId]);

  const filteredHistory = useMemo(() => {
    return historyList.filter(item => {
      const matchClass = filterClassId ? item.classId === parseInt(filterClassId) : true;
      const matchTopic = filterTopicId ? item.syllabusId === parseInt(filterTopicId) : true;
      return matchClass && matchTopic;
    });
  }, [historyList, filterClassId, filterTopicId]);

  const handleExportExcel = async () => {
    if (!filterClassId) {
        toast.error("Pilih 'Kelas' dulu di filter atas!"); // Ganti Alert
        return;
    }
    setLoading(true);
    const toastId = toast.loading("Sedang membuat Excel..."); // Loading Toast

    try {
        const cId = parseInt(filterClassId);
        const selectedClass = classes.find(c => c.id === cId);
        
        const { db } = await import('../db'); 
        await downloadAttendanceExcel(cId, selectedClass?.name, db);

        toast.success("Excel berhasil diunduh!", { id: toastId }); // Update Toast Sukses
    } catch (e) {
        console.error(e);
        toast.error("Gagal export: " + e.message, { id: toastId });
    } finally {
        setLoading(false);
    }
  };

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
        const clsStudents = await attendanceService.getStudentsByClass(targetClassId);
        setStudents(clsStudents);
        const existingRecords = await attendanceService.getExistingAttendance(targetClassId, targetDate);

        const statusObj = {};
        clsStudents.forEach(s => {
            const record = existingRecords.find(r => r.studentId === s.id);
            statusObj[s.id] = record ? record.status : STATUS_ABSENSI.HADIR;
        });
        setAttendanceMap(statusObj);
        setView('input');
    } catch (e) { console.error(e); toast.error("Gagal membuka data kelas"); } 
    finally { setLoading(false); }
  };

  const handleStartAbsen = () => {
      if (!sessionData.classId) { toast.error("Pilih kelas dulu!"); return; }
      if (!sessionData.syllabusId && !sessionData.customTopic) { 
          toast.error("Isi topik materi dulu!"); return; 
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

  // --- LOGIC SIMPAN DENGAN MODAL ---
  const handleSaveClick = () => {
    confirmAction(
      "Simpan Absensi?", 
      `Pastikan data kehadiran untuk tanggal ${sessionData.date} sudah benar.`,
      processSave, // Callback function jika user klik 'Ya'
      false // Not Danger
    );
  };

  const processSave = async () => {
      const toastId = toast.loading("Menyimpan data...");
      try {
          const journalPayload = {
             id: sessionData.id,
             date: sessionData.date,
             classId: sessionData.classId,
             syllabusId: sessionData.syllabusId,
             customTopic: sessionData.customTopic
          };

          const studentRecords = students.map(s => ({
              studentId: s.id,
              status: attendanceMap[s.id]
          }));

          await attendanceService.saveAttendance(journalPayload, studentRecords);

          toast.success("Absensi Tersimpan!", { id: toastId });
          setSessionData(prev => ({...prev, syllabusId: '', customTopic: '', id: null}));
          setView('list');
      } catch (error) {
          console.error(error);
          toast.error("Gagal menyimpan: " + error.message, { id: toastId });
      }
  };

  // --- LOGIC HAPUS DENGAN MODAL ---
  const handleDeleteClick = (e, journal) => {
      e.stopPropagation(); 
      confirmAction(
        "Hapus Riwayat?",
        `Data absensi tanggal ${journal.date} akan dihapus permanen.`,
        () => processDelete(journal),
        true // Danger Mode (Merah)
      );
  };

  const processDelete = async (journal) => {
      try {
          await attendanceService.deleteAttendanceLog(journal.id, journal.classId, journal.date);
          toast.success("Data berhasil dihapus");
          loadHistory(); 
      } catch (err) { toast.error("Gagal hapus: " + err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* --- RENDER MODAL --- */}
      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({...modal, isOpen: false})}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        isDanger={modal.isDanger}
      />

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
            {view === 'list' && (
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportExcel}
                        className="p-3 bg-green-100 text-green-700 rounded-2xl shadow-sm hover:bg-green-200 transition-colors"
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

        {/* --- FILTER SECTION --- */}
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
                 <div className="text-center py-18 bg-white rounded-3xl border border-dashed border-slate-200">
                     <p className="text-slate-400 font-medium text-sm px-6 leading-relaxed">Belum ada riwayat absensi.</p>
                 </div>
             ) : (
                 filteredHistory.map(item => (
                    <div key={item.id} onClick={() => openInputPage(item)} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group relative">
                       <div className="flex justify-between mb-2">
                           <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold">{item.className}</span>
                           <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                       </div>
                       <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.topicName}</h3>
                       
                       {/* GANTI BUTTON DELETE DENGAN HANDLER BARU */}
                       <button onClick={(e) => handleDeleteClick(e, item)} className="absolute top-10 right-4 p-2 text-slate-200 hover:text-red-500 transition-colors">
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
                    {/* GANTI TOMBOL SAVE BIASA DENGAN HANDLER BARU */}
                    <button onClick={handleSaveClick} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl flex justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
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