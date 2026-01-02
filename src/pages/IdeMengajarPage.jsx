// src/pages/IdeMengajarPage.jsx
import React, { useState, useRef } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'react-hot-toast';
import { 
  Maximize, Minimize, Save, FileText, ListTodo, LayoutTemplate, 
  Plus, Trash2, Search, ArrowLeft, Calendar, Tag, FilePlus,
  Link as LinkIcon, BookOpen, X, ExternalLink
} from 'lucide-react';

const IdeMengajarPage = () => {
  // --- STATE VIEW ---
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- STATE EDITOR ---
  const [currentId, setCurrentId] = useState(null); 
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [linkedJournalId, setLinkedJournalId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // REF
  const textareaRef = useRef(null);

  // --- HELPER: FORMAT TANGGAL ---
  const formatDateIndo = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { 
      // HAPUS (e) DI SINI AGAR TIDAK ERROR ESLINT
      return dateString;
    }
  };

  // --- FETCH DATA (READ) ---
  
  // 1. Ambil Semua Ide
  const ideas = useLiveQuery(
    () => db.ideas
            .orderBy('createdAt')
            .reverse()
            .filter(idea => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return idea.title.toLowerCase().includes(q) || 
                     (idea.tags && idea.tags.some(t => t.toLowerCase().includes(q)));
            })
            .toArray(),
    [searchQuery]
  );

  // 2. Ambil Daftar Jurnal (DROPDOWN)
  const journals = useLiveQuery(async () => {
    // Ambil 50 jurnal terakhir
    const rawJournals = await db.journals.orderBy('date').reverse().limit(50).toArray();
    
    // JOIN MANUAL
    const detailedJournals = await Promise.all(rawJournals.map(async (j) => {
      // Konversi ke Integer agar match dengan database
      const cId = j.classId ? parseInt(j.classId) : 0;
      const sId = j.syllabusId ? parseInt(j.syllabusId) : 0;

      const classData = cId ? await db.classes.get(cId) : null;
      const syllabusData = sId ? await db.syllabus.get(sId) : null;

      return {
        ...j,
        className: classData ? classData.name : 'Kelas ?',
        topicName: syllabusData ? syllabusData.topic : (j.customTopic || 'Topik ?'),
        subjectName: syllabusData ? syllabusData.subject : '-'
      };
    }));

    return detailedJournals;
  });

  // 3. Ambil Detail Jurnal Terpilih (MODAL)
  const selectedJournal = useLiveQuery(async () => {
    if (!linkedJournalId) return null;
    const id = parseInt(linkedJournalId);
    
    const j = await db.journals.get(id);
    if (!j) return null;

    // Konversi ke Integer di sini juga
    const cId = j.classId ? parseInt(j.classId) : 0;
    const sId = j.syllabusId ? parseInt(j.syllabusId) : 0;

    const classData = cId ? await db.classes.get(cId) : null;
    const syllabusData = sId ? await db.syllabus.get(sId) : null;

    return {
      ...j,
      className: classData ? classData.name : 'Kelas Tidak Ditemukan',
      topicName: syllabusData ? syllabusData.topic : (j.customTopic || 'Topik Tidak Ditemukan'),
      subjectName: syllabusData ? syllabusData.subject : ''
    };
  }, [linkedJournalId]);

  // --- TEMPLATE SNIPPETS ---
  const templates = {
    cornell: `
## Cues (Kata Kunci)
- 

## Notes (Catatan Utama)
- 

## Summary (Ringkasan)
- 
`,
    todo: `
### To-Do List
- [ ] 
- [ ] 
`,
    rpp: `
### Ide RPP Singkat
**Tujuan:** Siswa mampu...
**Aktivitas:**
1. Pendahuluan: ...
2. Inti: ...
3. Penutup: ...
`
  };

  // FUNGSI INSERT TEMPLATE
  const insertTemplate = (type) => {
    const templateText = templates[type];
    const textarea = textareaRef.current;

    if (!textarea) {
      setContent(prev => prev + '\n' + templateText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content;
    const newText = currentText.substring(0, start) + templateText + currentText.substring(end);

    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + templateText.length, start + templateText.length);
    }, 0);

    toast.success(`Snippet ${type} disisipkan`);
  };

  // --- HANDLERS ---
  const handleCreateNew = () => {
    setCurrentId(null);
    setTitle('');
    setContent('');
    setTags('');
    setLinkedJournalId('');
    setView('editor');
  };

  const handleEdit = (idea) => {
    setCurrentId(idea.id);
    setTitle(idea.title);
    setContent(idea.content);
    setTags(idea.tags ? idea.tags.join(', ') : '');
    setLinkedJournalId(idea.linkedJournalId || '');
    setView('editor');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      const dataPayload = {
        title,
        content,
        type: 'text',
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        linkedJournalId: linkedJournalId ? parseInt(linkedJournalId) : null,
        updatedAt: new Date(),
        isArchived: 0
      };

      if (currentId) {
        await db.ideas.update(currentId, dataPayload);
        toast.success('Perubahan disimpan');
      } else {
        await db.ideas.add({ 
          ...dataPayload, 
          createdAt: new Date() 
        });
        toast.success('Ide baru disimpan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentId) return;
    if (!window.confirm('Yakin ingin menghapus catatan ini selamanya?')) return;

    try {
      await db.ideas.delete(currentId);
      toast.success('Catatan dihapus');
      setView('list');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus');
    }
  };

  // --- MODAL COMPONENT ---
  const JournalDetailModal = () => {
    if (!showJournalModal || !selectedJournal) return null;

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
          
          {/* Header Modal */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <BookOpen size={20} />
              <h3 className="font-bold">Detail Jurnal Terkait</h3>
            </div>
            <button onClick={() => setShowJournalModal(false)} className="hover:bg-indigo-700 p-1 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Isi Modal */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
             <div className="flex justify-between mb-4 border-b border-slate-100 pb-2">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</span>
                    <p className="text-slate-700 font-medium">{formatDateIndo(selectedJournal.date)}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas</span>
                    <p className="text-lg font-bold text-indigo-600">{selectedJournal.className}</p>
                </div>
             </div>

             <div className="mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Materi / Topik</span>
                <p className="text-slate-800 font-semibold text-lg">{selectedJournal.topicName}</p>
                {selectedJournal.subjectName && (
                    <p className="text-sm text-slate-500 font-medium">{selectedJournal.subjectName}</p>
                )}
             </div>

             {/* Tampilkan Refleksi/Catatan Jurnal Asli jika ada */}
             {(selectedJournal.notes || selectedJournal.reflection) && (
                 <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Isi Jurnal / Refleksi</span>
                    <div className="bg-yellow-50 p-4 rounded-lg mt-1 text-sm text-slate-700 whitespace-pre-line border border-yellow-100">
                       {selectedJournal.reflection || selectedJournal.notes}
                    </div>
                 </div>
             )}
          </div>

          {/* Footer Modal */}
          <div className="p-4 bg-slate-50 text-right border-t border-slate-100">
             <button 
               onClick={() => setShowJournalModal(false)}
               className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium text-sm"
             >
               Tutup
             </button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER COMPONENT ---
  const renderListView = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ide & Catatan</h1>
          <p className="text-slate-500 text-sm">Draft RPP, Jurnal Refleksi, atau To-Do.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg shadow-indigo-200 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Cari catatan atau tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
            <FileText size={48} className="mb-2" />
            <p>Belum ada catatan. Buat baru yuk!</p>
          </div>
        )}

        {ideas?.map((idea) => (
          <div 
            key={idea.id} 
            onClick={() => handleEdit(idea)}
            className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 cursor-pointer transition-all relative overflow-hidden"
          >
            {idea.linkedJournalId && (
               <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-600 px-2 py-1 rounded-bl-lg text-[10px] font-bold flex items-center gap-1">
                 <LinkIcon size={10} /> Terkait Jurnal
               </div>
            )}

            <h3 className="font-bold text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors pr-16">
              {idea.title}
            </h3>
            <p className="text-slate-500 text-sm line-clamp-3 mb-3 whitespace-pre-line font-mono">
              {idea.content || '(Kosong)'}
            </p>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                 <Calendar size={12}/> {formatDateIndo(idea.createdAt)}
              </span>
              {idea.tags && idea.tags.length > 0 && (
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-slate-500">
                  <Tag size={10} /> {idea.tags[0]} {idea.tags.length > 1 ? `+${idea.tags.length - 1}` : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEditorView = () => (
    <div className={`flex flex-col h-full relative transition-all duration-300`}>
      
      <JournalDetailModal />

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setView('list')} 
             className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
           >
             <ArrowLeft size={22} />
           </button>
           
           <div className="flex gap-1 ml-2 border-l pl-3 border-slate-200">
             <button onClick={() => insertTemplate('cornell')} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50" title="Sisipkan Cornell"><LayoutTemplate size={18}/></button>
             <button onClick={() => insertTemplate('todo')} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50" title="Sisipkan To-Do"><ListTodo size={18}/></button>
             <button onClick={() => insertTemplate('rpp')} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50" title="Sisipkan Kerangka RPP"><FilePlus size={18}/></button>
           </div>
        </div>

        <div className="flex gap-2 items-center">
          {currentId && (
            <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Hapus">
              <Trash2 size={18} />
            </button>
          )}

          <button 
            onClick={() => setFocusMode(!focusMode)} 
            className={`p-2 rounded-full transition-colors ${focusMode ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Mode Fokus"
          >
            {focusMode ? <Minimize size={18}/> : <Maximize size={18}/>}
          </button>

          <button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md active:scale-95 transition-all"
          >
            <Save size={18} />
            <span className="hidden sm:inline">{currentId ? 'Update' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        
        {/* DROPDOWN PEMILIH JURNAL */}
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 flex-1 w-full">
                <LinkIcon size={16} className="text-slate-400 flex-shrink-0" />
                <select 
                    value={linkedJournalId} 
                    onChange={(e) => setLinkedJournalId(e.target.value)}
                    className="bg-transparent text-sm w-full outline-none text-slate-600 cursor-pointer"
                >
                    <option value="">-- Tautkan ke Jurnal (Opsional) --</option>
                    {journals?.map(j => (
                        <option key={j.id} value={j.id}>
                            {formatDateIndo(j.date)} — {j.className} — {j.topicName}
                        </option>
                    ))}
                </select>
            </div>

            {linkedJournalId && (
                <button 
                  onClick={() => setShowJournalModal(true)}
                  className="flex items-center gap-1 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-200 transition-colors w-full md:w-auto justify-center"
                >
                    <ExternalLink size={12} />
                    Lihat Jurnal
                </button>
            )}
        </div>

        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul Catatan..." 
          className="text-2xl font-bold text-slate-800 placeholder:text-slate-300 border-none outline-none bg-transparent w-full mt-2"
        />

        <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-2">
           <Tag size={16} className="text-slate-300" />
           <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (pisahkan koma)..." 
            className="text-sm text-slate-600 placeholder:text-slate-300 border-none outline-none bg-transparent w-full"
          />
        </div>

        <textarea 
          ref={textareaRef} 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mulai menulis..." 
          className="flex-1 w-full resize-none outline-none text-slate-700 leading-relaxed text-lg bg-transparent font-mono"
          spellCheck={false}
        />
      </div>
    </div>
  );

  return (
    <div className={`
      transition-all duration-300 bg-slate-50
      ${focusMode 
        ? 'fixed inset-0 z-[100] bg-white p-4 h-screen w-screen' 
        : 'h-[calc(100vh-80px)] p-4 relative' 
      }
    `}>
      {view === 'list' && !focusMode ? renderListView() : renderEditorView()}
    </div>
  );
};

export default IdeMengajarPage;