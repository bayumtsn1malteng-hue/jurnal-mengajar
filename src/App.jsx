// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { restoreFromCloudFile, checkCloudForSyncFile } from './services/backupService'; // Import fungsi baru
import { DownloadCloud } from 'lucide-react';

// IMPORT AUTO SYNC BARU
import AutoSyncHandler from './components/AutoSyncHandler';

// ... (Import Pages lainnya tetap sama) ...
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

// Update AutoRestoreHandler untuk mencari Single File
const AutoRestoreHandler = () => {
  const { isAuthenticated } = useAuth(); // Ambil status auth saja
  const [foundFile, setFoundFile] = React.useState(null);

  useEffect(() => {
     const check = async () => {
         if(isAuthenticated) {
             const file = await checkCloudForSyncFile();
             if(file) setFoundFile(file);
         }
     };
     check();
  }, [isAuthenticated]);

  useEffect(() => {
    if (foundFile) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-indigo-100 ring-1 ring-black/5`}>
          <div className="p-4 bg-indigo-50 rounded-t-2xl border-b border-indigo-100 flex items-center gap-3">
             <DownloadCloud className="text-indigo-600" size={24} />
             <div>
               <h3 className="font-bold text-indigo-900">Sinkronisasi Cloud</h3>
               <p className="text-xs text-indigo-700">Ada data di cloud ({new Date(foundFile.modifiedTime).toLocaleDateString()}).</p>
             </div>
          </div>
          <div className="p-4">
             <p className="text-sm text-slate-600 mb-4">
               Ingin menyamakan data perangkat ini dengan Cloud?
             </p>
             <div className="flex gap-2">
                <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200">
                  Abaikan
                </button>
                <button 
                  onClick={async () => {
                     toast.dismiss(t.id);
                     const loadId = toast.loading("Sinkronisasi...");
                     try {
                        await restoreFromCloudFile(foundFile.id);
                        toast.success("Data Tersinkronisasi!", { id: loadId });
                        setTimeout(() => window.location.reload(), 1500);
                     } catch (e) {
                        toast.error("Gagal: " + e.message, { id: loadId });
                     }
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 shadow-lg"
                >
                  Sync Sekarang
                </button>
             </div>
          </div>
        </div>
      ), { duration: Infinity, position: 'bottom-center' });
    }
  }, [foundFile]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        
        {/* PASANG KOMPONEN LOGIC DI SINI */}
        <AutoSyncHandler />
        <AutoRestoreHandler />
        
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;