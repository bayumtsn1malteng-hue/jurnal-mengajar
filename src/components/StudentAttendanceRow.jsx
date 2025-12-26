// src/components/StudentAttendanceRow.jsx
import React from 'react';
import { STATUS_ABSENSI } from '../db';

const StudentAttendanceRow = ({ student, currentStatus, onChange }) => {
  
  // Konfigurasi Tombol dengan Warna Tema Dashboard
  const options = [
    { value: STATUS_ABSENSI.HADIR, label: 'H', bg: 'bg-teal-500', ring: 'ring-teal-200' },
    { value: STATUS_ABSENSI.SAKIT, label: 'S', bg: 'bg-amber-400', ring: 'ring-amber-200' },
    { value: STATUS_ABSENSI.IZIN,  label: 'I', bg: 'bg-indigo-400', ring: 'ring-indigo-200' },
    { value: STATUS_ABSENSI.ALPA,  label: 'A', bg: 'bg-slate-400', ring: 'ring-slate-200' }, // Abu-abu
    { value: STATUS_ABSENSI.BOLOS, label: 'B', bg: 'bg-rose-500',  ring: 'ring-rose-200' }, // Merah Rose
  ];

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm mb-3">
      {/* Kiri: Info Siswa */}
      <div className="w-1/3 pr-2">
        <h3 className="font-bold text-slate-700 text-sm leading-tight break-words">{student.name}</h3>
      </div>

      {/* Kanan: Tombol Pilihan */}
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(student.id, opt.value)}
            className={`
              w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200
              ${currentStatus === opt.value 
                ? `${opt.bg} text-white ring-4 ${opt.ring} scale-110 z-10` 
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
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