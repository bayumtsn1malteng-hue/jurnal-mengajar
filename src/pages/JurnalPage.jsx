// src/pages/JurnalPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { db, STATUS_ABSENSI } from '../db';
import { 
  ChevronLeft, Calendar, Clock, 
  Edit3, Trash2, Tag, 
  AlertCircle, CheckCircle2, FileText 
} from 'lucide-react';

const JurnalPage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [journals, setJournals] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedClassId, setSelectedClassId] = useState('');

  // Modal State (Untuk Refleksi)
  const [activeJournal, setActiveJournal] = useState(null);
  const [reflectionText, setReflectionText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  

  // --- 1. LOAD DATA & STITCHING (MENJAHIT DATA) ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // A. Load Master Data
        const clsList = await db.classes.toArray();
        setClasses(clsList);
        const sylList = await db.syllabus.toArray();
        const assessmentList = await db.assessments_meta.toArray();

        // B. Load Jurnal (Filter by Month di level Query agar ringan)
        // Catatan: Dexie string comparison bekerja untuk format ISO Date
        const allJournals = await db.journals
            .where('date').between(`${selectedMonth}-01`, `${selectedMonth}-31\uffff`)
            .reverse()
            .toArray();

        // C. "JAHIT" DATA (Manual Join)
        const enrichedJournals = await Promise.all(allJournals.map(async (j) => {
           // 1. Nama Kelas
           const cls = clsList.find(c => c.id === j.classId);
           
           // 2. Nama Materi
           const sId = j.syllabusId ? parseInt(j.syllabusId) : 0;
           const topic = sylList.find(s => s.id === sId);

           // 3. Statistik Absensi (Hitung yang TIDAK HADIR)
           const absensiCount = await db.attendance
              .where({ date: j.date, classId: j.classId })
              .filter(a => a.status !== STATUS_ABSENSI.HADIR)
              .count();

           // 4. Cek Latihan/Ulangan
           const hasAssessment = assessmentList.some(
              a => a.date === j.date && a.classId === j.classId
           );

           return {
             ...j,
             className: cls ? cls.name : 'Kelas Terhapus',
             // Fallback Logic: Jika topic kosong, tampilkan info manual/kosong
             topicName: topic 
                ? `${topic.meetingOrder} - ${topic.topic}` 
                : (j.customTopic ? `(Manual) ${j.customTopic}` : 'Materi Kosong / Non-KBM'),
             topicSubject: topic ? topic.subject : 'Umum',
             absentCount: absensiCount,
             hasAssessment: hasAssessment,
             // Tags & Reflection sudah ada di j (jika sudah diisi)
             tags: j.tags || [] 
           };
        }));

        setJournals(enrichedJournals);

      } catch (err) {
        console.error("Gagal load jurnal:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedMonth]); // Reload jika bulan berubah

  // --- 2. FILTER LOKAL (KELAS) & GROUPING ---
  const filteredJournals = useMemo(() => {
    if (!selectedClassId) return journals;
    return journals.filter(j => j.classId === parseInt(selectedClassId));
  }, [journals, selectedClassId]);

  // Group by Date (Untuk Timeline)
  const groupedJournals = useMemo(() => {
    const groups = {};
    filteredJournals.forEach(j => {
       if (!groups[j.date]) groups[j.date] = [];
       groups[j.date].push(j);
    });
    return groups;
  }, [filteredJournals]);

  // --- 3. ACTIONS ---

  // Buka Modal Refleksi
  const openDetail = (journal) => {
    setActiveJournal(journal);
    setReflectionText(journal.reflection || '');
    setTagsInput(journal.tags ? journal.tags.join(', ') : '');
  };

  // Simpan Refleksi & Tags
  const handleSaveReflection = async () => {
     if (!activeJournal) return;
     
     // Parse Tags (Split koma -> Array)
     const tagsArray = tagsInput.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`); // Otomatis tambah #

     try {
       await db.journals.update(activeJournal.id, {
          reflection: reflectionText,
          tags: tagsArray
       });
       
       // Update State Lokal (Biar gak perlu reload DB)
       setJournals(prev => prev.map(j => 
          j.id === activeJournal.id 
          ? { ...j, reflection: reflectionText, tags: tagsArray } 
          : j
       ));
       
       setActiveJournal(null); // Tutup Modal
       alert("Catatan refleksi tersimpan! 📝");
     } catch (e) {
       alert("Gagal simpan: " + e.message);
     }
  };

  // Hapus Jurnal
  const handleDelete = async (journal) => {
     if(!confirm("Hapus jurnal ini? Data absensi hari tersebut juga akan dihapus.")) return;
     try {
        await db.transaction('rw', db.journals, db.attendance, async () => {
           await db.journals.delete(journal.id);
           await db.attendance.where({ date: journal.date, classId: journal.classId }).delete();
        });
        // Remove from list
        setJournals(prev => prev.filter(j => j.id !== journal.id));
        if (activeJournal?.id === journal.id) setActiveJournal(null);
     } catch (e) { alert("Gagal hapus: " + e); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER FIXED */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="p-2 bg-slate-100 rounded-full text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Jurnal Mengajar</h1>
            <p className="text-xs text-slate-500">Timeline & Refleksi Guru</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
          />
          <select 
             value={selectedClassId}
             onChange={(e) => setSelectedClassId(e.target.value)}
             className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
          >
             <option value="">Semua Kelas</option>
             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* TIMELINE CONTENT */}
      <div className="p-6">
        {loading ? (
           <div className="text-center py-12 text-slate-400">Memuat timeline...</div>
        ) : Object.keys(groupedJournals).length === 0 ? (
           <div className="text-center py-12 border border-dashed border-slate-300 rounded-3xl mt-4">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
               <Calendar size={32}/>
             </div>
             <p className="text-slate-500 font-bold">Belum ada jurnal bulan ini.</p>
             <p className="text-xs text-slate-400 mt-1">Mulai mengajar lewat menu Absensi.</p>
           </div>
        ) : (
           <div className="space-y-8 relative">
              {/* Garis Vertikal Timeline */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200 z-0"></div>

              {Object.keys(groupedJournals).map(date => (
                 <div key={date} className="relative z-10">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-full bg-teal-100 border-4 border-white shadow-sm flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                          {new Date(date).getDate()}
                       </div>
                       <span className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                          {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', month: 'long', year: 'numeric' })}
                       </span>
                    </div>

                    {/* Cards Container */}
                    <div className="pl-12 space-y-3">
                       {groupedJournals[date].map(journal => (
                          <div 
                            key={journal.id} 
                            onClick={() => openDetail(journal)}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden"
                          >
                             {/* Dekorasi Warna Kiri berdasarkan Mapel */}
                             <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${journal.topicSubject === 'Umum' ? 'bg-slate-400' : 'bg-indigo-500'}`}></div>

                             <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                                   {journal.className}
                                </span>
                                {journal.hasAssessment && (
                                   <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                                      <FileText size={10}/> Ujian/Tugas
                                   </span>
                                )}
                             </div>

                             <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">
                                {journal.topicName}
                             </h3>

                             {/* Baris Status: Absensi & Refleksi */}
                             <div className="flex items-center gap-3 mt-3">
                                {/* Status Absen */}
                                {journal.absentCount > 0 ? (
                                   <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                      <AlertCircle size={14}/> {journal.absentCount} Tidak Hadir
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                                      <CheckCircle2 size={14}/> Nihil (100%)
                                   </div>
                                )}
                                
                                {/* Indikator Refleksi */}
                                {journal.reflection && (
                                   <div className="flex items-center gap-1 text-xs text-slate-400">
                                      <Edit3 size={12}/> <span className="italic truncate max-w-[100px]">Catatan ada...</span>
                                   </div>
                                )}
                             </div>

                             {/* Tags Preview */}
                             {journal.tags && journal.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-50">
                                   {journal.tags.map(tag => (
                                      <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                         {tag}
                                      </span>
                                   ))}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {/* --- MODAL DETAIL & REFLEKSI --- */}
      {activeJournal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in">
           <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                 <div>
                    <h2 className="text-xl font-bold text-slate-800">{activeJournal.className}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                       <Clock size={14}/> {new Date(activeJournal.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                    </p>
                 </div>
                 <button onClick={() => setActiveJournal(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                    ✕
                 </button>
              </div>

              {/* Info Materi */}
              <div className="mb-6">
                 <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Materi Ajar</label>
                 <p className="font-bold text-slate-800 text-lg leading-snug">{activeJournal.topicName}</p>
                 {activeJournal.topicSubject !== 'Umum' && (
                    <span className="text-xs text-indigo-500 font-medium">{activeJournal.topicSubject}</span>
                 )}
              </div>

              {/* Form Refleksi */}
              <div className="space-y-4 mb-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                       <Edit3 size={12}/> Refleksi Pembelajaran
                    </label>
                    <textarea 
                       rows="4"
                       placeholder="Bagaimana kelas hari ini? Apa yang berjalan baik? Apa kendalanya?"
                       className="w-full p-3 bg-yellow-50/50 border border-yellow-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-yellow-200 outline-none resize-none"
                       value={reflectionText}
                       onChange={(e) => setReflectionText(e.target.value)}
                    ></textarea>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                       <Tag size={12}/> Tags / Label (Pisahkan koma)
                    </label>
                    <input 
                       type="text"
                       placeholder="Contoh: #seru, #remedial, #tugas"
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-teal-200 outline-none"
                       value={tagsInput}
                       onChange={(e) => setTagsInput(e.target.value)}
                    />
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                 <button 
                    onClick={handleSaveReflection}
                    className="col-span-2 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 active:scale-95 transition-all"
                 >
                    Simpan Catatan
                 </button>
                 
                 {/* Tombol Edit Data (Ke AbsensiPage) */}
                 <button 
                    onClick={() => {
                        // Sesuai Pilihan B: Navigasi ke Absensi
                        navigate('/absensi'); 
                    }}
                    className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 text-xs flex items-center justify-center gap-2"
                 >
                    <Edit3 size={14}/> Edit Data Absen
                 </button>

                 <button 
                    onClick={() => handleDelete(activeJournal)}
                    className="py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 text-xs flex items-center justify-center gap-2"
                 >
                    <Trash2 size={14}/> Hapus Jurnal
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default JurnalPage;