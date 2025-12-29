// src/pages/NilaiPage.jsx
import React, { useState, useEffect, useMemo } from 'react'; 
import { ChevronLeft, Plus, Calendar, Filter, Save, Search, Trash2, Download } from 'lucide-react'; // Tambah Icon Download
import { db } from '../db';
import { syllabusService } from '../services/syllabusService';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { downloadGradesExcel } from '../utils/excelGenerator'; // Import Generator

const NilaiPage = () => {
  const [view, setView] = useState('list'); 
  
  // Data Utama
  const [allAssessments, setAllAssessments] = useState([]); 
  const [classes, setClasses] = useState([]);
  const [syllabusList, setSyllabusList] = useState([]); 
  const [allTemplates, setAllTemplates] = useState([]); 

  // Filters
  const [filterClassId, setFilterClassId] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');
  
  // Form State
  const [selectedTopicId, setSelectedTopicId] = useState(''); 
  const [formData, setFormData] = useState({
    templateId: '', name: '', subject: '', type: 'UH', classId: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false });

  // --- LOAD DATA ---
  const loadAssessmentList = async () => {
    try {
      const cls = await db.classes.toArray();
      const meta = await db.assessments_meta
        .where('classId').notEqual('TEMPLATE')
        .reverse()
        .toArray();
      
      const joined = meta.map(m => ({
        ...m,
        className: cls.find(c => c.id === m.classId)?.name || '?',
      }));
      setAllAssessments(joined);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const initData = async () => {
        const cls = await db.classes.toArray();
        setClasses(cls);
        if (cls.length > 0) {
            setFormData(prev => ({ ...prev, classId: cls[0].id }));
            setFilterClassId(cls[0].id); 
        }

        const settings = await db.settings.toArray();
        const mySubjects = settings.find(s => s.key === 'mySubjects')?.value || ['Matematika'];
        const currentSubject = mySubjects[0]; 
        setFormData(prev => ({ ...prev, subject: currentSubject }));

        const topics = await db.syllabus
            .where('subject').equals(currentSubject)
            .sortBy('meetingOrder');
        setSyllabusList(topics);

        const tpls = await db.assessments_meta.where('classId').equals('TEMPLATE').toArray();
        setAllTemplates(tpls);

        await loadAssessmentList();
    };
    initData();
  }, [view]);

  // --- FILTERS ---
  const filteredAssessments = useMemo(() => {
    return allAssessments.filter(item => {
      const matchClass = filterClassId ? item.classId === parseInt(filterClassId) : true;
      const matchTopic = filterTopicId ? item.syllabusId === parseInt(filterTopicId) : true;
      return matchClass && matchTopic;
    });
  }, [allAssessments, filterClassId, filterTopicId]);

  const filteredTemplates = useMemo(() => {
    return selectedTopicId
      ? allTemplates.filter(t => t.syllabusId === parseInt(selectedTopicId))
      : [];
  }, [allTemplates, selectedTopicId]);

  const getEmptyMessage = () => {
    if (allAssessments.length === 0) return "Belum ada data nilai sama sekali.";
    const clsName = classes.find(c => c.id === parseInt(filterClassId))?.name || 'Semua Kelas';
    return `Tidak ada latihan di kelas ${clsName}`;
  };

  // --- HANDLERS ---
  const handleTemplateChange = (e) => {
    const tplId = parseInt(e.target.value);
    const selected = allTemplates.find(t => t.id === tplId);
    if (selected) {
      setFormData(prev => ({ ...prev, templateId: tplId, name: selected.name, type: selected.type }));
    } else {
      setFormData(prev => ({ ...prev, templateId: '', name: '' }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.assessments_meta.add({
        name: formData.name, subject: formData.subject, type: formData.type,
        classId: parseInt(formData.classId), date: formData.date,
        syllabusId: formData.templateId ? allTemplates.find(t => t.id === parseInt(formData.templateId))?.syllabusId : parseInt(selectedTopicId)
      });
      toast.success("Kantong Nilai Dibuat!");
      setView('list');
      loadAssessmentList(); // Refresh list
    } catch (err) { toast.error("Gagal buat: " + err.message); }
  };

  const handleDeleteAssessment = (e, item) => {
      e.stopPropagation();
      setConfirmModal({
          isOpen: true,
          title: "Hapus Nilai?",
          message: `Nilai "${item.name}" untuk kelas ${item.className} akan dihapus beserta seluruh skor siswa.`,
          isDanger: true,
          onConfirm: async () => {
              await syllabusService.deleteAssessmentAndGrades(item.id);
              toast.success("Data nilai dihapus");
              loadAssessmentList();
          }
      });
  };

  // --- FITUR BARU: EXPORT NILAI ---
  const handleExport = async () => {
      if (!filterClassId) {
          toast.error("Pilih 'Kelas' pada filter di atas terlebih dahulu!");
          return;
      }

      const toastId = toast.loading("Mengunduh Excel...");
      try {
          const selectedClass = classes.find(c => c.id === parseInt(filterClassId));
          const currentSubject = formData.subject || 'Matematika'; // Fallback
          
          await downloadGradesExcel(filterClassId, selectedClass?.name, currentSubject, db);
          
          toast.success("Excel Nilai berhasil diunduh!", { id: toastId });
      } catch (error) {
          console.error(error);
          toast.error("Gagal export: " + error.message, { id: toastId });
      }
  };

  const openInputPage = async (assessment) => {
    setLoading(true); setActiveAssessment(assessment); setView('input');
    try {
      const targetClassId = parseInt(assessment.classId);
      const students = await db.students.where('classId').equals(targetClassId).sortBy('name');
      const existingGrades = await db.grades.where({ assessmentMetaId: assessment.id }).toArray();
      setStudentGrades(students.map(s => {
        const g = existingGrades.find(gr => gr.studentId === s.id);
        return { studentId: s.id, name: s.name, nis: s.nis, score: g ? g.score : '' };
      }));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSaveGrades = async () => {
    setConfirmModal({
        isOpen: true, title: "Simpan Nilai?", message: "Pastikan input nilai sudah benar.", isDanger: false,
        onConfirm: async () => {
             await db.transaction('rw', db.grades, async () => {
                await db.grades.where({ assessmentMetaId: activeAssessment.id }).delete();
                const records = studentGrades.filter(s => s.score !== '').map(s => ({
                    studentId: s.studentId, assessmentMetaId: activeAssessment.id, score: parseInt(s.score), date: new Date().toISOString()
                }));
                await db.grades.bulkAdd(records);
            });
            toast.success("Nilai Tersimpan!"); setView('list');
        }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <ConfirmModal 
        isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen: false})}
        title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} isDanger={confirmModal.isDanger}
      />

      {/* HEADER */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm sticky top-0 z-20 mb-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => { if(view === 'input') setView('list'); else window.history.back(); }} className="p-2 bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={24}/></button>
                <div><h1 className="text-xl font-bold text-slate-800">{view === 'create' ? 'Buat Baru' : 'Buku Nilai'}</h1><p className="text-xs text-slate-500">Input nilai harian</p></div>
            </div>
            
            {view === 'list' && (
                <div className="flex gap-2">
                    {/* TOMBOL EXPORT BARU */}
                    <button 
                        onClick={handleExport} 
                        className="p-3 bg-green-100 text-green-700 rounded-2xl shadow-sm hover:bg-green-200 transition-colors"
                        title="Download Rekap Nilai"
                    >
                        <Download size={24} />
                    </button>
                    <button onClick={() => setView('create')} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-colors">
                        <Plus size={24} />
                    </button>
                </div>
            )}
        </div>

        {view === 'list' && (
            <div className="mt-6 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                <div className="relative">
                    <div className="absolute left-3 top-3 text-indigo-500"><Filter size={16} /></div>
                    <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)} className="w-full pl-9 p-2.5 bg-indigo-50 border-none rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-300 outline-none">
                        <option value="">Semua Kelas</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <div className="absolute left-3 top-3 text-teal-500"><Search size={16} /></div>
                    <select value={filterTopicId} onChange={(e) => setFilterTopicId(e.target.value)} className="w-full pl-9 p-2.5 bg-teal-50 border-none rounded-xl text-xs font-bold text-teal-900 focus:ring-2 focus:ring-teal-300 outline-none">
                        <option value="">Semua Topik</option>
                        {syllabusList.map(s => <option key={s.id} value={s.id}>{s.topic}</option>)}
                    </select>
                </div>
            </div>
        )}
      </div>

      <div className="p-6 pt-0">
        {view === 'list' && (
           <div className="space-y-4">
             {filteredAssessments.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                     <p className="text-slate-400 font-medium text-sm px-6 leading-relaxed">{getEmptyMessage()}</p>
                 </div>
             ) : (
                 filteredAssessments.map(item => (
                    <div key={item.id} onClick={() => openInputPage(item)} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group relative">
                       <div className="flex justify-between mb-2">
                           <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">{item.type}</span>
                           <button onClick={(e) => handleDeleteAssessment(e, item)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                               <Trash2 size={16}/>
                           </button>
                       </div>
                       <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                       <p className="text-sm text-slate-500 mt-1">{item.className} • {item.date}</p>
                    </div>
                 ))
             )}
           </div>
        )}

        {/* FORM CREATE & INPUT SAMA SEPERTI SEBELUMNYA */}
        {view === 'create' && (
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-lg mb-4">Buat Penilaian Baru</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tanggal Penilaian</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={18}/>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-10 p-3 bg-slate-50 border rounded-xl font-semibold text-slate-700" />
                </div>
              </div>
              <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pilih Topik / Bab</label>
                  <div className="relative">
                     <Filter className="absolute left-3 top-3 text-slate-400" size={18}/>
                     <select value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)} className="w-full pl-10 p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-900 focus:outline-indigo-500">
                         <option value="">-- Pilih Bab Materi --</option>
                         {syllabusList.map(s => <option key={s.id} value={s.id}>Bab {s.meetingOrder}: {s.topic}</option>)}
                     </select>
                  </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pilih Latihan</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 disabled:opacity-50" onChange={handleTemplateChange} value={formData.templateId} disabled={!selectedTopicId}>
                  <option value="">-- Pilih Rencana Latihan --</option>
                  {filteredTemplates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                  <option value="" disabled>---</option>
                  <option value="">Input Manual (Judul Baru)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Judul Penilaian</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-semibold" placeholder="Contoh: UH 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kelas</label>
                    <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipe</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl">
                        <option value="UH">UH</option><option value="Tugas">Tugas</option><option value="UTS">UTS</option>
                    </select>
                  </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setView('list')} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </div>
        )}

        {view === 'input' && !loading && (
             <div className="space-y-4 animate-in slide-in-from-bottom-4">
                <div className="bg-indigo-50 p-4 rounded-xl mb-4 border border-indigo-100">
                    <h3 className="font-bold text-indigo-900">{activeAssessment?.name}</h3>
                    <p className="text-xs text-indigo-500">{activeAssessment?.className}</p>
                </div>
                {studentGrades.map(student => (
                    <div key={student.studentId} className="flex justify-between bg-white p-4 rounded-xl border border-slate-100 items-center">
                        <span className="font-bold text-slate-700 w-2/3">{student.name}</span>
                        <input type="number" value={student.score} onChange={e => {
                             const val = e.target.value; if(val>100) return;
                             setStudentGrades(prev => prev.map(s => s.studentId === student.studentId ? {...s, score: val} : s))
                        }} className={`w-20 p-2 text-center rounded-lg font-bold border ${student.score ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}/>
                    </div>
                ))}
                <div className="fixed bottom-24 left-6 right-6 max-w-md mx-auto"><button onClick={handleSaveGrades} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl flex justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"><Save/> Simpan</button></div>
             </div>
        )}
      </div>
    </div>
  );
};

export default NilaiPage;