// src/pages/KelasDetail.jsx
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import * as XLSX from 'xlsx';
import { 
  ChevronLeft, FileSpreadsheet, Trash2, Pencil, 
  X, Save, Clipboard, HelpCircle, CheckCircle 
} from 'lucide-react'; // 'User' dihapus karena tidak dipakai
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

  // 1. QUERY DATA KELAS
  const kelas = useLiveQuery(() => db.classes.get(classId));

  // 2. QUERY SISWA (AUTO SORT A-Z)
  const students = useLiveQuery(() => 
    db.students.where('classId').equals(classId).sortBy('name')
  ) || [];

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

        await db.students.bulkAdd(formattedStudents);
        toast.success(`Berhasil mengimpor ${formattedStudents.length} siswa!`);
      } catch (error) {
        console.error(error); // FIX: Gunakan variable error untuk debugging
        toast.error('Gagal membaca file Excel.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- LOGIC INPUT MANUAL (COPY PASTE) ---
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

    // AUTO SORT PREVIEW
    parsedData.sort((a, b) => a.name.localeCompare(b.name));

    setPastePreview(parsedData);
  };

  const handleSaveManual = async () => {
    if (pastePreview.length === 0) {
        toast.error("Tempel/Paste data siswa terlebih dahulu.");
        return;
    }
    try {
        await db.students.bulkAdd(pastePreview);
        toast.success(`${pastePreview.length} Siswa berhasil ditambahkan!`);
        setManualModalOpen(false);
        setPastePreview([]);
        setRawText('');
    } catch (error) {
        // FIX: Error digunakan dalam pesan
        toast.error("Gagal menyimpan: " + error.message);
    }
  };

  // --- LOGIC HAPUS ---
  const confirmDelete = (siswa) => {
    setDeleteModal({
        isOpen: true,
        id: siswa.id,
        name: siswa.name
    });
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
    try {
      await db.students.update(editingStudent.id, {
        name: editingStudent.name,
        nis: editingStudent.nis,
        gender: editingStudent.gender
      });
      toast.success("Data siswa diperbarui");
      setEditingStudent(null);
    } catch (error) {
      console.error(error); // FIX: Log error agar variable terpakai
      toast.error("Gagal update data");
    }
  };

  if (!kelas) return <div className="p-6 text-center text-slate-500">Memuat data kelas...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 relative">
      {/* MODAL KONFIRMASI HAPUS */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({...deleteModal, isOpen: false})}
        onConfirm={executeDelete}
        title="Hapus Siswa?"
        message={`Yakin ingin menghapus ${deleteModal.name}? Riwayat nilai dan absensi siswa ini akan hilang permanen.`}
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
                <p className="font-bold mb-1">Format Excel / Copy-Paste yang didukung:</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Kolom 1: <b>Nama Lengkap</b> (Wajib)</li>
                    <li>Kolom 2: <b>NIS / NISN</b> (Opsional)</li>
                    <li>Kolom 3: <b>L/P</b> (Jenis Kelamin, Opsional)</li>
                </ul>
                <p className="mt-2 text-[10px] italic">Tips: Anda bisa menyalin blok sel langsung dari Excel dan menempelkannya di menu "Input Manual".</p>
            </div>
        )}

        <div className="flex gap-2">
          {/* Tombol Import Excel */}
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isImporting}
            className="flex-1 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-green-100 hover:bg-green-100 transition-colors"
          >
            {isImporting ? 'Processing...' : <><FileSpreadsheet size={18} /> Import Excel</>}
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {/* Tombol Input Manual (Copy-Paste) */}
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
            <div className="text-center py-10 text-slate-400 italic">
                Belum ada siswa di kelas ini.
            </div>
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

      {/* --- MODAL EDIT SISWA --- */}
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

      {/* --- MODAL INPUT MANUAL (COPY PASTE) --- */}
      {manualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Clipboard size={20}/> Input Manual (Copy-Paste)
                        </h3>
                        <p className="text-xs text-slate-500">Salin dari Excel lalu tempel di bawah ini.</p>
                    </div>
                    <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                {/* Area Input */}
                <textarea 
                    autoFocus
                    value={rawText}
                    onChange={handlePasteProcess}
                    placeholder={`Contoh:\nBudi Santoso\t1001\tL\nSiti Aminah\t1002\tP\n...`}
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none mb-4 resize-none"
                />

                {/* Preview Table */}
                <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 mb-4 p-2">
                    {pastePreview.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <p className="text-sm">Preview data akan muncul di sini</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-500 border-b">
                                <tr>
                                    <th className="p-2">No</th>
                                    <th className="p-2">Nama</th>
                                    <th className="p-2">NIS</th>
                                    <th className="p-2">L/P</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastePreview.map((s, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2 text-slate-400">{idx + 1}</td>
                                        <td className="p-2 font-bold text-slate-700">{s.name}</td>
                                        <td className="p-2 text-slate-500">{s.nis}</td>
                                        <td className="p-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                                {s.gender}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">
                        Total: {pastePreview.length} Siswa (Auto-Sorted)
                    </span>
                    <button 
                        onClick={handleSaveManual}
                        disabled={pastePreview.length === 0}
                        className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                    >
                        <CheckCircle size={16}/> Simpan Data
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default KelasDetail;