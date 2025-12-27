// src/pages/PengaturanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Download, Upload, ShieldCheck, AlertTriangle, Database, Share2, Save } from 'lucide-react';

const PengaturanPage = () => {
  const fileInputRef = useRef(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Cek & Request Persistent Storage (Agar data browser aman)
  useEffect(() => {
    const checkPersistence = async () => {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        setIsPersisted(isPersisted);
        if (!isPersisted) {
            const granted = await navigator.storage.persist();
            setIsPersisted(granted);
        }
      }
    };
    checkPersistence();
  }, []);

  // --- HELPER: FUNGSI PEMBUAT DATA JSON (Dipakai oleh Download & Share) ---
  const generateBackupData = async () => {
    const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];
    const data = { timestamp: new Date().toISOString(), version: 2 };

    for (const table of tables) {
      try {
          data[table] = await db[table].toArray();
      } catch (err) {
          console.error(`Gagal ambil tabel ${table}:`, err);
          data[table] = [];
      }
    }
    return JSON.stringify(data, null, 2);
  };

  // 2. FUNGSI A: SIMPAN FILE (DOWNLOAD BIASA)
  const handleDownload = async () => {
    setLoading(true);
    try {
      const jsonString = await generateBackupData();
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

      alert("✅ File backup berhasil disimpan!");
    } catch (error) {
      alert("Gagal Simpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNGSI B: BAGIKAN (SHARE KE WA/DRIVE)
  const handleShare = async () => {
    setLoading(true);
    try {
      const jsonString = await generateBackupData();
      const fileName = `BACKUP_GURU_${new Date().toISOString().slice(0,10)}.json`;
      const file = new File([jsonString], fileName, { type: "application/json" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup Data Guru',
          text: 'File cadangan aplikasi Jurnal Guru.'
        });
      } else {
        alert("⚠️ Fitur 'Bagikan' tidak didukung di perangkat/browser ini. Silakan gunakan tombol 'Simpan File'.");
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
         alert("Gagal Membagikan: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  
  // 4. FUNGSI RESTORE (Update Perbaikan Error)
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("⚠️ TIMPA DATA? Data saat ini akan digabung dengan file backup.")) {
        if(fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];

        await db.transaction('rw', db.classes, db.students, db.settings, db.syllabus, db.assessments_meta, db.journals, db.attendance, db.grades, async () => {
          for (const table of tables) {
            if (backupData[table]) await db[table].bulkPut(backupData[table]);
          }
        });

        alert("✅ Data berhasil dipulihkan!");
        window.location.reload();
      } catch (error) {
        console.error(error); // <--- PERBAIKAN: Gunakan variabel 'error' di sini
        alert("File rusak/invalid atau format tidak sesuai.");
      } finally {
        setLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => { // Hapus parameter 'error' di sini jika tidak dipakai
        alert("Gagal membaca file.");
        setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan</h1>

      {/* STATUS PENYIMPANAN */}
      <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${isPersisted ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {isPersisted ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
        <div>
          <h3 className="font-bold text-sm">{isPersisted ? 'Aman (Persisted)' : 'Mode Standar'}</h3>
          <p className="text-xs mt-1">
            {isPersisted ? "Data tersimpan permanen di browser." : "Data rentan terhapus jika memori penuh."}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Database size={18}/> Manajemen Data
        </h2>

        {/* KARTU 1: BACKUP (DUA TOMBOL) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Download size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Backup Data</h3>
                    <p className="text-xs text-slate-500">Amankan data Anda sekarang</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Tombol Simpan */}
                <button 
                    onClick={handleDownload} 
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Save size={20}/>
                    <span className="text-xs">Simpan File</span>
                </button>

                {/* Tombol Bagikan */}
                <button 
                    onClick={handleShare} 
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Share2 size={20}/>
                    <span className="text-xs">Bagikan (WA/Drive)</span>
                </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3 italic">
                *Gunakan tombol "Bagikan" di HP untuk ke Google Drive.
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
                    <p className="text-xs text-slate-500">Pulihkan dari file JSON</p>
                </div>
            </div>
            
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />
            
            <button 
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? 'Memproses...' : 'Pilih File Backup'}
            </button>
        </div>
      </section>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-300">v1.0.2 Offline Build</p>
      </div>
    </div>
  );
};

export default PengaturanPage;