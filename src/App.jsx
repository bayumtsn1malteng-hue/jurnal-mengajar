// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// react-hot-toast dimatikan, coba sonner dulu.
// import { Toaster, toast } from 'react-hot-toast';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { restoreFromCloud } from './services/backupService'; // Import fungsi restore
import { DownloadCloud } from 'lucide-react';

// Pages & Layouts (Import Lama)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import Kelas from './pages/Kelas';
import KelasDetail from './pages/KelasDetail';
import Profil from './pages/Profil';
import RencanaAjar from './pages/RencanaAjar';
import AbsensiPage from './pages/AbsensiPage';
import NilaiPage from './pages/NilaiPage';
import PengaturanPage from './pages/PengaturanPage';
import JurnalPage from './pages/JurnalPage';
import StatistikPage from './pages/StatistikPage';
import IdeMengajarPage from './pages/IdeMengajarPage';
import MonitoringPage from './pages/MonitoringPage';

// KOMPONEN PEMBANTU: Auto Restore Handler
const AutoRestoreHandler = () => {
  const { autoRestoreCandidate, clearAutoRestore } = useAuth();

  useEffect(() => {
    if (autoRestoreCandidate) {
      // Munculkan Toast Custom yang "Sticky" (Persistent)
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-indigo-100 ring-1 ring-black/5`}>
          <div className="p-4 bg-indigo-50 rounded-t-2xl border-b border-indigo-100 flex items-center gap-3">
             <DownloadCloud className="text-indigo-600" size={24} />
             <div>
               <h3 className="font-bold text-indigo-900">Ditemukan Cadangan Data!</h3>
               <p className="text-xs text-indigo-700">Tanggal: {new Date(autoRestoreCandidate.createdTime).toLocaleDateString()}</p>
             </div>
          </div>
          <div className="p-4">
             <p className="text-sm text-slate-600 mb-4">
               Aplikasi ini kosong, tapi ada data tersimpan di Google Drive Anda. Apakah Anda ingin memulihkannya?
             </p>
             <div className="flex gap-2">
                <button 
                  onClick={() => {
                     toast.dismiss(t.id);
                     clearAutoRestore();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200"
                >
                  Nanti Saja
                </button>
                <button 
                  onClick={async () => {
                     toast.dismiss(t.id);
                     const loadId = toast.loading("Memulihkan data...");
                     try {
                        await restoreFromCloud(autoRestoreCandidate.id);
                        toast.success("Berhasil! Memuat ulang...", { id: loadId });
                        clearAutoRestore();
                        setTimeout(() => window.location.reload(), 2000);
                     } catch (e) {
                        toast.error("Gagal: " + e.message, { id: loadId });
                     }
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  Ya, Pulihkan
                </button>
             </div>
          </div>
        </div>
      ), { duration: Infinity, position: 'bottom-center' }); // Sticky toast
    }
  }, [autoRestoreCandidate, clearAutoRestore]);

  return null; // Komponen ini tidak me-render apa pun di DOM
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Komponen Toaster diganti dengan Sonner */}
        {/*<Toaster position="top-center" />*/}
        <Toaster position='top-center' richColors />
        <AutoRestoreHandler /> {/* Pasang Handler di sini */}
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kelas" element={<Kelas />}/>
            <Route path="/kelas/:id" element={<KelasDetail />} />
            <Route path="/nilai" element={<NilaiPage />} />
            <Route path="/pengaturan" element={<PengaturanPage />} />
            <Route path="/jurnal" element={<JurnalPage />} />
            <Route path="/absensi" element={<AbsensiPage />}/>
            <Route path="/rencana-ajar" element={<RencanaAjar />}/>
            <Route path="/profil" element={<Profil />} />
            <Route path="/statistik" element={<StatistikPage />} />
            <Route path="/ide" element={<IdeMengajarPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;