import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Download, Upload, ShieldCheck, AlertTriangle, Database, CheckCircle } from 'lucide-react';

const PengaturanPage = () => {
  const fileInputRef = useRef(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Cek & Request Persistent Storage (Agar browser tidak hapus data otomatis)
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

  // 2. FUNGSI BACKUP (EXPORT JSON)
  // 2. FUNGSI BACKUP (REVISI: SUPPORT SHARE/DRIVE DI HP)
  const handleBackup = async () => {
    setLoading(true);
    try {
      // A. KUMPULKAN DATA (Sama seperti sebelumnya)
      const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];
      const data = { timestamp: new Date().toISOString(), version: 2 };

      for (const table of tables) {
        data[table] = await db[table].toArray();
      }

      const fileName = `BACKUP_GURU_${new Date().toISOString().slice(0,10)}.json`;
      const jsonString = JSON.stringify(data, null, 2);

      // B. CEK APAKAH BISA SHARE (Biasanya cuma bisa di HP/Tablet)
      // Kita harus bungkus data jadi Object File dulu
      const file = new File([jsonString], fileName, { type: "application/json" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // --- JALUR HP (SHARE API) ---
        try {
          await navigator.share({
            files: [file],
            title: 'Backup Data Guru',
            text: 'Simpan file ini ke Google Drive atau kirim ke WhatsApp sebagai cadangan.'
          });
          // Jika user berhasil memilih aplikasi (misal Drive/WA), kode ini jalan
          alert("✅ Menu bagikan terbuka!");
        } catch (shareError) {
          // Jika user membatalkan share, tidak perlu error heboh
          console.log('Share dibatalkan:', shareError);
        }
      } else {
        // --- JALUR LAPTOP/BROWSER LAMA (DOWNLOAD BIASA) ---
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("✅ Data berhasil di-download ke penyimpanan lokal.");
      }

    } catch (error) {
      console.error(error);
      alert("Gagal Backup: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNGSI RESTORE (IMPORT JSON)
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("⚠️ PERINGATAN: Tindakan ini akan menimpa/menggabungkan data yang ada dengan data dari file backup. Lanjutkan?")) {
        return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];

        // Gunakan Transaksi Database (Semua sukses atau batal semua)
        await db.transaction('rw', db.classes, db.students, db.settings, db.syllabus, db.assessments_meta, db.journals, db.attendance, db.grades, async () => {
          for (const table of tables) {
            if (backupData[table]) {
              // Kita pakai bulkPut (Update jika ada, Insert jika belum)
              await db[table].bulkPut(backupData[table]);
            }
          }
        });

        alert("✅ Data berhasil dipulihkan!");
        window.location.reload(); // Refresh agar data tampil
      } catch (error) {
        console.error(error);
        alert("File backup rusak atau tidak valid.");
      } finally {
        setLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan & Data</h1>

      {/* STATUS PENYIMPANAN */}
      <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${isPersisted ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {isPersisted ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
        <div>
          <h3 className="font-bold text-sm">{isPersisted ? 'Penyimpanan Aman (Persisted)' : 'Mode Penyimpanan Standar'}</h3>
          <p className="text-xs mt-1 leading-relaxed">
            {isPersisted 
              ? "Browser telah mengizinkan aplikasi ini menyimpan data secara permanen. Data tidak akan dihapus otomatis." 
              : "Browser mungkin menghapus data jika memori HP penuh. Sangat disarankan untuk rutin melakukan Backup."}
          </p>
        </div>
      </div>

      {/* AREA BACKUP & RESTORE */}
      <section className="space-y-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Database size={18}/> Manajemen Data
        </h2>

        {/* KARTU DOWNLOAD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Download size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Backup Data</h3>
                    <p className="text-xs text-slate-500">Simpan semua data ke file aman</p>
                </div>
            </div>
            <button 
                onClick={handleBackup} 
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? 'Memproses...' : 'Download File Backup (.json)'}
            </button>
        </div>

        {/* KARTU RESTORE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                    <Upload size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Restore Data</h3>
                    <p className="text-xs text-slate-500">Pulihkan data dari file backup</p>
                </div>
            </div>
            
            <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleRestore} 
                className="hidden" 
            />
            
            <button 
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? 'Memproses...' : 'Pilih File Backup untuk Dipulihkan'}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-3">
                *Data saat ini akan digabungkan dengan data backup.
            </p>
        </div>
      </section>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-300">Versi Aplikasi: 1.0.0 (Offline Build)</p>
      </div>
    </div>
  );
};

export default PengaturanPage;