// src/pages/Profil.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, School, Book, Save, Trash2, Plus, X, Clock, Calendar } from 'lucide-react';

// --- DATA KONSTANTA ---
const SUBJECT_OPTIONS = [
  "Al-Qur`an Hadits", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Bahasa Arab", 
  "Bahasa Indonesia", "Pendidikan Pancasila", "Matematika", "Ilmu Pengetahuan Alam", "Ilmu Pengetahuan Sosial", 
  "Bahasa Inggris", "Pendidikan Jasmani Olahraga dan Kesehatan", "Informatika", "Seni dan Prakarya", "Muatan Lokal", 
  "Bimbingan dan Konseling"
];

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Data Jam Pelajaran (Senin-Kamis & Sabtu)
const PERIODS_NORMAL = [
  { label: 'I (07.30 - 08.10)', value: 'I' },
  { label: 'II (08.10 - 08.50)', value: 'II' },
  { label: 'III (08.50 - 09.30)', value: 'III' },
  { label: 'IV (09.30 - 10.10)', value: 'IV' },
  { label: 'V (10.40 - 11.20)', value: 'V' },
  { label: 'VI (11.20 - 12.00)', value: 'VI' },
  { label: 'VII (12.00 - 12.40)', value: 'VII' },
  { label: 'VIII (12.40 - 13.20)', value: 'VIII' },
];

// Data Jam Pelajaran (Khusus Jumat)
const PERIODS_FRIDAY = [
  { label: 'I (07.30 - 08.10)', value: 'I' },
  { label: 'II (08.10 - 08.50)', value: 'II' },
  { label: 'III (08.50 - 09.30)', value: 'III' },
  { label: 'IV (09.30 - 10.10)', value: 'IV' },
  { label: 'V (10.40 - 11.20)', value: 'V' },
  { label: 'VI (11.20 - 12.00)', value: 'VI' },
];

