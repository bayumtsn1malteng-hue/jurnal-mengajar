// src/pages/PengaturanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Upload, ShieldCheck, AlertTriangle, Database, 
  Share2, Save, Bell, BellOff, FileSpreadsheet // Tambah Icon FileSpreadsheet
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { downloadAllAttendance, downloadAllGrades } from '../utils/excelGenerator'; // Import Fungsi Baru
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const PengaturanPage = () => {
  // --- STATE UMUM ---
  const fileInputRef = useRef(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [modal, setModal] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false
  });

  // --- LOGIKA NOTIFIKASI ---
  const [notifPermission, setNotifPermission] = useState(Notification.permission);
  const notifEnabled = useLiveQuery(async () => {
    const setting = await db.settings.get('enableNotifications');
    return setting?.value ?? true; 
  }, []) ?? true;

  const toggleNotification = async () => {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission !== 'granted') {
        toast.error("Izin notifikasi ditolak browser. Cek ikon gembok di URL.");
        return;
      }
    }
    await db.settings.put({ key: 'enableNotifications', value: !notifEnabled });
    toast.success(!notifEnabled ? "Notifikasi Diaktifkan" : "Notifikasi Dimatikan");
  };

  // --- LOGIKA EXPORT LAPORAN (BARU) ---
  const handleExportReport = async (type) => {
    setLoading(true);
    const toastId = toast.loading("Membuat laporan Excel...");
    try {
        if (type === 'absensi') {
            await downloadAllAttendance(db);
        } else if (type === 'nilai') {
            await downloadAllGrades(db);
        }
        toast.success("Laporan berhasil diunduh!", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Gagal: " + error.message, { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  // --- LOGIKA STORAGE & BACKUP ---
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

  const handleDownload = async () => {
    setLoading(true);
    const toastId = toast.loading("Menyiapkan file backup...");
    try {
      const jsonString = await dataService.exportData();
      const fileName = `BACKUP_GURU_${new Date().toISOString().slice(0,10)}.json`;
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = fileName;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      toast.success("Backup disimpan!", { id: toastId });
    } catch (error) { toast.error("Gagal Backup: " + error.message, { id: toastId }); } 
    finally { setLoading(false); }
  };

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
        // Fallback info untuk Dev Mode / Browser Incompatible
        toast.error("Share tidak didukung browser ini. Gunakan tombol 'Simpan File'.", { id: toastId, duration: 4000 });
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error("Gagal Share: " + error.message, { id: toastId });
      else toast.dismiss(toastId);
    } finally { setLoading(false); }
  };

  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setModal({
        isOpen: true, title: "Timpa Data?", message: "Data lama akan ditimpa dengan data backup ini.", isDanger: true,
        onConfirm: () => processRestore(file)
    });
  };

  const processRestore = (file) => {
    setLoading(true);
    const toastId = toast.loading("Memproses restore...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await dataService.importData(event.target.result);
        toast.success("Berhasil dipulihkan!", { id: toastId });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) { toast.error("Gagal: " + error.message, { id: toastId }); setLoading(false); } 
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <ConfirmModal 
        isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})}
        onConfirm={modal.onConfirm} title={modal.title} message={modal.message} isDanger={modal.isDanger}
      />

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan</h1>

      {/* SECTION 1: STORAGE STATUS */}
      <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${isPersisted ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {isPersisted ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
        <div>
          <h3 className="font-bold text-sm">{isPersisted ? 'Database Aman (Persisted)' : 'Mode Penyimpanan Sementara'}</h3>
          <p className="text-xs mt-1">{isPersisted ? "Data aman dari pembersihan otomatis." : "Data berisiko hilang jika memori penuh."}</p>
        </div>
      </div>

      {/* SECTION 2: NOTIFIKASI */}
      <section className="mb-6 space-y-4">
         <h2 className="font-bold text-slate-700 flex items-center gap-2"><Bell size={18}/> Notifikasi</h2>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notifEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    {notifEnabled ? <Bell size={20}/> : <BellOff size={20}/>}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Pengingat Jadwal</h3>
                    <p className="text-xs text-slate-500">
                        {notifPermission === 'granted' ? "Alarm aktif saat jam pelajaran." : "Izin browser diperlukan."}
                    </p>
                </div>
            </div>
            <button onClick={toggleNotification} className={`w-12 h-6 rounded-full transition-colors relative ${notifEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
         </div>
      </section>

      {/* SECTION 3: EKSPOR LAPORAN (BARU) */}
      <section className="mb-6 space-y-4">
         <h2 className="font-bold text-slate-700 flex items-center gap-2"><FileSpreadsheet size={18}/> Ekspor Laporan</h2>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleExportReport('absensi')} disabled={loading} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition text-left shadow-sm group">
                <div className="mb-2 p-2 bg-emerald-100 text-emerald-600 rounded-lg w-fit group-hover:scale-110 transition-transform"><Download size={20}/></div>
                <h3 className="font-bold text-sm text-slate-800 group-hover:text-emerald-800">Rekap Absensi</h3>
                <p className="text-[10px] text-slate-400 mt-1">Semua kelas (Semester ini)</p>
            </button>

            <button onClick={() => handleExportReport('nilai')} disabled={loading} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition text-left shadow-sm group">
                <div className="mb-2 p-2 bg-blue-100 text-blue-600 rounded-lg w-fit group-hover:scale-110 transition-transform"><Download size={20}/></div>
                <h3 className="font-bold text-sm text-slate-800 group-hover:text-blue-800">Rekap Nilai</h3>
                <p className="text-[10px] text-slate-400 mt-1">Semua kelas & mapel</p>
            </button>
         </div>
      </section>

      {/* SECTION 4: MANAJEMEN DATA */}
      <section className="space-y-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2"><Database size={18}/> Backup & Restore</h2>
        
        {/* Backup Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><Download size={24}/></div>
                <div><h3 className="font-bold text-slate-800">Backup Data</h3><p className="text-xs text-slate-500">Simpan data JSON</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDownload} disabled={loading} className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-100">
                    <Save size={20}/><span className="text-xs">Simpan File</span>
                </button>
                <button onClick={handleShare} disabled={loading} className="flex flex-col items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">
                    <Share2 size={20}/><span className="text-xs">Bagikan (WA)</span>
                </button>
            </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center"><Upload size={24}/></div>
                <div><h3 className="font-bold text-slate-800">Restore Data</h3><p className="text-xs text-slate-500">Pulihkan dari JSON</p></div>
            </div>
            <input type="file" accept=".json" ref={fileInputRef} onChange={onFileSelected} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} disabled={loading} className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-bold hover:bg-slate-50">
                {loading ? 'Sedang Memproses...' : 'Pilih File Backup (.json)'}
            </button>
        </div>
      </section>

      <div className="mt-8 text-center"><p className="text-[10px] text-slate-300 font-mono">Build v1.1.0 (Full Features)</p></div>
    </div>
  );
};

export default PengaturanPage;