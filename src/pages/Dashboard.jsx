// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Calendar, Users, Book, Settings, ChevronRight, 
  ClipboardCheck, GraduationCap, Clock, Coffee 
} from 'lucide-react'; // Tambahkan 'Coffee'

// --- DEFINISI JAM PELAJARAN (JANGAN DIUBAH) ---
const TIME_MAPPING = {
  NORMAL: {
    'I':   { start: '07:30', end: '08:10' },
    'II':  { start: '08:10', end: '08:50' },
    'III': { start: '08:50', end: '09:30' },
    'IV':  { start: '09:30', end: '10:10' },
    'V':   { start: '10:40', end: '11:20' },
    'VI':  { start: '11:20', end: '12:00' },
    'VII': { start: '12:00', end: '12:40' },
    'VIII':{ start: '12:40', end: '13:20' },
  },
  JUMAT: {
    'I':   { start: '07:30', end: '08:10' },
    'II':  { start: '08:10', end: '08:50' },
    'III': { start: '08:50', end: '09:30' },
    'IV':  { start: '09:30', end: '10:10' },
    'V':   { start: '10:40', end: '11:20' },
    'VI':  { start: '11:20', end: '12:00' },
  }
};

const Dashboard = () => {
  // 1. Waktu Real-time
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const todayDate = new Date();
  const todayString = todayDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const dayName = todayDate.toLocaleDateString('id-ID', { weekday: 'long' }); // Senin, Selasa... Minggu
  const todayISO = todayDate.toISOString().split('T')[0];

  // --- STATISTIK ---
  const studentCount = useLiveQuery(() => db.students.count()) || 0;
  const journalCount = useLiveQuery(() => db.journals.count()) || 0;

  // --- QUERY NAMA GURU ---
  const teacherName = useLiveQuery(async () => {
    const profile = await db.settings.get('teacherName');
    return profile?.value || 'Cikgu';
  }, []) || 'Cikgu';
  const greetingName = teacherName.split(' ')[0];

  // --- LOGIKA UTAMA: JADWAL CERDAS ---
  const smartSchedule = useLiveQuery(async () => {
    const settings = await db.settings.get('mySchedule');
    const allSchedules = settings?.value || [];
    
    // Filter Jadwal HANYA Hari Ini
    const todaySchedules = allSchedules.filter(s => s.day === dayName);

    const enriched = await Promise.all(todaySchedules.map(async (item) => {
      const isFriday = dayName === 'Jumat';
      const map = isFriday ? TIME_MAPPING.JUMAT : TIME_MAPPING.NORMAL;
      
      const startTimeStr = map[item.startPeriod]?.start || '00:00';
      const endTimeStr = map[item.endPeriod]?.end || '23:59';

      const startTime = new Date(`${todayISO}T${startTimeStr}:00`);
      const endTime = new Date(`${todayISO}T${endTimeStr}:00`);
      
      const journalExists = await db.journals.where({ date: todayISO, classId: item.classId }).count() > 0;
      const assessmentExists = await db.assessments_meta.where({ date: todayISO, classId: item.classId }).count() > 0;

      let baseStatus = '';
      let colorClass = '';
      
      if (now < startTime) {
        baseStatus = 'Belum Mengajar';
        colorClass = 'text-slate-400 bg-slate-100';
      } else if (now >= startTime && now <= endTime) {
        baseStatus = 'Sedang Mengajar';
        colorClass = 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse';
      } else {
        baseStatus = 'Selesai';
        colorClass = 'text-green-600 bg-green-50 border-green-200';
      }

      return {
        ...item,
        startTimeStr,
        endTimeStr,
        isJournalDone: journalExists,
        isAssessmentDone: assessmentExists,
        baseStatus,
        colorClass
      };
    }));

    return enriched.sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr));
  }, [now]) || [];

  
  // --- HELPER RENDER STATUS ---
  const renderStatusBadge = (item) => {
    if (item.baseStatus === 'Belum Mengajar') {
      return <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${item.colorClass}`}>{item.baseStatus}</span>;
    }

    let details = [];
    if (item.isJournalDone) details.push('Absen ✅');
    if (item.isAssessmentDone) details.push('Latihan ✅');

    return (
        <div className={`flex flex-col items-start px-3 py-1.5 rounded-lg border ${item.colorClass}`}>
            <span className="text-[10px] font-bold uppercase tracking-wide">
                {item.baseStatus}
            </span>
            {(details.length > 0 || item.baseStatus === 'Sedang Mengajar') && (
                <span className="text-[10px] font-semibold mt-0.5">
                    {details.length > 0 ? details.join(' & ') : '(Belum input data)'}
                </span>
            )}
        </div>
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-md mx-auto pb-24">
      
      {/* HEADER */}
      <header>
        <p className="text-slate-400 text-sm font-medium mb-1">{todayString}</p>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Halo, <span className="text-teal-600">{greetingName}!</span> 👋
        </h1>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
          Siap mencatat perkembangan siswa hari ini?
        </p>
      </header>

      {/* STATISTIK */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50/50 p-5 rounded-3xl border border-teal-100/50 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-teal-100 w-20 h-20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <Book className="text-teal-600 relative z-10" size={24} />
          <div className="relative z-10">
            <p className="text-2xl font-bold text-slate-800">{journalCount}</p>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mt-1">Total Jurnal</p>
          </div>
        </div>
        <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50 flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 bg-indigo-100 w-20 h-20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <Users className="text-indigo-600 relative z-10" size={24} />
          <div className="relative z-10">
             <p className="text-2xl font-bold text-slate-800">{studentCount}</p>
             <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-1">Siswa Aktif</p>
          </div>
        </div>
      </section>

      {/* MENU UTAMA */}
      <section className="mt-2">
        <h2 className="font-bold text-slate-800 mb-3 text-lg">Menu Utama</h2>
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 space-y-1">
          <Link to="/absensi" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600"><ClipboardCheck size={20} /></div>
            <div className="flex-1"><h3 className="font-bold text-slate-700 text-sm">Absensi Siswa</h3><p className="text-xs text-slate-400">Catat kehadiran harian</p></div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
          <Link to="/nilai" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><GraduationCap size={20} /></div>
            <div className="flex-1"><h3 className="font-bold text-slate-700 text-sm">Buku Nilai</h3><p className="text-xs text-slate-400">Input nilai UH, Tugas, UTS</p></div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
          <Link to="/kelas" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><Users size={20} /></div>
            <div className="flex-1"><h3 className="font-bold text-slate-700 text-sm">Data Kelas & Siswa</h3><p className="text-xs text-slate-400">Input siswa, import Excel</p></div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
          <Link to="/rencana-ajar" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600"><Book size={20} /></div>
            <div className="flex-1"><h3 className="font-bold text-slate-700 text-sm">Bank Materi (RPP)</h3><p className="text-xs text-slate-400">Atur silabus & tujuan</p></div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
          <Link to="/pengaturan" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Settings size={20} /></div>
              <div className="flex-1"><h3 className="font-bold text-slate-700 text-sm">Pengaturan & Backup</h3><p className="text-xs text-slate-400">Amankan data Anda</p></div>
              <ChevronRight size={18} className="text-slate-300" />
          </Link>
        </div>
      </section>

      {/* JADWAL MENGAJAR HARI INI */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">Jadwal Hari Ini</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${dayName === 'Minggu' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                    {dayName}
                </span>
            </div>
            {smartSchedule.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={12}/>
                    <span>{now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            )}
        </div>
        
        {smartSchedule.length === 0 ? (
            /* --- LOGIKA BARU: TAMPILAN KOSONG VS MINGGU --- */
            dayName === 'Minggu' ? (
                // 1. Tampilan Khusus Hari Minggu
                <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl text-center shadow-sm">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-500">
                        <Coffee size={24} />
                    </div>
                    <p className="text-slate-700 font-bold">Hari Minggu!</p>
                    <p className="text-slate-500 text-xs mt-1">Tidak ada jadwal, nikmati libur Anda.</p>
                </div>
            ) : (
                // 2. Tampilan Kosong Biasa (Hari Kerja tapi belum isi jadwal)
                <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Calendar size={20} />
                    </div>
                    <p className="text-slate-600 font-medium">Tidak ada jadwal</p>
                    <p className="text-slate-400 text-xs mt-1">Pastikan Anda sudah mengatur jadwal di menu Profil.</p>
                    <Link to="/profil" className="inline-block mt-4 text-xs font-bold text-indigo-600 hover:underline">
                        Atur Jadwal Disini &rarr;
                    </Link>
                </div>
            )
        ) : (
            // 3. Tampilan Ada Jadwal
            <div className="space-y-3">
                {smartSchedule.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                        {/* Waktu */}
                        <div className="flex flex-col items-center justify-center w-14 shrink-0 border-r border-slate-100 pr-4">
                            <span className="text-xs font-bold text-slate-800">{item.startTimeStr}</span>
                            <span className="text-[10px] text-slate-400 my-1">-</span>
                            <span className="text-xs font-bold text-slate-400">{item.endTimeStr}</span>
                        </div>

                        {/* Info Kelas & Status */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm truncate">{item.className}</h3>
                                    <p className="text-xs text-slate-500">Jam Ke {item.startPeriod} - {item.endPeriod}</p>
                                </div>
                                {/* STATUS BADGE */}
                                {renderStatusBadge(item)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

    </div>
  );
};

export default Dashboard;