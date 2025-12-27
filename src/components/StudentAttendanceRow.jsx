// src/components/StudentAttendanceRow.jsx
import React from 'react';
import { STATUS_ABSENSI } from '../db';

const StudentAttendanceRow = ({ student, currentStatus, onChange }) => {
  
  // Konfigurasi Warna & Style Kartu
  const options = [
    { 
      value: STATUS_ABSENSI.HADIR, label: 'H', 
      btnClass: 'bg-emerald-500 text-white ring-emerald-200', 
      cardClass: 'bg-emerald-50 border-emerald-200 shadow-sm'
    },
    { 
      value: STATUS_ABSENSI.SAKIT, label: 'S', 
      btnClass: 'bg-yellow-400 text-white ring-yellow-200', 
      cardClass: 'bg-yellow-50 border-yellow-200 shadow-sm'
    },
    { 
      value: STATUS_ABSENSI.IZIN,  label: 'I', 
      btnClass: 'bg-orange-400 text-white ring-orange-200', 
      cardClass: 'bg-orange-50 border-orange-200 shadow-sm'
    },
    { 
      value: STATUS_ABSENSI.ALPA,  label: 'A', 
      btnClass: 'bg-slate-500 text-white ring-slate-200', 
      cardClass: 'bg-slate-100 border-slate-300 shadow-sm'
    },
    { 
      value: STATUS_ABSENSI.BOLOS, label: 'B', 
      btnClass: 'bg-rose-600 text-white ring-rose-200', 
      cardClass: 'bg-rose-50 border-rose-200 shadow-sm'
    },
  ];

  // Tentukan style kartu aktif (Default putih jika belum absen)
  const activeOpt = options.find(o => o.value === currentStatus);
  const containerStyle = activeOpt ? activeOpt.cardClass : 'bg-white border-slate-100';

  return (
    <div className={`flex items-center justify-between p-4 border rounded-2xl mb-3 transition-colors duration-300 ${containerStyle}`}>
      {/* Info Siswa */}
      <div className="w-1/3 pr-2">
        <h3 className={`font-bold text-sm leading-tight break-words ${activeOpt ? 'text-slate-800' : 'text-slate-600'}`}>
          {student.name}
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{student.nis}</p>
      </div>

      {/* Tombol Pilihan */}
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(student.id, opt.value)}
            className={`
              w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200
              ${currentStatus === opt.value 
                ? `${opt.btnClass} ring-4 ${opt.ring} scale-110 z-10` 
                : 'bg-white text-slate-300 hover:bg-slate-50 border border-slate-100'}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentAttendanceRow;