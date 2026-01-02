// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Users, BookOpen, Settings, Activity, TrendingUp, 
  BarChart2, Lightbulb, Youtube, Bot, ChevronRight,
  Calendar, Clock, Coffee, CheckCircle, AlertCircle
} from 'lucide-react';

// --- 1. DEFINISI JAM PELAJARAN (LOGIKA LAMA) ---
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
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Cikgu');

  // Lazy Init Date (Solusi Error setState)
  const [dateInfo] = useState(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return {
      fullDate: now.toLocaleDateString('id-ID', options),
      dayName: now.toLocaleDateString('id-ID', { weekday: 'long' }),
      isoDate: now.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const setting = await db.settings.get('teacherName');
        if (setting && setting.value) setUserName(setting.value);
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, []);

  // --- MENU ITEMS (VISUAL BARU) ---
  const menuItems = [
    { id: 'kelas', label: 'Data Kelas & Siswa', icon: <Users size={24} />, path: '/kelas', color: 'bg-blue-100 text-blue-600' },
    { id: 'rencana', label: 'Rencana Pembelajaran', icon: <BookOpen size={24} />, path: '/rencana-ajar', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'monitoring', label: 'Monitoring Perilaku', icon: <Activity size={24} />, path: '/monitoring', color: 'bg-rose-100 text-rose-600', isComingSoon: true },
    { id: 'perkembangan_kelas', label: 'Perkembangan Kelas', icon: <TrendingUp size={24} />, path: '/perkembangan-kelas', color: 'bg-teal-100 text-teal-600', isComingSoon: true },
    { id: 'perkembangan_siswa', label: 'Perkembangan Siswa', icon: <Users size={24} />, path: '/perkembangan-siswa', color: 'bg-emerald-100 text-emerald-600', isComingSoon: true },
    { id: 'statistik', label: 'Statistik Data', icon: <BarChart2 size={24} />, path: '/statistik', color: 'bg-amber-100 text-amber-600' },
    { id: 'ide', label: 'Ide Mengajar', icon: <Lightbulb size={24} />, path: '/ide', color: 'bg-yellow-100 text-yellow-600'},
    { id: 'inspirasi', label: 'Sumber Inspirasi', icon: <Youtube size={24} />, path: '/inspirasi', color: 'bg-red-100 text-red-600', isComingSoon: true },
    { id: 'guru_ai', label: 'Guru AI', icon: <Bot size={24} />, path: '/ai', color: 'bg-purple-100 text-purple-600', isComingSoon: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER AREA */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-slate-500 text-xs mb-1">{dateInfo.fullDate}</p>
            <h1 className="text-2xl font-bold text-slate-800">Halo, {userName}</h1>
          </div>
          <button onClick={() => navigate('/pengaturan')} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition">
            <Settings size={20} />
          </button>
        </div>

        {/* JADWAL SECTION (LOGIKA LAMA + TAMPILAN BARU) */}
        <JadwalSection dayName={dateInfo.dayName} todayISO={dateInfo.isoDate} />
      </div>

      {/* MENU GRID */}
      <div className="px-6">
        <h2 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Menu Utama</h2>
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => !item.isComingSoon && navigate(item.path)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center text-center gap-3 relative overflow-hidden"
            >
              {item.isComingSoon && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-200" />}
              <div className={`p-3 rounded-xl ${item.color}`}>{item.icon}</div>
              <span className="text-xs font-bold text-slate-700 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN JADWAL CERDAS (LOGIKA LAMA DIKEMBALIKAN) ---
const JadwalSection = ({ dayName, todayISO }) => {
  const [now, setNow] = useState(new Date());

  // Update waktu tiap menit (untuk status Sedang Mengajar)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // QUERY JADWAL & STATUS (LOGIKA LAMA)
  const smartSchedule = useLiveQuery(async () => {
    const settings = await db.settings.get('mySchedule');
    const allSchedules = settings?.value || [];
    
    // 1. Filter hari ini
    const todaySchedules = allSchedules.filter(s => s.day === dayName);

    // 2. Hitung Status & Waktu
    const enriched = await Promise.all(todaySchedules.map(async (item) => {
      const isFriday = dayName === 'Jumat';
      const map = isFriday ? TIME_MAPPING.JUMAT : TIME_MAPPING.NORMAL;
      
      const startTimeStr = map[item.startPeriod]?.start || '00:00';
      const endTimeStr = map[item.endPeriod]?.end || '23:59';

      const startTime = new Date(`${todayISO}T${startTimeStr}:00`);
      const endTime = new Date(`${todayISO}T${endTimeStr}:00`);
      
      // Cek apakah sudah absen / nilai
      const journalExists = await db.journals.where({ date: todayISO, classId: item.classId }).count() > 0;
      
      let status = 'upcoming'; // upcoming, active, done
      if (now < startTime) status = 'upcoming';
      else if (now >= startTime && now <= endTime) status = 'active';
      else status = 'done';

      return { ...item, startTimeStr, endTimeStr, status, isJournalDone: journalExists };
    }));

    // Sort berdasarkan jam
    return enriched.sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr));
  }, [now, dayName, todayISO]) || [];

  // --- RENDERING TAMPILAN BARU ---

  // KASUS 1: HARI MINGGU (Tampilan Libur Cantik)
  if (dayName === 'Minggu') {
    return (
      <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-orange-300 opacity-30 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
               <Coffee size={28} className="text-white" />
            </div>
            <h2 className="font-bold text-xl">Selamat Hari Minggu!</h2>
            <p className="text-orange-100 text-sm mt-1 max-w-[200px]">
              Lepaskan penat, nikmati kopi Anda. Tidak ada jadwal hari ini.
            </p>
        </div>
      </div>
    );
  }

  // KASUS 2: TIDAK ADA JADWAL (Hari Kerja tapi Kosong)
  if (smartSchedule.length === 0) {
    return (
      <div className="bg-slate-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
               <Calendar size={24} />
            </div>
            <h2 className="font-bold text-lg">Tidak Ada Jadwal</h2>
            <p className="text-slate-300 text-xs mt-1">
              Hari {dayName} ini kosong. Gunakan untuk administrasi atau istirahat.
            </p>
        </div>
      </div>
    );
  }

  // KASUS 3: ADA JADWAL (Tampilan Fokus Baru)
  return (
    <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Dekorasi Background */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-indigo-400 opacity-20 rounded-full blur-xl"></div>

      {/* Header Kecil */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Clock size={18} /> Jadwal {dayName}
        </h2>
        {/* Jam Digital Realtime */}
        <span className="text-xs font-mono bg-indigo-500/50 px-2 py-1 rounded-lg border border-indigo-400/30">
           {now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
        </span>
      </div>

      {/* List Jadwal */}
      <div className="space-y-3 relative z-10">
        {smartSchedule.map((item, idx) => {
            // Tentukan Style berdasarkan Status (Logic Lama, Visual Baru)
            let itemBg = 'bg-white/10 border-white/10'; // Default (Upcoming)
            let icon = <span className="text-xs font-bold text-indigo-100">{item.startPeriod}</span>;
            let statusText = `${item.startTimeStr} - ${item.endTimeStr}`;
            
            if (item.status === 'active') {
                itemBg = 'bg-white/25 border-white/40 ring-1 ring-white/50'; // Sedang Mengajar (Highlight)
                statusText = 'Sedang Berlangsung';
                icon = <Activity size={16} className="text-white animate-pulse" />;
            } else if (item.status === 'done') {
                itemBg = 'bg-indigo-800/50 border-indigo-700/50 opacity-60'; // Selesai (Dimmed)
                icon = <CheckCircle size={16} className="text-emerald-300" />;
            }

            return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${itemBg}`}>
                   {/* Kolom Waktu / Ikon */}
                   <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                     {icon}
                   </div>
                   
                   {/* Info Kelas */}
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm truncate pr-2">{item.className}</h3>
                        {item.isJournalDone && (
                            <span className="text-[10px] bg-emerald-500/80 px-1.5 py-0.5 rounded text-white font-medium flex items-center gap-1">
                                <CheckCircle size={8}/> Absen
                            </span>
                        )}
                     </div>
                     <p className="text-xs text-indigo-100 truncate">{statusText}</p>
                   </div>
                </div>
            );
        })}
        
        <div className="text-center mt-2 pt-1">
             <button className="text-[10px] text-indigo-200 hover:text-white flex items-center justify-center gap-1 w-full opacity-70">
                Lihat Selengkapnya <ChevronRight size={10}/>
             </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;