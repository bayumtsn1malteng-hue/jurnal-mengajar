// src/pages/RencanaAjar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Plus, Trash2, Filter, Tag, ExternalLink, X, Edit3, Info, CheckCircle2, Save, RotateCcw } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { syllabusService } from '../services/syllabusService';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const toRoman = (num) => {
  if (num === 7) return 'VII'; if (num === 8) return 'VIII'; if (num === 9) return 'IX'; return num;
};

const RencanaAjar = () => {
  const navigate = useNavigate();
  
  // STATE UTAMA
  const [selectedLevel, setSelectedLevel] = useState(7);
  const [activeSubject, setActiveSubject] = useState('Matematika');
  const [userSubjects, setUserSubjects] = useState(['Matematika']);
  const [syllabusList, setSyllabusList] = useState([]);
  
  // MODAL STATES
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [inspectItem, setInspectItem] = useState(null); 
  
  // FORM DATA STATES
  const [materiForm, setMateriForm] = useState({ id: null, topic: '', meetingOrder: 1, objective: '', link: '' });
  const [templateList, setTemplateList] = useState([]); 
  
  // MODAL CONFIRM
  const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false });

  // --- 1. LOAD DATA ---
  const loadSyllabus = useCallback(async () => {
    try {
        const data = await syllabusService.getSyllabusWithCounts(selectedLevel, activeSubject);
        setSyllabusList(data);
    } catch (err) { console.error(err); }
  }, [selectedLevel, activeSubject]); 

  useEffect(() => {
    const init = async () => {
        const settings = await syllabusService.getSettings();
        const subs = settings.find(s => s.key === 'mySubjects')?.value || ["Matematika"];
        setUserSubjects(subs);
        if(subs.length > 0) setActiveSubject(subs[0]);
    };
    init();
  }, []);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]); 

  // Load Latihan saat Inspeksi Materi dibuka
  useEffect(() => {
    const loadTemplates = async () => {
        if (inspectItem) {
            const tpls = await syllabusService.getTemplatesBySyllabusId(inspectItem.id);
            setTemplateList(tpls);
        }
    };
    loadTemplates();
  }, [inspectItem]);


  // --- 2. ACTIONS: MATERI ---

  const openMateriForm = (item = null) => {
      if (item) {
          setMateriForm({ id: item.id, topic: item.topic, meetingOrder: item.meetingOrder, objective: item.objective, link: item.link });
      } else {
          const maxOrder = syllabusList.length > 0 ? Math.max(...syllabusList.map(s => s.meetingOrder)) : 0;
          setMateriForm({ id: null, topic: '', meetingOrder: maxOrder + 1, objective: '', link: '' });
      }
      setIsFormOpen(true);
  };

  const handleSaveMateri = async (e) => {
      e.preventDefault();
      const payload = {
          level: parseInt(selectedLevel),
          subject: activeSubject,
          topic: materiForm.topic,
          meetingOrder: parseInt(materiForm.meetingOrder),
          objective: materiForm.objective,
          link: materiForm.link
      };

      try {
          if (materiForm.id) {
              await syllabusService.updateSyllabus(materiForm.id, payload);
              toast.success("Materi diperbarui!");
              if(inspectItem && inspectItem.id === materiForm.id) {
                  setInspectItem({ ...inspectItem, ...payload });
              }
          } else {
              await syllabusService.addSyllabus(payload);
              toast.success("Bab baru ditambahkan!");
          }
          setIsFormOpen(false);
          loadSyllabus();
      } catch (error) { toast.error("Gagal simpan: " + error.message); }
  };

  const handleDeleteMateri = (id) => {
      setConfirm({
          isOpen: true, title: "Hapus Bab Materi?", message: "Semua latihan di bab ini juga akan terhapus.", isDanger: true,
          onConfirm: async () => {
              await syllabusService.deleteSyllabus(id);
              toast.success("Materi dihapus");
              loadSyllabus();
              setInspectItem(null); 
          }
      });
  };

  // --- 3. KOMPONEN ITEM LATIHAN (VIEW & EDIT MODE) ---
  const TemplateItem = ({ tpl, onDelete, onUpdate }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [editData, setEditData] = useState({ ...tpl });

      const handleSave = async () => {
          if(!editData.name) return toast.error("Nama latihan wajib diisi");
          await onUpdate(tpl.id, editData);
          setIsEditing(false);
      };

      if (isEditing) {
          return (
              <div className="bg-white p-4 rounded-xl border border-indigo-300 shadow-md animate-in fade-in ring-4 ring-indigo-50/50 space-y-3">
                  {/* BARIS 1: NAMA & TIPE */}
                  <div className="flex gap-2">
                      <input autoFocus placeholder="Nama Latihan" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none" value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} />
                      <select className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={editData.type} onChange={e=>setEditData({...editData, type: e.target.value})}><option value="UH">UH</option><option value="Tugas">Tugas</option><option value="Praktek">Praktek</option></select>
                  </div>

                  {/* BARIS 2: DESKRIPSI */}
                  <input placeholder="Deskripsi / Target" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={editData.description} onChange={e=>setEditData({...editData, description: e.target.value})} />
                  
                  {/* BARIS 3: LINK */}
                  <input placeholder="Link Soal" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-blue-600 outline-none" value={editData.link} onChange={e=>setEditData({...editData, link: e.target.value})} />
                  
                  {/* BARIS 4: TOMBOL AKSI (DI BAWAH) */}
                  <div className="flex gap-2 justify-end pt-1 border-t border-slate-100 mt-1">
                      <button onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1 transition-colors">
                        <RotateCcw size={14}/> Batal
                      </button>
                      <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1 shadow-sm transition-colors">
                        <Save size={14}/> Simpan Perubahan
                      </button>
                  </div>
              </div>
          );
      }

      return (
          <div onClick={() => setIsEditing(true)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all active:scale-[0.99]">
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tpl.type==='UH'?'bg-rose-100 text-rose-600':tpl.type==='Tugas'?'bg-amber-100 text-amber-600':'bg-purple-100 text-purple-600'}`}>{tpl.type}</span>
                      <h4 className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">{tpl.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{tpl.description || 'Tanpa deskripsi'}</p>
                  {tpl.link && <span className="text-[10px] text-blue-500 flex items-center gap-1 mt-1 truncate max-w-[200px]"><ExternalLink size={10}/> {tpl.link}</span>}
              </div>
              <div className="flex gap-2 items-center">
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                       <Edit3 size={16}/>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); onDelete(tpl.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16}/>
                   </button>
              </div>
          </div>
      );
  };

  // --- 4. KOMPONEN INPUT LATIHAN BARU ---
  const TemplateInputRow = ({ syllabusId, onSaved }) => {
      const [data, setData] = useState({ name: '', type: 'UH', desc: '', link: '' });
      const handleSave = async () => {
          if(!data.name) return toast.error("Nama latihan wajib diisi");
          await syllabusService.addTemplate({ ...data, description: data.desc, subject: activeSubject, syllabusId });
          toast.success("Latihan ditambahkan");
          setData({ name: '', type: 'UH', desc: '', link: '' });
          onSaved();
      };

      return (
          <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in">
              <div className="flex gap-2 mb-2">
                  <input placeholder="Nama: Latihan 1..." className="flex-1 p-2 bg-slate-50 border rounded-lg text-sm font-bold" value={data.name} onChange={e=>setData({...data, name: e.target.value})} />
                  <select className="p-2 bg-slate-50 border rounded-lg text-sm" value={data.type} onChange={e=>setData({...data, type: e.target.value})}><option value="UH">UH</option><option value="Tugas">Tugas</option><option value="Praktek">Praktek</option></select>
              </div>
              <input placeholder="Deskripsi / Target..." className="w-full p-2 bg-slate-50 border rounded-lg text-sm mb-2" value={data.desc} onChange={e=>setData({...data, desc: e.target.value})} />
              <div className="flex gap-2">
                  <input placeholder="Link Soal (GForm/Quizizz)..." className="flex-1 p-2 bg-slate-50 border rounded-lg text-sm text-blue-600" value={data.link} onChange={e=>setData({...data, link: e.target.value})} />
                  <button onClick={handleSave} className="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-1"><Plus size={16}/> Tambah</button>
              </div>
          </div>
      );
  };

  const handleDeleteTemplate = (id) => {
    setConfirm({
        isOpen: true, title: "Hapus Latihan?", message: "Data ini akan dihapus permanen.", isDanger: true,
        onConfirm: async () => {
            await syllabusService.deleteTemplate(id);
            toast.success("Latihan dihapus");
            const tpls = await syllabusService.getTemplatesBySyllabusId(inspectItem.id);
            setTemplateList(tpls);
            loadSyllabus(); 
        }
    });
  };

  const handleUpdateTemplate = async (id, updatedData) => {
      await syllabusService.updateTemplate(id, updatedData);
      toast.success("Latihan diupdate!");
      const tpls = await syllabusService.getTemplatesBySyllabusId(inspectItem.id);
      setTemplateList(tpls);
      loadSyllabus();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 relative">
      <ConfirmModal 
        isOpen={confirm.isOpen} onClose={() => setConfirm({...confirm, isOpen: false})}
        title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} isDanger={confirm.isDanger}
      />

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-slate-600"><ChevronLeft size={20} /></button>
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Bank Materi</h1>
            <p className="text-slate-500 text-sm">Kurikulum & Bank Soal</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <div className="absolute left-3 top-3 text-slate-400"><Filter size={18} /></div>
          <select value={activeSubject} onChange={(e) => setActiveSubject(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 pl-10 pr-4 rounded-2xl appearance-none shadow-sm outline-none">
            {userSubjects.map((mapel) => <option key={mapel} value={mapel}>{mapel}</option>)}
          </select>
        </div>
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex">
            {[7, 8, 9].map((lvl) => <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${selectedLevel === lvl ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Kelas {toRoman(lvl)}</button>)}
        </div>
      </div>

      {/* FAB ADD BUTTON */}
      <button onClick={() => openMateriForm()} className="w-full py-4 bg-white border-2 border-dashed border-teal-200 text-teal-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-300 transition-all mb-4">
          <Plus size={20} /> Tambah Bab Materi Baru
      </button>

      {/* TIPS BANNER */}
      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-3 mb-6">
          <Info className="text-indigo-500 shrink-0 mt-0.5" size={18} />
          <div>
              <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                  <span className="font-bold">Tips:</span> Klik kartu materi untuk mengelola detail & soal. Klik kartu soal di dalamnya untuk mengedit.
              </p>
          </div>
      </div>

      {/* LIST MATERI */}
      <div className="space-y-4">
        {syllabusList.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">Belum ada materi di jenjang ini.</div>
        )}
        {syllabusList.map((item) => (
          <div key={item.id} onClick={() => setInspectItem(item)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group relative active:scale-[0.99]">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl shadow-sm border border-teal-200 shrink-0">
                    {item.meetingOrder}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 truncate">{item.topic}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-slate-200">
                            {item.subject}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${item.exerciseCount > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            {item.exerciseCount > 0 ? (
                                <><CheckCircle2 size={10}/> {item.exerciseCount} Latihan</>
                            ) : (
                                "Belum ada latihan"
                            )}
                        </span>
                    </div>
                </div>
             </div>
             
             <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 bg-white/80 p-2 rounded-full backdrop-blur-sm">
                 <Edit3 size={20}/>
             </div>
          </div>
        ))}
      </div>


      {/* --- MODAL FORM INPUT MATERI (Z-INDEX 70) --- */}
      {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-4 sm:p-6 animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-slate-800">{materiForm.id ? 'Edit Materi' : 'Materi Baru'}</h2>
                      <button onClick={() => setIsFormOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
                  </div>
                  
                  <form onSubmit={handleSaveMateri} className="space-y-4">
                      <div className="flex gap-4">
                          <div className="w-24">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Urutan</label>
                              <input type="number" required value={materiForm.meetingOrder} onChange={e=>setMateriForm({...materiForm, meetingOrder: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-center text-lg" />
                          </div>
                          <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Bab</label>
                              <input type="text" required autoFocus placeholder="Judul Bab..." value={materiForm.topic} onChange={e=>setMateriForm({...materiForm, topic: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-lg" />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Poin Pembelajaran</label>
                          <textarea rows="4" placeholder="Siswa dapat..." value={materiForm.objective} onChange={e=>setMateriForm({...materiForm, objective: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Link Materi</label>
                          <input type="text" placeholder="https://..." value={materiForm.link} onChange={e=>setMateriForm({...materiForm, link: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm text-blue-600" />
                      </div>
                      <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-200 mt-2">
                          Simpan Materi
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* --- MODAL INSPEKSI (Z-INDEX 60) --- */}
      {inspectItem && (
          <div className="fixed inset-0 bg-white z-[60] overflow-y-auto animate-in slide-in-from-bottom-10">
              <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                  <button onClick={() => setInspectItem(null)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"><ChevronLeft size={24}/></button>
                  <span className="font-bold text-slate-800">Detail Materi</span>
                  <button onClick={() => openMateriForm(inspectItem)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 font-bold text-xs flex items-center gap-1">
                      <Edit3 size={16}/> Edit
                  </button>
              </div>

              <div className="max-w-2xl mx-auto p-6 pb-24">
                  {/* BAGIAN ATAS: DETAIL MATERI */}
                  <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wide">Bab {inspectItem.meetingOrder}</span>
                          {inspectItem.link && (
                              <a href={inspectItem.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full">
                                  <ExternalLink size={12}/> Materi
                              </a>
                          )}
                      </div>
                      <h1 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">{inspectItem.topic}</h1>
                      
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Kompetensi / Tujuan</h3>
                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {inspectItem.objective || "Belum ada deskripsi."}
                          </p>
                      </div>

                      <button onClick={() => handleDeleteMateri(inspectItem.id)} className="mt-4 text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={14}/> Hapus Bab Ini
                      </button>
                  </div>

                  {/* BAGIAN BAWAH: BANK LATIHAN */}
                  <div className="bg-slate-50 -mx-6 px-6 py-8 border-t border-slate-200 min-h-[50vh]">
                      <div className="max-w-2xl mx-auto">
                          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Tag size={20} className="text-indigo-500"/> Bank Latihan / Soal
                          </h2>
                          
                          {/* FORM TAMBAH LATIHAN */}
                          <div className="mb-6">
                             <TemplateInputRow syllabusId={inspectItem.id} onSaved={async () => {
                                 const tpls = await syllabusService.getTemplatesBySyllabusId(inspectItem.id);
                                 setTemplateList(tpls);
                                 loadSyllabus(); 
                             }}/>
                          </div>

                          {/* LIST LATIHAN (TEMPLATE ITEMS) */}
                          <div className="space-y-3">
                              {templateList.length === 0 && (
                                  <p className="text-center text-slate-400 text-sm py-4">Belum ada latihan untuk bab ini.</p>
                              )}
                              {templateList.map(tpl => (
                                  <TemplateItem 
                                      key={tpl.id} 
                                      tpl={tpl} 
                                      onDelete={handleDeleteTemplate} 
                                      onUpdate={handleUpdateTemplate}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RencanaAjar;