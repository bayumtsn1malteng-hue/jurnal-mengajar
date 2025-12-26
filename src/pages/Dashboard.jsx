// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// Tambahkan 'GraduationCap' untuk ikon Nilai
import { Calendar, Users, Book, Settings, ChevronRight, ClipboardCheck, GraduationCap } from 'lucide-react'; 

const Dashboard = () => {
  // Tanggal dummy
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-6 space-y-8 max-w-md mx-auto pb-24">
      
      {/* Header Section */}
      <header>
        <p className="text-slate-400 text-sm font-medium mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Halo, <span className="text-teal-600">Cikgu!</span> 👋
        </h1>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
          Siap mencatat perkembangan siswa hari ini?
        </p>
      </header>

      {/* Statistik Grid */}
      <section className="grid grid-cols-2 gap-4">
        {/* Card 1: Jurnal */}
        <div className="bg-teal-50/50 p-5 rounded-3xl border border-teal-100/50 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-teal-100 w-20 h-20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <Book className="text-teal-600 relative z-10" size={24} />
          <div className="relative z-10">
            <p className="text-2xl font-bold text-slate-800">0</p>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mt-1">Jurnal Ajar</p>
          </div>
        </div>

        {/* Card 2: Siswa */}
        <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50 flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 bg-indigo-100 w-20 h-20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <Users className="text-indigo-600 relative z-10" size={24} />
          <div className="relative z-10">
             <p className="text-2xl font-bold text-slate-800">0</p>
             <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-1">Siswa Aktif</p>
          </div>
        </div>
      </section>

      {/* MENU CEPAT */}
      <section className="mt-2">
        <h2 className="font-bold text-slate-800 mb-3 text-lg">Menu Utama</h2>
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 space-y-1">
          
          {/* 1. Menu ABSENSI */}
          <Link to="/absensi" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <ClipboardCheck size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-700 text-sm">Absensi Siswa</h3>
              <p className="text-xs text-slate-400">Catat kehadiran harian</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          {/* 2. Menu BUKU NILAI (BARU DITAMBAHKAN) */}
          <Link to="/nilai" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <GraduationCap size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-700 text-sm">Buku Nilai</h3>
              <p className="text-xs text-slate-400">Input nilai UH, Tugas, UTS</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          {/* 3. Menu Data Kelas */}
          <Link to="/kelas" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-700 text-sm">Data Kelas & Siswa</h3>
              <p className="text-xs text-slate-400">Input siswa, import Excel</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          {/* 4. Menu RPP */}
          <Link to="/rencana-ajar" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
              <Book size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-700 text-sm">Bank Materi (RPP)</h3>
              <p className="text-xs text-slate-400">Atur silabus & tujuan</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          {/* 5. Pengaturan (SUDAH DIAKTIFKAN) */}
          <Link to="/pengaturan" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <Settings size={20} />
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-slate-700 text-sm">Pengaturan & Backup</h3>
                  <p className="text-xs text-slate-400">Amankan data Anda</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
          </Link>

        </div>
      </section>

      {/* Empty State / Jadwal Placeholder */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Jadwal Hari Ini</h2>
            <button className="text-xs text-teal-600 font-semibold">Lihat Semua</button>
        </div>
        
        <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Calendar size={20} />
            </div>
            <p className="text-slate-600 font-medium">Tidak ada jadwal</p>
            <p className="text-slate-400 text-xs mt-1">Nikmati hari libur Anda!</p>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;