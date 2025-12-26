// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Login (Berdiri Sendiri) */}
        <Route path="/login" element={<Login />} />

        {/* Halaman Dalam (Pakai Menu Bawah) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path= "/kelas" element={<Kelas />}/>
          <Route path= "/kelas/:id" element={<KelasDetail />} />
          <Route path= "/nilai" element={<NilaiPage />} />
          <Route path="/pengaturan" element={<PengaturanPage />} />
          <Route path="/jurnal" element={<div className="p-6">Halaman Jurnal (Segera)</div>} />
          <Route path="/absensi" element={<AbsensiPage />}/>
          <Route path="/rencana-ajar" element={<RencanaAjar />}/>
          <Route path="/profil" element={<Profil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;