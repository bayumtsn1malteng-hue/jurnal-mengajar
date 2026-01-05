// src/pages/PengaturanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, Cloud, Save, Database, User, RefreshCw, 
  DownloadCloud, Loader2, Clock, Smartphone, FileJson, Upload, CalendarClock 
} from 'lucide-react';
import { downloadAllAttendance, downloadAllGrades } from '../utils/excelGenerator';
import { db } from '../db';
import toast from 'react-hot-toast';

import { 
  performCloudBackup, getAvailableBackups, restoreFromCloud, getLastBackupMetadata,
  downloadLocalBackup, restoreFromLocalFile 
} from '../services/backupService';

const PengaturanPage = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  
  // State UI
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupList, setBackupList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  // STATE BARU: Frekuensi Backup
  const [backupFreq, setBackupFreq] = useState('manual'); // manual, daily, weekly

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load setting frekuensi dari localStorage
    const savedFreq = localStorage.getItem('backup_frequency') || 'manual';
    setBackupFreq(savedFreq);

    if (isAuthenticated) {
        getLastBackupMetadata().then(data => setLastBackup(data));
    }
  }, [isAuthenticated]);

  // Handler Ganti Frekuensi
  const handleFreqChange = (e) => {
      const val = e.target.value;
      setBackupFreq(val);
      localStorage.setItem('backup_frequency', val);
      toast.success(`Frekuensi backup diubah: ${val === 'daily' ? 'Harian' : val === 'weekly' ? 'Mingguan' : 'Manual'}`);
  };

  // --- HANDLER CLOUD ---
  const handleCloudBackup = async () => {
    if(!confirm("Buat cadangan data ke Google Drive?")) return;
    setIsBackingUp(true);
    const toastId = toast.loading("Mengunggah ke Drive...");
    try {
        await performCloudBackup();
        toast.success("Backup Cloud Sukses!", { id: toastId });
        setLastBackup(await getLastBackupMetadata());
    } catch (e) {
        let errorMsg = e.message || "Terjadi kesalahan";
        if(e.result?.error?.message) errorMsg = e.result.error.message;
        toast.error("Gagal: " + errorMsg, { id: toastId });
    } finally {
        setIsBackingUp(false);
    }
  };

  const openCloudRestore = async () => {
      setIsLoadingList(true);
      const toastId = toast.loading("Mencari cadangan...");
      try {
          const files = await getAvailableBackups();
          setBackupList(files);
          toast.dismiss(toastId);
          if(files.length === 0) toast("Tidak ada file backup di Drive.", { icon: '📂' });
          else setShowRestoreModal(true);
      } catch (e) {
          toast.error("Gagal koneksi Drive: " + e.message, { id: toastId });
      } finally {
          setIsLoadingList(false);
      }
  };

  const handleCloudRestoreProcess = async (fileId) => {
      if(!confirm("⚠️ PERINGATAN: Data di HP ini akan DITIMPA dengan data dari Cloud. Lanjutkan?")) return;
      setIsRestoring(true);
      const toastId = toast.loading("Memulihkan dari Cloud...");
      try {
          await restoreFromCloud(fileId);
          toast.success("Data Cloud berhasil dipulihkan!", { id: toastId });
          setShowRestoreModal(false);
          setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
          toast.error("Gagal restore: " + e.message, { id: toastId });
      } finally {
          setIsRestoring(false);
      }
  };

  // --- HANDLER LOCAL ---
  const handleLocalBackup = async () => {
    const toastId = toast.loading("Membuat file backup...");
    try {
        await downloadLocalBackup();
        toast.success("File backup tersimpan di HP!", { id: toastId });
    } catch (e) {
        toast.error("Gagal backup lokal: " + e.message, { id: toastId });
    }
  };

  const triggerLocalRestore = () => fileInputRef.current.click();

  const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if(!confirm(`⚠️ PERINGATAN: Data akan DITIMPA dengan isi file "${file.name}". Lanjutkan?`)) {
          event.target.value = null; return;
      }
      const toastId = toast.loading("Membaca file backup...");
      try {
          await restoreFromLocalFile(file);
          toast.success("Data berhasil dipulihkan!", { id: toastId });
          setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
          toast.error("Gagal restore: " + e.message, { id: toastId });
      } finally {
          event.target.value = null;
      }
  };

  const handleDownloadAbsen = async () => {
    try { await downloadAllAttendance(db); toast.success("Download Absensi Berhasil!"); } 
    catch (e) { toast.error(e.message); }
  };
  const handleDownloadNilai = async () => {
    try { await downloadAllGrades(db); toast.success("Download Nilai Berhasil!"); } 
    catch (e) { toast.error(e.message); }
  };

  const formatTime = (iso) => {
      if(!iso) return '-';
      return new Date(iso).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
  };

  return (
    <div className="p-6 pb-24 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan</h1>

      {/* SECTION 1: CLOUD SYNC */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-900">
          <Cloud size={20} className="text-indigo-500"/> Sinkronisasi Cloud
        </h2>

        {loading ? (
           <p className="text-slate-400 text-sm animate-pulse">Memuat status akun...</p>
        ) : isAuthenticated ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl">
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
              ) : (
                <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-slate-800 truncate">{user?.name}</h3>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={12} className="text-slate-400"/>
                    <p className="text-[10px] text-slate-500 font-medium">
                        Last Backup: <span className="font-bold text-indigo-600">{lastBackup ? formatTime(lastBackup.createdTime) : 'Belum pernah'}</span>
                    </p>
                </div>
              </div>
              <button onClick={logout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><LogOut size={20}/></button>
            </div>

            {/* OPSI FREKUENSI BACKUP (BARU) */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                    <CalendarClock size={18}/>
                    <span className="text-sm font-bold">Frekuensi Backup</span>
                </div>
                <select 
                    value={backupFreq} 
                    onChange={handleFreqChange}
                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                >
                    <option value="manual">Manual (Mati)</option>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCloudBackup} disabled={isBackingUp} className="p-4 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 rounded-2xl text-indigo-700 text-sm font-bold flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                 {isBackingUp ? <Loader2 size={24} className="animate-spin"/> : <Save size={24}/>}
                 {isBackingUp ? "Mengunggah..." : "Backup Cloud"}
              </button>
              <button onClick={openCloudRestore} disabled={isBackingUp} className="p-4 border border-blue-100 bg-blue-50/50 hover:bg-blue-100 rounded-2xl text-blue-700 text-sm font-bold flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                 {isLoadingList ? <Loader2 size={24} className="animate-spin"/> : <RefreshCw size={24}/>}
                 {isLoadingList ? "Memuat..." : "Restore Cloud"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
             <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300"><User size={32}/></div>
             <p className="text-sm text-slate-500 mb-4 px-4">Hubungkan akun Google untuk backup otomatis & aman.</p>
             <button onClick={login} className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
               <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" /> Sign in with Google
             </button>
          </div>
        )}
      </div>

      {/* SECTION 2: BACKUP LOCAL */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
          <Smartphone size={20} className="text-slate-500"/> Backup Offline (File)
        </h2>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        <div className="grid grid-cols-2 gap-3">
            <button onClick={handleLocalBackup} className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                <FileJson size={18}/> Download Backup
            </button>
            <button onClick={triggerLocalRestore} className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                <Upload size={18}/> Restore dari File
            </button>
        </div>
      </div>

      {/* SECTION 3: EXPORT EXCEL */}
       <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-lg mb-4 text-slate-800">Export Excel</h2>
        <div className="space-y-3">
          <button onClick={handleDownloadAbsen} className="w-full flex items-center justify-between p-4 bg-green-50 text-green-800 rounded-2xl hover:bg-green-100 transition-colors">
            <span className="font-bold text-sm">Download Rekap Absensi</span>
            <Database size={18} />
          </button>
          <button onClick={handleDownloadNilai} className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-800 rounded-2xl hover:bg-blue-100 transition-colors">
            <span className="font-bold text-sm">Download Rekap Nilai</span>
            <Database size={18} />
          </button>
        </div>
      </div>

      {/* MODAL RESTORE */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Pilih Cadangan Cloud</h3>
              {isRestoring ? (
                  <div className="py-12 text-center space-y-3">
                      <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto"/>
                      <p className="text-sm font-bold text-slate-600">Memulihkan data...</p>
                  </div>
              ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {backupList.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 cursor-pointer group"
                               onClick={() => handleCloudRestoreProcess(file.id)}>
                              <div>
                                  <p className="font-bold text-sm text-slate-700">{formatTime(file.createdTime)}</p>
                                  <p className="text-[10px] text-slate-400">Ukuran: {(parseInt(file.size)/1024).toFixed(1)} KB</p>
                              </div>
                              <DownloadCloud size={18} className="text-slate-300 group-hover:text-indigo-600"/>
                          </div>
                      ))}
                  </div>
              )}
              {!isRestoring && (
                  <button onClick={() => setShowRestoreModal(false)} className="mt-4 w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Batal</button>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default PengaturanPage;