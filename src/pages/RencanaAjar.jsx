// src/pages/RencanaAjar.jsx
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ChevronLeft, Plus, Trash2, Filter, Tag, ExternalLink, X, Info } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const toRoman = (num) => {
  if (num === 7) return 'VII'; if (num === 8) return 'VIII'; if (num === 9) return 'IX'; return num;
};

const RencanaAjar = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(7);
  const [manualSubject, setManualSubject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailItem, setDetailItem] = useState(null); // State untuk Modal Detail Mengambang
  
  // FORM STATES
  const [formData, setFormData] = useState({ 
      topic: '', meetingOrder: 1, objective: '', link: '' 
  });
  
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [newAssessment, setNewAssessment] = useState({ 
      name: '', type: 'UH', desc: '', link: '' 
  });

  // DB QUERIES (Sama)
  const settings = useLiveQuery(() => db.settings.toArray());
  const templates = useLiveQuery(() => db.assessments_meta.where('classId').equals('TEMPLATE').toArray()) || [];
  
  const userSubjects = useMemo(() => {
    if (!settings) return ["Matematika"];
    return settings.find(s => s.key === 'mySubjects')?.value || ["Matematika"];
  }, [settings]);

  const activeSubject = useMemo(() => {
    if (manualSubject && userSubjects.includes(manualSubject)) return manualSubject;
    return userSubjects.length > 0 ? userSubjects[0] : "Matematika";
  }, [manualSubject, userSubjects]);

  const syllabus = useLiveQuery(async () => {
    if (!activeSubject) return [];
    return await db.syllabus.where('level').equals(parseInt(selectedLevel))
      .filter(item => item.subject === activeSubject).sortBy('meetingOrder');
  }, [selectedLevel, activeSubject]);

  // --- ACTIONS ---

  const handleSaveSyllabus = async (e) => {
    e.preventDefault();
    if (!formData.topic) return;
    try {
      await db.syllabus.add({
        level: parseInt(selectedLevel), subject: activeSubject,
        topic: formData.topic, objective: formData.objective, // Poin Pembelajaran
        link: formData.link, // Link Materi
        meetingOrder: parseInt(formData.meetingOrder)
      });
      setFormData({ topic: '', objective: '', link: '', meetingOrder: parseInt(formData.meetingOrder) + 1 });
      alert(`Materi tersimpan!`);
    } catch (error) { alert("Gagal: " + error); }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newAssessment.name || !activeTopicId) return;
    try {
        await db.assessments_meta.add({
            name: newAssessment.name, type: newAssessment.type, subject: activeSubject,
            description: newAssessment.desc, // Target Latihan
            link: newAssessment.link, // Link Latihan
            classId: 'TEMPLATE', syllabusId: activeTopicId, date: new Date().toISOString()
        });
        setNewAssessment({ name: '', type: 'UH', desc: '', link: '' });
        setActiveTopicId(null);
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id, table) => {
    if(confirm("Hapus item ini?")) {
        if(table === 'syllabus') await db.syllabus.delete(id);
        if(table === 'template') await db.assessments_meta.delete(id);
        if(detailItem?.id === id) setDetailItem(null); // Tutup modal jika item dihapus
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 relative">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-slate-600"><ChevronLeft size={20} /></button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-slate-800">Bank Materi</h1><p className="text-slate-500 text-sm">Kelola kurikulum</p></div>
      </div>

      {/* Filter Mapel */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <div className="absolute left-3 top-3 text-slate-400"><Filter size={18} /></div>
          <select value={activeSubject} onChange={(e) => setManualSubject(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 pl-10 pr-4 rounded-2xl appearance-none shadow-sm">
            {userSubjects.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
          </select>
        </div>
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex">
            {[7, 8, 9].map((lvl) => <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${selectedLevel === lvl ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Kelas {toRoman(lvl)}</button>)}
        </div>
      </div>

      {/* Form Tambah Bab */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 transition-all">
        <div onClick={() => setShowForm(!showForm)} className="p-4 flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100">
          <span className="font-bold text-teal-700 flex items-center gap-2"><Plus size={18} /> Tambah Bab {activeSubject}</span>
          <span className="text-xs text-slate-400">{showForm ? 'Tutup' : 'Buka Form'}</span>
        </div>
        {showForm && (
          <form onSubmit={handleSaveSyllabus} className="p-4 space-y-4 border-t border-slate-100">
            <div className="flex gap-4">
              <div className="w-20"><label className="text-[10px] font-bold text-slate-400 uppercase">Urutan</label><input type="number" value={formData.meetingOrder} onChange={(e) => setFormData({...formData, meetingOrder: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-center border border-slate-200" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Judul Bab</label><input type="text" autoFocus placeholder="Cth: Bab 1 At-Ta'aruf" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200" /></div>
            </div>
            {/* INPUT DESKRIPSI & LINK BARU */}
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Poin-Poin Pembelajaran</label><textarea rows="3" placeholder="- Siswa dapat menghafal..." value={formData.objective} onChange={(e) => setFormData({...formData, objective: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200" /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Link Materi (Drive/Youtube)</label><input type="text" placeholder="https://..." value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 text-blue-600" /></div>
            
            <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">Simpan Materi</button>
          </form>
        )}
      </div>

      {/* List Materi */}
      <div className="space-y-4">
        {syllabus?.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group hover:border-teal-200 transition-all">
             {/* Header Bab (Klik untuk Detail) */}
             <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => setDetailItem(item)}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">{item.meetingOrder}</div>
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">{item.topic} <Info size={14} className="text-slate-300"/></h3>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{item.subject}</p>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'syllabus'); }} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
             </div>

             {/* List Template Penilaian */}
             <div className="pl-11 space-y-2">
                {templates.filter(t => t.syllabusId === item.id).map(tpl => (
                    <div key={tpl.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-sm cursor-pointer hover:bg-slate-100" onClick={() => setDetailItem({...tpl, isTemplate: true})}>
                        <div className="flex items-center gap-2 text-slate-600">
                            <Tag size={14} className="text-indigo-400"/>
                            <span>{tpl.name} <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded ml-1">{tpl.type}</span></span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id, 'template'); }} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                ))}

                {/* Form Tambah Template */}
                {activeTopicId === item.id ? (
                    <form onSubmit={handleSaveTemplate} className="bg-indigo-50 p-3 rounded-lg animate-in fade-in space-y-2">
                        <div className="flex gap-2">
                           <input autoFocus placeholder="Nama Latihan..." className="flex-1 p-2 text-sm border rounded-lg" value={newAssessment.name} onChange={e => setNewAssessment({...newAssessment, name: e.target.value})} />
                           <select className="p-2 text-sm border rounded-lg" value={newAssessment.type} onChange={e => setNewAssessment({...newAssessment, type: e.target.value})}><option value="UH">UH</option><option value="Tugas">Tugas</option><option value="Praktek">Praktek</option></select>
                        </div>
                        {/* INPUT DESKRIPSI & LINK LATIHAN BARU */}
                        <input placeholder="Target Latihan (Opsional)..." className="w-full p-2 text-sm border rounded-lg" value={newAssessment.desc} onChange={e => setNewAssessment({...newAssessment, desc: e.target.value})} />
                        <input placeholder="Link Soal/Gform..." className="w-full p-2 text-sm border rounded-lg" value={newAssessment.link} onChange={e => setNewAssessment({...newAssessment, link: e.target.value})} />
                        
                        <div className="flex gap-2">
                            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-bold flex-1">Simpan</button>
                            <button type="button" onClick={() => setActiveTopicId(null)} className="text-slate-500 text-xs p-2">Batal</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setActiveTopicId(item.id)} className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:underline"><Plus size={14}/> Tambah Rencana Nilai</button>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DETAIL MENGAMBANG (ZOOM) --- */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 relative">
              <button onClick={() => setDetailItem(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
              
              <div className="mb-4">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${detailItem.isTemplate ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                    {detailItem.isTemplate ? `Latihan: ${detailItem.type}` : `Materi Bab ${detailItem.meetingOrder}`}
                 </span>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{detailItem.topic || detailItem.name}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase mb-4">{detailItem.subject}</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 max-h-60 overflow-y-auto">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-2">Deskripsi / Poin</p>
                 <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {detailItem.objective || detailItem.description || "- Tidak ada deskripsi -"}
                 </p>
              </div>

              {(detailItem.link) && (
                 <a href={detailItem.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                    <ExternalLink size={20}/> Buka Tautan Materi/Soal
                 </a>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default RencanaAjar;