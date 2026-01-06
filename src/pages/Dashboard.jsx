// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Users, BookOpen, Settings, Activity, TrendingUp, 
  BarChart2, Lightbulb, Youtube, Bot, ChevronRight,
  Calendar, Clock, Coffee, CheckCircle, AlertTriangle, Cloud, ArrowRight, CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalBackupTimestamp, performCloudBackup } from '../services/backupService';
import { toast } from 'sonner';
import { analyzeStudentRisk } from '../services/monitoringService';

// --- 1. DEFINISI JAM PELAJARAN (TETAP) ---
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
  // PERBAIKAN: Hapus 'user' dari sini karena tidak dipakai di layout ini
  const { isAuthenticated, loading } = useAuth(); 
  const [userName, setUserName] = useState('Cikgu');
  
  const schedulerRan = useRef(false);

  // --- STATE BARU: Monitoring Risk ---
  const [riskCount, setRiskCount] = useState(0);
  const students = useLiveQuery(() => db.students.toArray());

  // --- LOGIC SCHEDULER BACKUP ---
  useEffect(() => {
    const runScheduler = async () => {
        if (isAuthenticated && !schedulerRan.current) {
            schedulerRan.current = true;
            
            const freq = localStorage.getItem('backup_frequency') || 'manual';
            if (freq === 'manual') return;

            const lastBackupStr = getLocalBackupTimestamp();
            const now = new Date().getTime();
            const lastTime = lastBackupStr ? new Date(lastBackupStr).getTime() : 0;
            const diffHours = (now - lastTime) / (1000 * 60 * 60);
            
            let shouldBackup = false;
            if (freq === 'daily' && diffHours >= 24) shouldBackup = true;
            if (freq === 'weekly' && diffHours >= (24 * 7)) shouldBackup = true;

            if (shouldBackup) {
                console.log(`[Scheduler] Menjalankan backup otomatis (${freq})...`);
                try {
                    await performCloudBackup();
                    toast.success("Backup otomatis berhasil dijalankan.", { position: 'bottom-right', duration: 3000 });
                } catch (e) {
                    console.warn("[Scheduler] Gagal backup otomatis:", e);
                }
            }
        }
    };
    runScheduler();
  }, [isAuthenticated]);

  // --- LOGIC BARU: Hitung Risiko Siswa ---
  useEffect(() => {
    const countRisks = async () => {
      if (!students || students.length === 0) return;
      
      let count = 0;
      for (const s of students) {
        const analysis = await analyzeStudentRisk(s.id);
        if (analysis.level !== 'GREEN') {
          count++;
        }
      }
      setRiskCount(count);
    };

    countRisks();
  }, [students]);

  // Lazy Init Date
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

  const menuItems = [
    { id: 'kelas', label: 'Kelas & Siswa', icon: <Users size={22} />, path: '/kelas', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'rencana', label: 'Rencana Pembelajaran', icon: <BookOpen size={22} />, path: '/rencana-ajar', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { 
        id: 'monitoring', 
        label: 'Monitoring Perilaku', 
        icon: <Activity size={22} />, 
        path: '/monitoring', 
        color: 'bg-rose-100 text-rose-600', 
        badge: riskCount > 0 ? riskCount : null 
    },
    { id: 'perkembangan_kelas', label: 'Perkembangan Kelas', icon: <TrendingUp size={22} />, path: '/perkembangan-kelas', color: 'bg-teal-50 text-teal-600', isComingSoon: true },
    { id: 'perkembangan_siswa', label: 'Perkembangan Siswa', icon: <Users size={22} />, path: '/perkembangan-siswa', color: 'bg-emerald-50 text-emerald-600', isComingSoon: true },
    { id: 'statistik', label: 'Statistik Data', icon: <BarChart2 size={22} />, path: '/statistik', color: 'bg-amber-50 text-amber-600' },
    { id: 'ide', label: 'Ide Mengajar', icon: <Lightbulb size={22} />, path: '/ide', color: 'bg-yellow-50 text-yellow-600'},
    { id: 'inspirasi', label: 'Sumber Inspirasi', icon: <Youtube size={22} />, path: '/inspirasi', color: 'bg-red-50 text-red-600', isComingSoon: true },
    { id: 'guru_ai', label: 'Guru AI', icon: <Bot size={22} />, path: '/ai', color: 'bg-purple-50 text-purple-600', isComingSoon: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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
        <JadwalSection dayName={dateInfo.dayName} todayISO={dateInfo.isoDate} />
      </div>

      {!loading && (
        <div className="px-6 mb-6 animate-in slide-in-from-top-2 duration-500 space-y-4">
          
          {/* Nudge Monitoring */}
          {riskCount > 0 && (
            <div 
                onClick={() => navigate('/monitoring')}
                className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden group cursor-pointer hover:bg-red-100 transition"
            >
                <div className="bg-red-100 p-2.5 rounded-full text-red-600 shrink-0">
                    <AlertCircle size={24} />
                </div>
                <div className="flex-1 z-10">
                    <h3 className="font-bold text-red-800 text-sm">Perhatian Diperlukan</h3>
                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                        Terdapat <span className="font-bold">{riskCount} siswa</span> membutuhkan penanganan.
                    </p>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 shadow-sm">
                    Cek
                </div>
            </div>
          )}

          {/* Nudge Backup */}
          {!isAuthenticated ? (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm relative overflow-hidden group">
              <div className="bg-orange-100 p-2 rounded-xl text-orange-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 z-10">
                <h3 className="font-bold text-orange-800 text-sm">Data Belum Diamankan</h3>
                <p className="text-xs text-orange-600 mt-1 mb-3 leading-relaxed">
                  Data Anda hanya tersimpan di HP ini. Hubungkan Google Drive agar data tidak hilang.
                </p>
                <Link to="/pengaturan" className="inline-flex items-center gap-2 text-xs font-bold bg-white text-orange-700 px-3 py-2 rounded-lg border border-orange-200 shadow-sm hover:bg-orange-50 transition-colors">
                  <Cloud size={14} /> Hubungkan Sekarang <ArrowRight size={14}/>
                </Link>
              </div>
              <Cloud className="absolute -right-4 -bottom-4 text-orange-100 opacity-50 rotate-12 group-hover:scale-110 transition-transform" size={100} />
            </div>
          ) : (
            <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
               <div className="relative z-10 flex items-center justify-between">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="bg-white/20 p-1 rounded-full"><CheckCircle2 size={12}/></span>
                       <p className="text-xs font-medium text-indigo-100">Sinkronisasi Cloud Aktif</p>
                    </div>
                    <h3 className="font-bold text-lg">Data Anda Aman.</h3>
                 </div>
                 <Link to="/pengaturan" className="bg-white text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm">
                    Cek Backup
                 </Link>
               </div>
               <Cloud className="absolute -right-6 -bottom-6 text-indigo-500 opacity-40" size={90} />
               <Cloud className="absolute top-2 right-1/3 text-indigo-500 opacity-20" size={40} />
            </div>
          )}
        </div>
      )}

      {/* MENU GRID */}
      <div className="px-6">
        <h2 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Menu Utama</h2>
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => !item.isComingSoon && navigate(item.path)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center text-center gap-3 relative overflow-hidden group"
            >
              {item.isComingSoon && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-200" />}
              
              {item.badge > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">
                    {item.badge}
                </div>
              )}

              <div className={`p-3 rounded-xl ${item.color}`}>{item.icon}</div>
              <span className="text-xs font-bold text-slate-700 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN JADWAL (TETAP) ---
const JadwalSection = ({ dayName, todayISO }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const smartSchedule = useLiveQuery(async () => {
    const settings = await db.settings.get('mySchedule');
    const allSchedules = settings?.value || [];
    const todaySchedules = allSchedules.filter(s => s.day === dayName);
    const enriched = await Promise.all(todaySchedules.map(async (item) => {
      const isFriday = dayName === 'Jumat';
      const map = isFriday ? TIME_MAPPING.JUMAT : TIME_MAPPING.NORMAL;
      const startTimeStr = map[item.startPeriod]?.start || '00:00';
      const endTimeStr = map[item.endPeriod]?.end || '23:59';
      const startTime = new Date(`${todayISO}T${startTimeStr}:00`);
      const endTime = new Date(`${todayISO}T${endTimeStr}:00`);
      const journalExists = await db.journals.where({ date: todayISO, classId: item.classId }).count() > 0;
      let status = 'upcoming'; 
      if (now < startTime) status = 'upcoming';
      else if (now >= startTime && now <= endTime) status = 'active';
      else status = 'done';
      return { ...item, startTimeStr, endTimeStr, status, isJournalDone: journalExists };
    }));
    return enriched.sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr));
  }, [now, dayName, todayISO]) || [];

  if (dayName === 'Minggu') {
    return (
      <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-orange-300 opacity-30 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
               <Coffee size={28} className="text-white" />
            </div>
            <h2 className="font-bold text-xl">Selamat Hari Minggu!</h2>
            <p className="text-orange-100 text-sm mt-1 max-w-[200px]">Lepaskan penat, nikmati kopi Anda. Tidak ada jadwal hari ini.</p>
        </div>
      </div>
    );
  }

  if (smartSchedule.length === 0) {
    return (
      <div className="bg-slate-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3"><Calendar size={24} /></div>
            <h2 className="font-bold text-lg">Tidak Ada Jadwal</h2>
            <p className="text-slate-300 text-xs mt-1">Hari {dayName} ini kosong. Gunakan untuk administrasi atau istirahat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-indigo-400 opacity-20 rounded-full blur-xl"></div>
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="font-bold text-lg flex items-center gap-2"><Clock size={18} /> Jadwal {dayName}</h2>
        <span className="text-xs font-mono bg-indigo-500/50 px-2 py-1 rounded-lg border border-indigo-400/30">{now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
      </div>
      <div className="space-y-3 relative z-10">
        {smartSchedule.map((item, idx) => {
            let itemBg = 'bg-white/10 border-white/10'; 
            let icon = <span className="text-xs font-bold text-indigo-100">{item.startPeriod}</span>;
            let statusText = `${item.startTimeStr} - ${item.endTimeStr}`;
            if (item.status === 'active') {
                itemBg = 'bg-white/25 border-white/40 ring-1 ring-white/50';
                statusText = 'Sedang Berlangsung';
                icon = <Activity size={16} className="text-white animate-pulse" />;
            } else if (item.status === 'done') {
                itemBg = 'bg-indigo-800/50 border-indigo-700/50 opacity-60';
                icon = <CheckCircle size={16} className="text-emerald-300" />;
            }
            return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${itemBg}`}>
                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm truncate pr-2">{item.className}</h3>
                          {item.isJournalDone && (<span className="text-[10px] bg-emerald-500/80 px-1.5 py-0.5 rounded text-white font-medium flex items-center gap-1"><CheckCircle size={8}/> Absen</span>)}
                      </div>
                      <p className="text-xs text-indigo-100 truncate">{statusText}</p>
                    </div>
                </div>
            );
        })}
        <div className="text-center mt-2 pt-1">
             <button className="text-[10px] text-indigo-200 hover:text-white flex items-center justify-center gap-1 w-full opacity-70">Lihat Selengkapnya <ChevronRight size={10}/></button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;