// src/pages/PengaturanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Download, Upload, ShieldCheck, AlertTriangle, Database } from 'lucide-react';

const PengaturanPage = () => {
  const fileInputRef = useRef(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Cek & Request Persistent Storage
  useEffect(() => {
    const checkPersistence = async () => {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        setIsPersisted(isPersisted);
        if (!isPersisted) {
            // Coba minta izin (biasanya browser butuh interaksi user dulu, 
            // tapi kita coba saja request saat mount)
            const granted = await navigator.storage.persist();
            setIsPersisted(granted);
        }
      }
    };
    checkPersistence();
  }, []);

  // 2. FUNGSI BACKUP (REVISI FINAL: SHARE DI HP / DOWNLOAD DI LAPTOP)
  const handleBackup = async () => {
    setLoading(true);
    try {
      // A. KUMPULKAN DATA DARI DB
      const tables = ['settings', 'classes', 'students', 'syllabus', 'assessments_meta', 'journals', 'attendance', 'grades'];
      const data = { timestamp: new Date().toISOString(), version: 2 };

      for (const table of tables) {
        // Kita gunakan try-catch per tabel agar jika satu error, backup tidak gagal total
        try {
            data[table] = await db[table].toArray();
        } catch (err) {
            console.error(`Gagal backup tabel ${table}:`, err);
            data[table] = []; // Tetap lanjut dengan array kosong
        }
      }

      const fileName = `BACKUP_GURU_${new Date().toISOString().slice(0,10)}.json`;
      const jsonString = JSON.stringify(data, null, 2);

      // B. PERSIAPKAN FILE
      const file = new File([jsonString], fileName, { type: "application/json" });

      // C. LOGIKA PINTAR: SHARE VS DOWNLOAD
      // Cek apakah browser mendukung sharing FILE (Fitur HP)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Backup Data Guru',
            text: 'Simpan file ini ke Google Drive atau kirim ke WhatsApp sebagai cadangan.'
          });
          // Jangan alert jika user cuma membatalkan share, cukup log saja
          console.log("Share menu terbuka/selesai");
        } catch (shareError) {
          // User mungkin menekan 'Cancel' di menu share
          if (shareError.name !== 'AbortError') {
             console.error('Share error:', shareError);
             // Jika share gagal teknis, fallback ke download biasa
             downloadManual(jsonString, fileName);
          }
        }
      } else {
        // --- JALUR LAPTOP (DOWNLOAD BIASA) ---
        downloadManual(jsonString, fileName);
      }

    } catch (error) {
      console.error(error);
      alert("Gagal Backup: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi pembantu untuk download biasa (Desktop Fallback)
  const downloadManual = (jsonString, fileName) => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Bersihkan memori
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);

    alert("✅ File backup berhasil diunduh!");
  };

  // 3. FUNGSI RESTORE (IMPORT JSON)
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("⚠️ PERINGATAN: Data saat ini akan DIGABUNGKAN/DITIMPA dengan data backup. Lanjutkan?")) {
        // Reset input agar bisa pilih file yang sama lagi kalau mau
        if(fileInputRef.current) fileInputRef.current.value = '';
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
            if (backupData[table] && Array.isArray(backupData[table])) {
              // bulkPut: Update jika ID sama, Insert jika ID baru
              await db[table].bulkPut(backupData[table]);
            }
          }
        });

        alert("✅ Data berhasil dipulihkan!");
        window.location.reload(); // Refresh agar data tampil
      } catch (error) {
        console.error(error);
        alert("File backup rusak atau format salah.");
      } finally {
        setLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => {
        alert("Gagal membaca file.");
        setLoading(false);
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
              ? "Browser telah mengizinkan aplikasi ini menyimpan data secara permanen." 
              : "Browser mungkin menghapus data jika memori HP penuh. Rutinlah melakukan Backup."}
          </p>
        </div>
      </div>

      {/* AREA BACKUP & RESTORE */}
      <section className="space-y-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Database size={18}/> Manajemen Data
        </h2>

        {/* KARTU BACKUP (DOWNLOAD/SHARE) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Download size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Backup Data</h3>
                    <p className="text-xs text-slate-500">Simpan/Bagikan data ke tempat aman</p>
                </div>
            </div>
            <button 
                onClick={handleBackup} 
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? 'Memproses...' : 'Backup Data Sekarang'}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-3">
                *Di HP: Akan membuka menu Share (Drive/WA).<br/>
                *Di Laptop: Akan langsung download file.
            </p>
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
                {loading ? 'Memproses...' : 'Pilih File Backup'}
            </button>
        </div>
      </section>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-300">Versi Aplikasi: 1.0.1 (Offline Build)</p>
      </div>
    </div>
  );
};

export default PengaturanPage;