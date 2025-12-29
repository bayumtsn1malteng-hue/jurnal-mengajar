// src/pages/StatistikPage.jsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  BarChart2, 
  Users, 
  BookOpen, 
  School, 
  TrendingUp, 
  Calendar 
} from 'lucide-react';

const StatistikPage = () => {
  // --- QUERY DATA STATISTIK ---
  const stats = useLiveQuery(async () => {
    // 1. Data Dasar
    const studentCount = await db.students.count();
    const classCount = await db.classes.count();
    const totalJournals = await db.journals.count();

    // 2. Jurnal Bulan Ini (Analisis Sederhana)
    const now = new Date();
    // Format YYYY-MM-01
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const journalsThisMonth = await db.journals
        .where('date')
        .aboveOrEqual(startOfMonth)
        .count();

    return {
        students: studentCount || 0,
        classes: classCount || 0,
        journals: totalJournals || 0,
        journalsMonth: journalsThisMonth || 0
    };
  }, []) || { students: 0, classes: 0, journals: 0, journalsMonth: 0 };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
           <BarChart2 className="text-amber-500" />
           Statistik Data
        </h1>
        <p className="text-xs text-slate-500 mt-1">
           Ringkasan aktivitas mengajar Anda.
        </p>
      </div>

      <div className="px-6 space-y-6">
        
        {/* RINGKASAN UTAMA (Grid 2 Kolom) */}
        <div className="grid grid-cols-2 gap-4">
            {/* Kartu Jurnal */}
            <div className="bg-teal-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-white opacity-10 w-24 h-24 rounded-full blur-xl"></div>
                <BookOpen size={24} className="mb-3 relative z-10" />
                <h3 className="text-3xl font-bold relative z-10">{stats.journals}</h3>
                <p className="text-xs font-medium opacity-90 relative z-10">Total Jurnal</p>
            </div>

            {/* Kartu Siswa */}
            <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-white opacity-10 w-24 h-24 rounded-full blur-xl"></div>
                <Users size={24} className="mb-3 relative z-10" />
                <h3 className="text-3xl font-bold relative z-10">{stats.students}</h3>
                <p className="text-xs font-medium opacity-90 relative z-10">Siswa Aktif</p>
            </div>
        </div>

        {/* DETAIL METRIK (List Kebawah) */}
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Calendar size={20}/>
                </div>
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium uppercase">Aktivitas Bulan Ini</p>
                    <p className="font-bold text-slate-700">{stats.journalsMonth} Jurnal Mengajar</p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <School size={20}/>
                </div>
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium uppercase">Total Kelas</p>
                    <p className="font-bold text-slate-700">{stats.classes} Rombel</p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <TrendingUp size={20}/>
                </div>
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium uppercase">Rata-rata</p>
                    <p className="font-bold text-slate-700">
                        {stats.classes > 0 
                          ? Math.round(stats.students / stats.classes) 
                          : 0} Siswa / Kelas
                    </p>
                </div>
            </div>
        </div>

        {/* Info Tambahan */}
        <div className="text-center p-4 bg-slate-100 rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500 italic">
                "Data yang baik adalah landasan keputusan yang bijak."
            </p>
        </div>

      </div>
    </div>
  );
};

export default StatistikPage;