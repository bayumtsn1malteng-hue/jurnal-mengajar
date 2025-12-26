// src/pages/AbsensiPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Users, Save, CheckCircle } from 'lucide-react';
import { db, STATUS_ABSENSI } from '../db';
import StudentAttendanceRow from '../components/StudentAttendanceRow';

const AbsensiPage = () => {
  // --- STATE MANAGEMENT ---
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  // --- LOGIC (Sama seperti sebelumnya, hanya UI berubah) ---
  
  // 1. Load Kelas
  useEffect(() => {
    const fetchClasses = async () => {
      const allClasses = await db.classes.toArray();
      setClasses(allClasses);
      if (allClasses.length > 0) {
        setSelectedClassId(allClasses[0].id);
      }
    };
    fetchClasses();
  }, []);

  // 2. Load Data Siswa & Absensi
  useEffect(() => {
    if (!selectedClassId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const classStudents = await db.students
          .where({ classId: parseInt(selectedClassId) })
          .sortBy('name');

        const existingRecords = await db.attendance
          .where({ classId: parseInt(selectedClassId), date: selectedDate })
          .toArray();

        const statusMap = {};
        classStudents.forEach(student => {
          const record = existingRecords.find(r => r.studentId === student.id);
          statusMap[student.id] = record ? record.status : STATUS_ABSENSI.HADIR;
        });

        setStudents(classStudents);
        setAttendanceData(statusMap);
      } catch (error) {
        console.error("Error loading data:", error);
      }
      setLoading(false);
    };

    loadData();
  }, [selectedClassId, selectedDate]);

  // Handler Perubahan Status
  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: newStatus }));
  };

  // Handler Simpan
  const handleSave = async () => {
    if (!confirm('Simpan data absensi ini? Data lama pada tanggal ini akan ditimpa.')) return;

    try {
      await db.transaction('rw', db.attendance, async () => {
        await db.attendance
          .where({ classId: parseInt(selectedClassId), date: selectedDate })
          .delete();

        const newRecords = students.map(student => ({
          date: selectedDate,
          classId: parseInt(selectedClassId),
          studentId: student.id,
          status: attendanceData[student.id]
        }));

        await db.attendance.bulkAdd(newRecords);
      });
      alert('✅ Data Absensi Berhasil Disimpan!');
    } catch (error) {
      alert('❌ Gagal menyimpan: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Absensi Kelas</h1>
            <p className="text-xs text-slate-500">Catat kehadiran siswa hari ini</p>
          </div>
        </div>

        {/* --- FILTER CARD --- */}
        <div className="flex gap-3">
          {/* Pilih Kelas */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-3 text-indigo-500">
              <Users size={18} />
            </div>
            <select 
              className="w-full pl-10 pr-3 py-3 bg-indigo-50 border-none rounded-2xl text-sm font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Pilih Tanggal */}
          <div className="flex-1 relative">
             <div className="absolute left-3 top-3 text-teal-500">
              <Calendar size={18} />
            </div>
            <input 
              type="date" 
              className="w-full pl-10 pr-3 py-3 bg-teal-50 border-none rounded-2xl text-sm font-semibold text-teal-900 focus:ring-2 focus:ring-teal-200 outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- LIST SISWA --- */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 text-slate-400 animate-pulse">
            Memuat data siswa...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Belum ada siswa di kelas ini.</p>
            <Link to="/kelas" className="text-teal-600 text-sm font-bold mt-2 inline-block">
              + Tambah Siswa Dulu
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
             {/* Legend Kecil */}
             <div className="flex justify-between px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Nama Siswa</span>
                <span>Status Kehadiran</span>
             </div>
             
            {students.map(student => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                currentStatus={attendanceData[student.id]}
                onChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- TOMBOL SIMPAN FLOATING --- */}
      <div className="fixed bottom-20 left-0 right-0 px-6 max-w-md mx-auto z-30">
        <button 
            onClick={handleSave}
            className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
            <Save size={20} />
            <span>SIMPAN DATA ABSENSI</span>
        </button>
    </div>

    </div>
  );
};

export default AbsensiPage;