const Profil = () => {
  // State Data Profil
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  // State Mata Pelajaran
  const [mySubjects, setMySubjects] = useState([]);
  
  // State Jadwal
  const [schedules, setSchedules] = useState([]); // Array jadwal
  const [classList, setClassList] = useState([]); // Untuk dropdown kelas
  
  // State Modal Jadwal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    classId: '',
    day: 'Senin',
    startPeriod: 'I',
    endPeriod: 'II'
  });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const loadData = async () => {
      // Load Settings
      const settings = await db.settings.toArray();
      const tName = settings.find(s => s.key === 'teacherName');
      const sName = settings.find(s => s.key === 'schoolName');
      const mSubj = settings.find(s => s.key === 'mySubjects');
      const mSched = settings.find(s => s.key === 'mySchedule');

      if (tName) setTeacherName(tName.value);
      if (sName) setSchoolName(sName.value);
      if (mSubj) setMySubjects(mSubj.value || []);
      if (mSched) setSchedules(mSched.value || []);

      // Load Classes untuk dropdown jadwal
      const classes = await db.classes.toArray();
      setClassList(classes);
      if (classes.length > 0) {
        setNewSchedule(prev => ({ ...prev, classId: classes[0].id }));
      }
    };
    loadData();
  }, []);

  // --- 2. HANDLER PROFIL UTAMA ---
  const handleSaveProfile = async () => {
    try {
      await db.settings.bulkPut([
        { key: 'teacherName', value: teacherName },
        { key: 'schoolName', value: schoolName }
      ]);
      alert("✅ Profil berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan profil.");
    }
  };

  // --- 3. HANDLER MATA PELAJARAN (Dropdown Logic) ---
  const handleAddSubject = async (e) => {
    const subject = e.target.value;
    if (!subject) return;

    if (!mySubjects.includes(subject)) {
      const updated = [...mySubjects, subject];
      setMySubjects(updated);
      // Auto save ke DB
      await db.settings.put({ key: 'mySubjects', value: updated });
    }
    // Reset dropdown ke default
    e.target.value = ""; 
  };

  const handleRemoveSubject = async (subjectToRemove) => {
    const updated = mySubjects.filter(s => s !== subjectToRemove);
    setMySubjects(updated);
    await db.settings.put({ key: 'mySubjects', value: updated });
  };

  // --- 4. HANDLER JADWAL ---
  const getPeriodOptions = () => {
    return newSchedule.day === 'Jumat' ? PERIODS_FRIDAY : PERIODS_NORMAL;
  };

  const handleSaveSchedule = async () => {
    if (!newSchedule.classId) {
        alert("Mohon pilih kelas terlebih dahulu (buat data kelas jika kosong).");
        return;
    }

    // Cari nama kelas untuk disimpan (agar mudah ditampilkan)
    const selectedClass = classList.find(c => c.id === parseInt(newSchedule.classId));
    
    const scheduleItem = {
      id: Date.now(), // ID unik sederhana
      classId: parseInt(newSchedule.classId),
      className: selectedClass?.name || '?',
      day: newSchedule.day,
      startPeriod: newSchedule.startPeriod,
      endPeriod: newSchedule.endPeriod
    };

    const updatedSchedules = [...schedules, scheduleItem];
    setSchedules(updatedSchedules);
    await db.settings.put({ key: 'mySchedule', value: updatedSchedules });
    
    setIsScheduleModalOpen(false); // Tutup Modal
  };

  const handleRemoveSchedule = async (idToRemove) => {
    if(!confirm("Hapus jadwal ini?")) return;
    const updated = schedules.filter(s => s.id !== idToRemove);
    setSchedules(updated);
    await db.settings.put({ key: 'mySchedule', value: updated });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 relative">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profil & Pengaturan</h1>

      <div className="space-y-6">
        
        {/* SECTION 1: IDENTITAS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <User size={18} /> Identitas Guru
          </h2>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-700"
              placeholder="Contoh: Budi Santoso, S.Pd"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Sekolah</label>
            <div className="relative">
                <School className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 border rounded-xl font-bold text-slate-700"
                placeholder="Contoh: SMAN 1 Jakarta"
                />
            </div>
          </div>
          <button 
            onClick={handleSaveProfile}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex justify-center gap-2"
          >
            <Save size={18} /> Simpan Identitas
          </button>
        </div>

        {/* SECTION 2: MATA PELAJARAN (REVISI DROPDOWN) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Book size={18} /> Mata Pelajaran
          </h2>
          
          {/* Dropdown Pemilihan */}
          <div className="relative mb-4">
            <select 
                onChange={handleAddSubject}
                className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-900 focus:outline-indigo-500 appearance-none"
            >
                <option value="">+ Tambah Mata Pelajaran...</option>
                {SUBJECT_OPTIONS.map(subj => (
                    <option key={subj} value={subj} disabled={mySubjects.includes(subj)}>
                        {subj}
                    </option>
                ))}
            </select>
            <div className="absolute right-4 top-3.5 pointer-events-none text-indigo-400">
                <Plus size={18} />
            </div>
          </div>

          {/* List Mata Pelajaran Terpilih */}
          <div className="space-y-2">
            {mySubjects.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-2">Belum ada mapel dipilih.</p>
            )}
            {mySubjects.map((subject, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">{subject}</span>
                <button 
                  onClick={() => handleRemoveSubject(subject)}
                  className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: JADWAL PELAJARAN (FITUR BARU) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Clock size={18} /> Jadwal Mengajar
          </h2>

          {/* List Jadwal */}
          <div className="space-y-3 mb-6">
            {schedules.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">Belum ada jadwal diatur.</p>
                </div>
            ) : (
                schedules
                .sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)) // Sort berdasarkan hari
                .map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold">
                                <span>{item.day.substring(0,3)}</span>
                                <Calendar size={12}/>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{item.className}</h4>
                                <p className="text-xs text-slate-500">Jam ke {item.startPeriod} - {item.endPeriod}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleRemoveSchedule(item.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))
            )}
          </div>

          {/* Tombol Tambah Jadwal */}
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 bg-indigo-50 rounded-xl font-bold hover:bg-indigo-100 flex justify-center items-center gap-2"
          >
            <Plus size={18} /> Tambah Jadwal
          </button>
        </div>

      </div>

      {/* --- MODAL INPUT JADWAL --- */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Tambah Jadwal Baru</h3>
                    <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                        <X size={20}/>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Input Kelas */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Kelas</label>
                        <select 
                            value={newSchedule.classId}
                            onChange={(e) => setNewSchedule({...newSchedule, classId: e.target.value})}
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-700"
                        >
                            {classList.length === 0 && <option value="">(Belum ada data kelas)</option>}
                            {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Input Hari */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Hari</label>
                        <select 
                            value={newSchedule.day}
                            onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-700"
                        >
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Input Jam (Start - End) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Jam Mulai</label>
                            <select 
                                value={newSchedule.startPeriod}
                                onChange={(e) => setNewSchedule({...newSchedule, startPeriod: e.target.value})}
                                className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-700 text-sm"
                            >
                                {getPeriodOptions().map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Jam Selesai</label>
                            <select 
                                value={newSchedule.endPeriod}
                                onChange={(e) => setNewSchedule({...newSchedule, endPeriod: e.target.value})}
                                className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-700 text-sm"
                            >
                                {getPeriodOptions().map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveSchedule}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 mt-4 active:scale-95 transition-transform"
                    >
                        Simpan Jadwal
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Profil;