// src/pages/Kelas.jsx
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Users, ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; // Digabung biar rapi
import {toast} from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

const Kelas = () => {
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // State untuk Modal Hapus
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: ''
  });

  // 1. MENGAMBIL DATA KELAS (Real-time)
  const classes = useLiveQuery(() => db.classes.toArray()) || [];

  // 2. FUNGSI TAMBAH KELAS
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) {
        toast.error("Nama kelas tidak boleh kosong");
        return;
    }

    try {
      await db.classes.add({
        name: newClassName.toUpperCase(),
        createdAt: new Date()
      });
      setNewClassName('');
      setShowInput(false);
      toast.success("Kelas berhasil dibuat!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambah kelas.");
    }
  };

  // 3. FUNGSI TRIGGER HAPUS (Buka Modal)
  const handleDeleteClick = (e, kelas) => {
    e.preventDefault(); // Mencegah masuk ke halaman detail
    setDeleteModal({
        isOpen: true,
        id: kelas.id,
        name: kelas.name
    });
  };

  // 4. EKSEKUSI HAPUS
  const executeDelete = async () => {
    if (deleteModal.id) {
        try {
            await db.classes.delete(deleteModal.id);
            // Opsional: Hapus siswa di kelas ini juga
            await db.students.where('classId').equals(deleteModal.id).delete();
            
            toast.success("Kelas berhasil dihapus");
            setDeleteModal({ isOpen: false, id: null, name: '' });
        } catch (error) {
            console.error(error);
            toast.error("Gagal menghapus kelas.");
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* MODAL KONFIRMASI */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={executeDelete}
        title="Hapus Kelas?"
        message={`Yakin hapus kelas ${deleteModal.name}? Data siswa di dalamnya juga akan terhapus permanen.`}
        isDanger={true}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Kelas</h1>
          <p className="text-slate-500 text-sm">Kelola daftar kelas ajar Anda</p>
        </div>
      </div>

      {/* Grid Daftar Kelas */}
      <div className="grid grid-cols-1 gap-4">
        {classes.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users size={48} className="mx-auto mb-3 opacity-20"/>
            <p>Belum ada kelas.</p>
            <p className="text-xs">Tekan tombol + di bawah untuk menambah.</p>
          </div>
        )}

        {classes.map((kelas) => (
          <Link 
            to={`/kelas/${kelas.id}`} 
            key={kelas.id} 
            className="block"
          >
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-teal-200 transition-colors active:scale-[0.99] duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{kelas.name}</h3>
                  <p className="text-xs text-slate-400">Klik untuk lihat detail</p>
                </div>
              </div>
              
              {/* Tombol Hapus */}
              <button 
                onClick={(e) => handleDeleteClick(e, kelas)}
                className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* Floating Action Button (FAB) & Input Modal */}
      <div className="fixed bottom-24 right-6 left-6 max-w-md mx-auto flex justify-end pointer-events-none z-40">
        {/* Form Input Melayang */}
        {showInput && (
           <form onSubmit={handleAddClass} className="absolute bottom-16 right-0 w-full bg-white p-4 rounded-2xl shadow-xl border border-slate-100 pointer-events-auto animate-in slide-in-from-bottom-5">
             <label className="text-xs font-bold text-slate-500 mb-1 block">NAMA KELAS</label>
             <div className="flex gap-2">
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Cth: X-RPL-1" 
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                 value={newClassName}
                 onChange={(e) => setNewClassName(e.target.value)}
               />
               <button type="submit" className="bg-teal-600 text-white px-4 rounded-xl font-bold hover:bg-teal-700 transition-colors">OK</button>
             </div>
           </form>
        )}

        {/* Tombol Plus */}
        <button 
          onClick={() => setShowInput(!showInput)}
          className={`w-14 h-14 rounded-full shadow-lg shadow-teal-600/30 flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 pointer-events-auto ${showInput ? 'bg-slate-800 rotate-45' : 'bg-teal-600'}`}
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default Kelas;