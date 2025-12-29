// src/pages/KelasDetail.jsx
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import * as XLSX from 'xlsx';
import { 
  ChevronLeft, FileSpreadsheet, Trash2, Pencil, 
  X, Save, Clipboard, HelpCircle, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const KelasDetail = () => {
  const { id } = useParams();
  const classId = parseInt(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State UI
  const [isImporting, setIsImporting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // State Data
  const [editingStudent, setEditingStudent] = useState(null); 
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [pastePreview, setPastePreview] = useState([]);
  const [rawText, setRawText] = useState('');

  // State Modal Hapus
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: ''
  });

  // 1. QUERY DATA
  const kelas = useLiveQuery(() => db.classes.get(classId));
  const students = useLiveQuery(() => 
    db.students.where('classId').equals(classId).sortBy('name')
  ) || [];

  // --- HELPER: VALIDASI DUPLIKASI ---
  const validateStudentData = (candidates, existingData, isUpdate = false, currentId = null) => {
    // 1. Cek Duplikasi Internal (Untuk Batch Insert seperti Import/Manual)
    if (!isUpdate && candidates.length > 1) {
        const names = candidates.map(s => s.name.trim().toLowerCase());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) return "Terdapat duplikasi NAMA dalam data inputan Anda.";

        const nises = candidates
            .map(s => s.nis)
            .filter(n => n && n !== '-' && n.trim() !== ''); // Abaikan NIS kosong/-
        const uniqueNises = new Set(nises);
        if (nises.length !== uniqueNises.size) return "Terdapat duplikasi NIS dalam data inputan Anda.";
    }

    // 2. Cek Konflik dengan Database
    for (const candidate of candidates) {
        // Cek Nama
        const duplicateName = existingData.find(s => 
            s.name.trim().toLowerCase() === candidate.name.trim().toLowerCase() && 
            (isUpdate ? s.id !== currentId : true)
        );
        if (duplicateName) return `Gagal: Nama "${candidate.name}" sudah terdaftar.`;

        // Cek NIS (Jika valid)
        if (candidate.nis && candidate.nis !== '-' && candidate.nis.trim() !== '') {
            const duplicateNIS = existingData.find(s => 
                s.nis === candidate.nis && 
                (isUpdate ? s.id !== currentId : true)
            );
            if (duplicateNIS) return `Gagal: NIS "${candidate.nis}" sudah dipakai oleh ${duplicateNIS.name}.`;
        }
    }
    return null; // Lolos Validasi
  };

  // --- LOGIC IMPORT EXCEL ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        const formattedStudents = data.map(row => ({
          name: row['Nama'] || row['nama'] || row['Name'],
          nis: row['NIS'] || row['nis'] || '-',
          gender: (row['L/P'] || row['Gender'] || 'L').toString().toUpperCase().charAt(0),
          classId: classId
        })).filter(s => s.name);

        if (formattedStudents.length === 0) {
            toast.error("Tidak ada data siswa yang valid ditemukan.");
            return;
        }

        // --- VALIDASI SEBELUM SIMPAN ---
        const errorMsg = validateStudentData(formattedStudents, students);
        if (errorMsg) {
            toast.error(errorMsg);
            return; // Stop proses
        }

        await db.students.bulkAdd(formattedStudents);
        toast.success(`Berhasil mengimpor ${formattedStudents.length} siswa!`);
      } catch (error) {
        console.error(error);
        toast.error('Gagal membaca file Excel.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- LOGIC INPUT MANUAL ---
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
    if (pastePreview.length === 0) {
        toast.error("Tempel/Paste data siswa terlebih dahulu.");
        return;
    }

    // --- VALIDASI SEBELUM SIMPAN ---
    const errorMsg = validateStudentData(pastePreview, students);
    if (errorMsg) {
        toast.error(errorMsg);
        return; // Stop proses
    }

    try {
        await db.students.bulkAdd(pastePreview);
        toast.success(`${pastePreview.length} Siswa berhasil ditambahkan!`);
        setManualModalOpen(false);
        setPastePreview([]);
        setRawText('');
    } catch (error) {
        toast.error("Gagal menyimpan: " + error.message);
    }
  };

  // --- LOGIC HAPUS ---
  const confirmDelete = (siswa) => {
    setDeleteModal({ isOpen: true, id: siswa.id, name: siswa.name });
  };

  const executeDelete = async () => {
    if (deleteModal.id) {
        await db.students.delete(deleteModal.id);
        toast.success("Siswa dihapus");
        setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  // --- LOGIC UPDATE ---
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    // --- VALIDASI SEBELUM UPDATE ---
    const errorMsg = validateStudentData([editingStudent], students, true, editingStudent.id);
    if (errorMsg) {
        toast.error(errorMsg);
        return; // Stop proses
    }

    try {
      await db.students.update(editingStudent.id, {
        name: editingStudent.name,
        nis: editingStudent.nis,
        gender: editingStudent.gender
      });
      toast.success("Data siswa diperbarui");
      setEditingStudent(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal update data");
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
          <p className="text-slate-500 text-sm">{students.length} Siswa Terdaftar</p>
        </div>
      </div>

      {/* Area Tombol Aksi */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-slate-700 text-sm">Kelola Data Siswa</h3>
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition"
             >
                <HelpCircle size={14}/> Panduan Format
             </button>
        </div>

        {showInfo && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-800 animate-in slide-in-from-top-2">
                <p className="font-bold mb-1">Format Excel / Copy-Paste:</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Kolom 1: <b>Nama</b> (Wajib, Unik)</li>
                    <li>Kolom 2: <b>NIS</b> (Opsional, Unik jika diisi)</li>
                    <li>Kolom 3: <b>L/P</b></li>
                </ul>
            </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isImporting}
            className="flex-1 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-colors"
          >
            {isImporting ? 'Processing...' : <><FileSpreadsheet size={18} /> Import Excel</>}
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          <button 
             onClick={() => setManualModalOpen(true)}
             className="flex-1 bg-slate-50 text-slate-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-100 transition"
          >
            <Clipboard size={18} /> Input Manual
          </button>
        </div>
      </div>

      {/* Daftar Siswa */}
      <div className="space-y-3">
        {students.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic">Belum ada siswa.</div>
        )}
        {students.map((siswa, index) => (
          <div key={siswa.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                {index + 1}
              </div>
              <div>
                <p className="font-bold text-slate-800">{siswa.name}</p>
                <p className="text-xs text-slate-400">NIS: {siswa.nis} • {siswa.gender}</p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => setEditingStudent(siswa)} 
                className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={() => confirmDelete(siswa)} 
                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL EDIT --- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Edit Siswa</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">NAMA LENGKAP</label>
                <input 
                  type="text" 
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">NIS</label>
                  <input 
                    type="text" 
                    value={editingStudent.nis}
                    onChange={(e) => setEditingStudent({...editingStudent, nis: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">L/P</label>
                   <select 
                      value={editingStudent.gender}
                      onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                   >
                     <option value="L">L</option>
                     <option value="P">P</option>
                   </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700">
                <Save size={18} /> Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL MANUAL --- */}
      {manualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Clipboard size={20}/> Input Manual
                        </h3>
                        <p className="text-xs text-slate-500">Copy dari Excel, Paste di sini.</p>
                    </div>
                    <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                <textarea 
                    autoFocus
                    value={rawText}
                    onChange={handlePasteProcess}
                    placeholder={`Contoh:\nBudi Santoso\t1001\tL\nSiti Aminah\t1002\tP`}
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none mb-4 resize-none"
                />
                <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 mb-4 p-2">
                    {pastePreview.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <p className="text-sm">Preview data...</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-500 border-b">
                                <tr><th className="p-2">No</th><th className="p-2">Nama</th><th className="p-2">NIS</th><th className="p-2">L/P</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastePreview.map((s, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2 text-slate-400">{idx + 1}</td>
                                        <td className="p-2 font-bold text-slate-700">{s.name}</td>
                                        <td className="p-2 text-slate-500">{s.nis}</td>
                                        <td className="p-2">{s.gender}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Total: {pastePreview.length}</span>
                    <button 
                        onClick={handleSaveManual}
                        disabled={pastePreview.length === 0}
                        className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <CheckCircle size={16}/> Simpan
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default KelasDetail;