// src/pages/KelasDetail.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import * as XLSX from 'xlsx';
import { 
  ChevronLeft, FileSpreadsheet, Trash2, Pencil, 
  X, Save, Clipboard, HelpCircle, CheckCircle, 
  Activity, ThumbsUp, ThumbsDown, History, AlertTriangle, 
  Stethoscope, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

// Service Monitoring
import { 
    analyzeStudentRisk, addBehaviorLog, getStudentHistory, 
    createIntervention, resolveIntervention 
} from '../services/monitoringService';

const KelasDetail = () => {
  const { id } = useParams();
  const classId = parseInt(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State UI
  const [isImporting, setIsImporting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [riskMap, setRiskMap] = useState({}); 
  
  // State Data & Modal
  const [editingStudent, setEditingStudent] = useState(null); 
  const [manualModalOpen, setManualModalOpen] = useState(false);
  
  // --- STATE MONITORING ---
  const [monitorStudent, setMonitorStudent] = useState(null); 
  const [activeTab, setActiveTab] = useState('BEHAVIOR'); // 'BEHAVIOR' or 'INTERVENTION'
  const [monitorHistory, setMonitorHistory] = useState([]);   
  
  // Form Perilaku
  const [behaviorForm, setBehaviorForm] = useState({
      type: 'NEGATIVE',
      category: 'Kedisiplinan',
      description: '',
      date: new Date().toISOString().split('T')[0],
      customDateLabel: ''
  });

  // Form Intervensi/Penanganan
  const [activeIntervention, setActiveIntervention] = useState(null);
  const [interventionForm, setInterventionForm] = useState({
      actionPlan: '',
      problemSummary: '',
      resultNotes: '' 
  });
  // ------------------------

  const [pastePreview, setPastePreview] = useState([]);
  const [rawText, setRawText] = useState('');

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: ''
  });

  // 1. QUERY DATA
  const kelas = useLiveQuery(() => db.classes.get(classId));
  
  // PERBAIKAN 1: Hapus "|| []" agar referensi array stabil untuk useEffect
  const students = useLiveQuery(() => 
    db.students.where('classId').equals(classId).sortBy('name')
  );

  // 2. LOAD RISIKO SISWA
  useEffect(() => {
      const loadRisks = async () => {
          // Handle jika students masih undefined/loading
          if (!students || students.length === 0) return;
          
          const map = {};
          await Promise.all(students.map(async (s) => {
              const res = await analyzeStudentRisk(s.id);
              map[s.id] = res.level; 
          }));
          setRiskMap(map);
      };
      loadRisks();
  }, [students]); // Sekarang aman karena students berasal langsung dari Dexie

  // PERBAIKAN 2: Bungkus refreshMonitorData dengan useCallback
  const refreshMonitorData = useCallback(async () => {
      if(!monitorStudent) return;
      // Load History
      const history = await getStudentHistory(monitorStudent.id);
      setMonitorHistory(history);
      
      // Load Active Intervention
      const interventions = await db.interventions
        .where({ studentId: monitorStudent.id, status: 'OPEN' }).toArray();
      setActiveIntervention(interventions[0] || null);
  }, [monitorStudent]);

  // 3. LOAD DATA SAAT MODAL DIBUKA
  useEffect(() => {
      if (monitorStudent) {
          refreshMonitorData();
          // Reset form saat ganti siswa
          setBehaviorForm({ 
              type: 'NEGATIVE', category: 'Kedisiplinan', description: '',
              date: new Date().toISOString().split('T')[0], customDateLabel: ''
          });
          setInterventionForm({ actionPlan: '', problemSummary: '', resultNotes: '' });
          setActiveTab('BEHAVIOR'); 
      }
  }, [monitorStudent, refreshMonitorData]); // Tambahkan refreshMonitorData ke dependency


  // --- LOGIC MONITORING ---
  const handleSaveBehavior = async (e) => {
      e.preventDefault();
      if(!behaviorForm.description) return toast.error("Deskripsi wajib diisi");

      try {
          await addBehaviorLog({
              studentId: monitorStudent.id,
              date: behaviorForm.date || new Date().toISOString(), 
              type: behaviorForm.type,
              category: behaviorForm.category,
              description: behaviorForm.description,
              customDateLabel: behaviorForm.customDateLabel 
          });
          toast.success("Catatan perilaku tersimpan");
          
          refreshMonitorData();
          setBehaviorForm(prev => ({ ...prev, description: '', customDateLabel: '' })); 
          
          const newRisk = await analyzeStudentRisk(monitorStudent.id);
          setRiskMap(prev => ({ ...prev, [monitorStudent.id]: newRisk.level }));

      } catch (error) {
          toast.error("Gagal menyimpan: " + error.message);
      }
  };

  // --- LOGIC INTERVENTION (TINDAK LANJUT) ---
  const handleCreateIntervention = async () => {
      if(!interventionForm.problemSummary || !interventionForm.actionPlan) {
          return toast.error("Ringkasan Masalah & Rencana Tindakan wajib diisi");
      }
      try {
          await createIntervention({
              studentId: monitorStudent.id,
              startDate: new Date().toISOString(),
              trigger: 'Manual',
              problemSummary: interventionForm.problemSummary,
              actionPlan: interventionForm.actionPlan,
              status: 'OPEN'
          });
          toast.success("Penanganan dimulai!");
          refreshMonitorData();
      } catch (e) { toast.error(e.message); }
  };

  const handleResolveIntervention = async () => {
      if(!activeIntervention) return;
      try {
          await resolveIntervention(activeIntervention.id, interventionForm.resultNotes || "Selesai");
          toast.success("Kasus ditutup/selesai!");
          setActiveIntervention(null);
          refreshMonitorData();
          
          const newRisk = await analyzeStudentRisk(monitorStudent.id);
          setRiskMap(prev => ({ ...prev, [monitorStudent.id]: newRisk.level }));
      } catch (e) { toast.error(e.message); }
  };

  const renderDateDisplay = (log) => {
      if (log.customDateLabel) return log.customDateLabel;
      if (log.date) return new Date(log.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
      return '-';
  };

  // --- HELPER VALIDASI ---
  const validateStudentData = (candidates, existingData, isUpdate = false, currentId = null) => {
    if (!isUpdate && candidates.length > 1) {
        const names = candidates.map(s => s.name.trim().toLowerCase());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) return "Terdapat duplikasi NAMA dalam data inputan Anda.";
    }
    for (const candidate of candidates) {
        const duplicateName = existingData.find(s => 
            s.name.trim().toLowerCase() === candidate.name.trim().toLowerCase() && 
            (isUpdate ? s.id !== currentId : true)
        );
        if (duplicateName) return `Gagal: Nama "${candidate.name}" sudah terdaftar.`;
    }
    return null; 
  };

  // --- LOGIC IMPORT & MANUAL INPUT ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const formattedStudents = data.map(row => ({
          name: row['Nama'] || row['nama'] || row['Name'],
          nis: row['NIS'] || row['nis'] || '-',
          gender: (row['L/P'] || row['Gender'] || 'L').toString().toUpperCase().charAt(0),
          classId: classId
        })).filter(s => s.name);

        if (formattedStudents.length === 0) { toast.error("Data tidak valid."); return; }
        
        // Handle students undefined saat pertama kali load
        const currentStudents = students || [];
        const errorMsg = validateStudentData(formattedStudents, currentStudents);
        if (errorMsg) { toast.error(errorMsg); return; }

        await db.students.bulkAdd(formattedStudents);
        toast.success(`Berhasil mengimpor ${formattedStudents.length} siswa!`);
      } catch (error) { 
          // PERBAIKAN 3: Gunakan variable error
          console.error(error);
          toast.error('Gagal membaca file Excel.'); 
      } 
      finally { setIsImporting(false); if(fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const handlePasteProcess = (e) => {
    const text = e.target.value;
    setRawText(text);
    const rows = text.trim().split('\n');
    const parsedData = rows.map(row => {
        const cols = row.split('\t'); 
        return {
            name: cols[0]?.trim(),
            nis: cols[1]?.trim() || '-',
            gender: cols[2]?.trim().toUpperCase().charAt(0) || 'L',
            classId: classId
        };
    }).filter(item => item.name);
    parsedData.sort((a, b) => a.name.localeCompare(b.name));
    setPastePreview(parsedData);
  };

  const handleSaveManual = async () => {
    if (pastePreview.length === 0) { toast.error("Data kosong."); return; }
    
    const currentStudents = students || [];
    const errorMsg = validateStudentData(pastePreview, currentStudents);
    if (errorMsg) { toast.error(errorMsg); return; }
    try {
        await db.students.bulkAdd(pastePreview);
        toast.success(`${pastePreview.length} Siswa berhasil ditambahkan!`);
        setManualModalOpen(false); setPastePreview([]); setRawText('');
    } catch (error) { toast.error("Gagal menyimpan: " + error.message); }
  };

  const confirmDelete = (siswa) => setDeleteModal({ isOpen: true, id: siswa.id, name: siswa.name });
  const executeDelete = async () => {
    if (deleteModal.id) {
        await db.students.delete(deleteModal.id);
        toast.success("Siswa dihapus");
        setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    const currentStudents = students || [];
    const errorMsg = validateStudentData([editingStudent], currentStudents, true, editingStudent.id);
    if (errorMsg) { toast.error(errorMsg); return; }
    try {
      await db.students.update(editingStudent.id, {
        name: editingStudent.name, nis: editingStudent.nis, gender: editingStudent.gender
      });
      toast.success("Diperbarui"); setEditingStudent(null);
    } catch (error) { 
        // PERBAIKAN 4: Gunakan variable error
        console.error(error);
        toast.error("Gagal update"); 
    }
  };

  if (!kelas) return <div className="p-6 text-center text-slate-500">Memuat data kelas...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 relative">
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({...deleteModal, isOpen: false})}
        onConfirm={executeDelete}
        title="Hapus Siswa?"
        message={`Yakin ingin menghapus ${deleteModal.name}?`}
        isDanger={true}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100 transition">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{kelas.name}</h1>
          <p className="text-slate-500 text-sm">{students ? students.length : 0} Siswa Terdaftar</p>
        </div>
      </div>

      {/* Area Tombol Aksi */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-slate-700 text-sm">Kelola Data Siswa</h3>
             <button onClick={() => setShowInfo(!showInfo)} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition">
                <HelpCircle size={14}/> Panduan Format
             </button>
        </div>
        {showInfo && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-800 animate-in slide-in-from-top-2">
                <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Kolom 1: <b>Nama</b> (Wajib)</li>
                    <li>Kolom 2: <b>NIS</b> (Opsional)</li>
                    <li>Kolom 3: <b>L/P</b></li>
                </ul>
            </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current.click()} disabled={isImporting} className="flex-1 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-colors">
            {isImporting ? 'Processing...' : <><FileSpreadsheet size={18} /> Import Excel</>}
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => setManualModalOpen(true)} className="flex-1 bg-slate-50 text-slate-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-100 transition">
            <Clipboard size={18} /> Input Manual
          </button>
        </div>
      </div>

      {/* Daftar Siswa */}
      <div className="space-y-3">
        {(!students || students.length === 0) && <div className="text-center py-10 text-slate-400 italic">Belum ada siswa.</div>}
        
        {/* Gunakan students? untuk handle undefined */}
        {students?.map((siswa, index) => {
            const riskLevel = riskMap[siswa.id] || 'GREEN';
            let borderColor = 'border-slate-100';
            if (riskLevel === 'YELLOW') borderColor = 'border-amber-300 ring-1 ring-amber-100';
            if (riskLevel === 'RED') borderColor = 'border-red-400 ring-1 ring-red-100';

            return (
              <div key={siswa.id} className={`bg-white p-4 rounded-xl border ${borderColor} flex items-center justify-between group hover:shadow-md transition-all`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${riskLevel === 'RED' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{siswa.name}</p>
                        {riskLevel === 'RED' && <AlertTriangle size={12} className="text-red-500 fill-red-100" />}
                    </div>
                    <p className="text-xs text-slate-400">NIS: {siswa.nis} • {siswa.gender}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setMonitorStudent(siswa)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Pantau Perilaku">
                    <Activity size={18} />
                  </button>
                  <button onClick={() => setEditingStudent(siswa)} className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => confirmDelete(siswa)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
        })}
      </div>

      {/* --- MODAL EDIT --- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Edit Siswa</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">NAMA LENGKAP</label>
                <input type="text" value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">NIS</label>
                  <input type="text" value={editingStudent.nis} onChange={(e) => setEditingStudent({...editingStudent, nis: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"/>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">L/P</label>
                   <select value={editingStudent.gender} onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500">
                     <option value="L">L</option><option value="P">P</option>
                   </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700"><Save size={18} /> Simpan</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL MANUAL --- */}
      {manualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clipboard size={20}/> Input Manual</h3>
                    <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <textarea autoFocus value={rawText} onChange={handlePasteProcess} placeholder={`Contoh:\nBudi Santoso\t1001\tL\nSiti Aminah\t1002\tP`} className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none mb-4 resize-none"/>
                <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 mb-4 p-2">
                    {pastePreview.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><p className="text-sm">Preview data...</p></div> : 
                        <table className="w-full text-xs text-left"><thead className="text-slate-500 border-b"><tr><th className="p-2">No</th><th className="p-2">Nama</th><th className="p-2">NIS</th><th className="p-2">L/P</th></tr></thead><tbody className="divide-y divide-slate-100">{pastePreview.map((s, idx) => (<tr key={idx}><td className="p-2 text-slate-400">{idx + 1}</td><td className="p-2 font-bold text-slate-700">{s.name}</td><td className="p-2 text-slate-500">{s.nis}</td><td className="p-2">{s.gender}</td></tr>))}</tbody></table>
                    }
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Total: {pastePreview.length}</span>
                    <button onClick={handleSaveManual} disabled={pastePreview.length === 0} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"><CheckCircle size={16}/> Simpan</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL MONITORING & INTERVENTION (FINAL) --- */}
      {monitorStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 h-[85vh] flex flex-col">
                  {/* Header Modal */}
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              riskMap[monitorStudent.id] === 'RED' ? 'bg-red-100 text-red-600' : 
                              riskMap[monitorStudent.id] === 'YELLOW' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                              {monitorStudent.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-slate-800">{monitorStudent.name}</h3>
                              <p className="text-xs text-slate-500">Monitoring & Penanganan</p>
                          </div>
                      </div>
                      <button onClick={() => setMonitorStudent(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-200">
                          <X size={24} />
                      </button>
                  </div>

                  {/* TAB SWITCHER */}
                  <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                      <button 
                         onClick={() => setActiveTab('BEHAVIOR')}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'BEHAVIOR' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-600'}`}
                      >
                         Perilaku & Prestasi
                      </button>
                      <button 
                         onClick={() => setActiveTab('INTERVENTION')}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'INTERVENTION' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-600'}`}
                      >
                         <Stethoscope size={14}/> Tindak Lanjut
                         {activeIntervention && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                      </button>
                  </div>

                  {/* TAB 1: FORM PERILAKU */}
                  {activeTab === 'BEHAVIOR' && (
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 shrink-0">
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => setBehaviorForm({...behaviorForm, type: 'NEGATIVE'})} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${behaviorForm.type === 'NEGATIVE' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white text-slate-500 border'}`}>
                                    <ThumbsDown size={14}/> Pelanggaran
                                </button>
                                <button onClick={() => setBehaviorForm({...behaviorForm, type: 'POSITIVE'})} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${behaviorForm.type === 'POSITIVE' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border'}`}>
                                    <ThumbsUp size={14}/> Prestasi / Baik
                                </button>
                            </div>
                            {/*<div className="flex gap-2 mb-2">
                                <div className="w-1/3">
                                    <label className="text-[10px] font-bold text-slate-400 pl-1 block mb-1">TANGGAL</label>
                                    <input type="date" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600" value={behaviorForm.date} onChange={(e) => setBehaviorForm({...behaviorForm, date: e.target.value})}/>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 pl-1 block mb-1">LABEL (OPSIONAL)</label>
                                    <input type="text" placeholder="Cth: 2025" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={behaviorForm.customDateLabel} onChange={(e) => setBehaviorForm({...behaviorForm, customDateLabel: e.target.value})}/>
                                </div>
                            </div>*/}
                            <div className="flex gap-2 mb-3">
                                <select value={behaviorForm.category} onChange={(e) => setBehaviorForm({...behaviorForm, category: e.target.value})} className="w-1/3 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-10">
                                   <option>Kedisiplinan</option><option>Akademik</option><option>Sosial</option><option>Kerapian</option><option>Prestasi</option>
                                </select>
                                <input type="text" placeholder="Keterangan..." className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 h-10" value={behaviorForm.description} onChange={(e) => setBehaviorForm({...behaviorForm, description: e.target.value})} />
                            </div>
                            <button onClick={handleSaveBehavior} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-transform">
                                Simpan Catatan
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><History size={14}/> Riwayat</h4>
                            {monitorHistory.length === 0 ? (
                                <div className="text-center py-8 opacity-50"><Activity size={32} className="mx-auto mb-2 text-slate-300"/><p className="text-xs text-slate-400">Belum ada catatan.</p></div>
                            ) : (
                                <div className="space-y-3 pl-2">
                                    {monitorHistory.map((log) => (
                                        <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                                            <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${log.type === 'NEGATIVE' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${log.type === 'NEGATIVE' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{log.category}</span>
                                                    <p className="text-sm font-bold text-slate-700 mt-1">{log.description}</p>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">{renderDateDisplay(log)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      </div>
                  )}

                  {/* TAB 2: INTERVENTION (TINDAK LANJUT) */}
                  {activeTab === 'INTERVENTION' && (
                      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-5">
                          {!activeIntervention ? (
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center flex-1 flex flex-col items-center justify-center">
                                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><Stethoscope size={32} className="text-indigo-400"/></div>
                                  <h4 className="font-bold text-slate-700 mb-1">Belum Ada Tindak Lanjut Aktif</h4>
                                  <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">Jika siswa ini butuh penanganan khusus (misal: panggil ortu), buat rencana di sini.</p>
                                  
                                  <div className="w-full text-left space-y-3">
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 pl-1 block mb-1">RINGKASAN MASALAH</label>
                                          <input type="text" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Cth: Sering terlambat & tidur" value={interventionForm.problemSummary} onChange={e => setInterventionForm({...interventionForm, problemSummary: e.target.value})}/>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 pl-1 block mb-1">RENCANA TINDAKAN</label>
                                          <textarea className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" placeholder="Cth: Panggil wali murid hari Selasa..." value={interventionForm.actionPlan} onChange={e => setInterventionForm({...interventionForm, actionPlan: e.target.value})}/>
                                      </div>
                                      <button onClick={handleCreateIntervention} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 mt-2">Mulai Penanganan</button>
                                  </div>
                              </div>
                          ) : (
                              <div className="flex-1 flex flex-col">
                                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-2 opacity-10"><Activity size={64} className="text-amber-500"/></div>
                                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">STATUS: OPEN</span>
                                      <h4 className="font-bold text-amber-900 text-lg mb-1">{activeIntervention.problemSummary}</h4>
                                      <p className="text-sm text-amber-800 opacity-80">{activeIntervention.actionPlan}</p>
                                      <p className="text-[10px] text-amber-600 mt-3 font-mono">Dimulai: {new Date(activeIntervention.startDate).toLocaleDateString()}</p>
                                  </div>

                                  <div className="bg-white border border-slate-100 p-4 rounded-2xl flex-1">
                                      <h5 className="font-bold text-slate-700 text-sm mb-3">Penyelesaian Kasus</h5>
                                      <textarea 
                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-32 resize-none mb-3" 
                                          placeholder="Catatan hasil (Opsional). Cth: Orang tua sudah datang, siswa berjanji berubah."
                                          value={interventionForm.resultNotes}
                                          onChange={e => setInterventionForm({...interventionForm, resultNotes: e.target.value})}
                                      />
                                      <button onClick={handleResolveIntervention} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 flex items-center justify-center gap-2">
                                          <CheckCircle2 size={18}/> Tandai Masalah Selesai
                                      </button>
                                      <p className="text-[10px] text-slate-400 text-center mt-3">
                                          Menutup kasus akan menghilangkan notifikasi peringatan (Nudge) untuk siswa ini.
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default KelasDetail;