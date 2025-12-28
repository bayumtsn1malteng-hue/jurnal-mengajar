// src/pages/PengaturanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, Database, Share2, Save } from 'lucide-react';
import { dataService } from '../services/dataService';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const PengaturanPage = () => {
  const fileInputRef = useRef(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State untuk Modal Konfirmasi Restore
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });

  // 1. Cek Persistence
  useEffect(() => {
    const checkPersistence = async () => {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        setIsPersisted(isPersisted);
        if (!isPersisted) {
            // Minta izin otomatis di awal load
            const granted = await navigator.storage.persist();
            setIsPersisted(granted);
        }
      }
    };
    checkPersistence();
  }, []);

  // 2. Handle Download Backup
  const handleDownload = async () => {
    setLoading(true);
    const toastId = toast.loading("Menyiapkan file backup...");
    try {
      const jsonString = await dataService.exportData();
      const fileName = `BACKUP_GURU_${new Date().toISOString().slice(0,10)}.json`;

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("Backup berhasil disimpan!", { id: toastId });
    } catch (error) {
      toast.error("Gagal Backup: " + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Share (WA/Drive)
  const handleShare = async () => {
    setLoading(true);
    const toastId = toast.loading("Membuka menu share...");
    try {
      const jsonString = await dataService.exportData();
      const fileName = `BACKUP_GURU_${new Date().toISOString().slice(0,10)}.json`;
      const file = new File([jsonString], fileName, { type: "application/json" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup Data Guru',
          text: 'File cadangan aplikasi Jurnal Guru.'
        });
        toast.dismiss(toastId);
      } else {
        toast.error("Browser ini tidak mendukung fitur Share file.", { id: toastId });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
         toast.error("Gagal Share: " + error.message, { id: toastId });
      } else {
         toast.dismiss(toastId); // User membatalkan share
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle File Select & Restore Logic
  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input agar bisa pilih file yang sama berulang kali jika gagal
    e.target.value = '';

    // Buka Modal Konfirmasi
    setModal({
        isOpen: true,
        title: "Timpa Data?",
        message: "Data dari file backup akan digabungkan dengan data saat ini. Data dengan ID yang sama akan ditimpa.",
        isDanger: true,
        onConfirm: () => processRestore(file)
    });
  };

  const processRestore = (file) => {
    setLoading(true);
    const toastId = toast.loading("Memproses restore data...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await dataService.importData(event.target.result);
        toast.success("Data berhasil dipulihkan!", { id: toastId });
        
        // Refresh halaman agar state global terupdate
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error(error);
        toast.error("Gagal Restore: " + error.message, { id: toastId });
        setLoading(false);
      } 
    };
    
    reader.onerror = () => {
        toast.error("Gagal membaca file fisik.", { id: toastId });
        setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* MODAL COMPONENT */}
      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({...modal, isOpen: false})}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        isDanger={modal.isDanger}
      />

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan</h1>

      {/* STATUS STORAGE */}
      <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 transition-colors ${isPersisted ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {isPersisted ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
        <div>
          <h3 className="font-bold text-sm">{isPersisted ? 'Database Aman (Persisted)' : 'Mode Penyimpanan Sementara'}</h3>
          <p className="text-xs mt-1 leading-relaxed">
            {isPersisted 
              ? "Browser telah mengizinkan penyimpanan permanen. Data aman dari pembersihan otomatis." 
              : "Penyimpanan browser terbatas. Data berisiko hilang jika memori perangkat penuh."}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Database size={18}/> Manajemen Data
        </h2>

        {/* KARTU 1: BACKUP */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Download size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Backup Data</h3>
                    <p className="text-xs text-slate-500">Simpan atau kirim data ke perangkat lain</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleDownload} 
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 border border-slate-200"
                >
                    <Save size={20}/>
                    <span className="text-xs">Simpan File</span>
                </button>

                <button 
                    onClick={handleShare} 
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                    <Share2 size={20}/>
                    <span className="text-xs">Bagikan (WA)</span>
                </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3 italic">
                *File berformat .json. Jangan diubah isinya secara manual.
            </p>
        </div>

        {/* KARTU 2: RESTORE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                    <Upload size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Restore Data</h3>
                    <p className="text-xs text-slate-500">Pulihkan data dari file backup JSON</p>
                </div>
            </div>
            
            {/* Input File Tersembunyi */}
            <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={onFileSelected} 
                className="hidden" 
            />
            
            <button 
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
                className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? 'Sedang Memproses...' : 'Pilih File Backup (.json)'}
            </button>
        </div>
      </section>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-300 font-mono">Build v1.0.3 (Secure Storage)</p>
      </div>
    </div>
  );
};

export default PengaturanPage;