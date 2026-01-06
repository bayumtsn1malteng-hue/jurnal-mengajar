// src/pages/MonitoringPage.jsx
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { analyzeStudentRisk } from '../services/monitoringService'; 
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, AlertTriangle, CheckCircle, TrendingUp, 
  Filter, Loader2
} from 'lucide-react';

const MonitoringPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState([]);
  const [filter, setFilter] = useState('ALL'); 

  // PERBAIKAN: Hapus "|| []" agar referensi array tidak berubah-ubah saat loading
  const students = useLiveQuery(() => db.students.toArray());

  useEffect(() => {
    const runAnalysis = async () => {
      // Cek apakah data students sudah ada (tidak undefined)
      if (!students) return; 

      if (students.length === 0) {
        setLoading(false);
        setRiskData([]);
        return;
      }
      
      setLoading(true);
      
      const results = await Promise.all(students.map(async (student) => {
        const analysis = await analyzeStudentRisk(student.id);
        return {
          ...student,
          risk: analysis
        };
      }));

      // Urutkan: Merah (Bahaya) paling atas
      const sorted = results.sort((a, b) => {
        const score = { 'RED': 3, 'YELLOW': 2, 'GREEN': 1 };
        return score[b.risk.level] - score[a.risk.level];
      });

      setRiskData(sorted);
      setLoading(false);
    };

    runAnalysis();
    
  }, [students]); // Sekarang aman karena variabel 'students' stabil dari Dexie

  // Filter Logic
  const filteredList = riskData.filter(item => {
    if (filter === 'ALL') return item.risk.level !== 'GREEN'; 
    return item.risk.level === filter;
  });

  const stats = {
    red: riskData.filter(i => i.risk.level === 'RED').length,
    yellow: riskData.filter(i => i.risk.level === 'YELLOW').length,
    total: riskData.length
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100 transition">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monitoring Siswa</h1>
          <p className="text-slate-500 text-sm">Deteksi dini perkembangan siswa</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
         <div onClick={() => setFilter('RED')} className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'RED' ? 'bg-red-50 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-slate-100'}`}>
            <div className="text-red-500 mb-1"><AlertTriangle size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">{stats.red}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perlu Penanganan</div>
         </div>
         <div onClick={() => setFilter('YELLOW')} className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'YELLOW' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20' : 'bg-white border-slate-100'}`}>
            <div className="text-amber-500 mb-1"><TrendingUp size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">{stats.yellow}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pantauan</div>
         </div>
         <div onClick={() => setFilter('ALL')} className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'ALL' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-white border-slate-100'}`}>
            <div className="text-indigo-500 mb-1"><Filter size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">{stats.red + stats.yellow}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kasus</div>
         </div>
      </div>

      {/* List Siswa */}
      <div className="space-y-3">
        {/* State 1: Loading Awal (Belum ada data query) */}
        {!students || loading ? (
            <div className="text-center py-12">
                <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2"/>
                <p className="text-xs text-slate-400">Menganalisis data siswa...</p>
            </div>
        ) : filteredList.length === 0 ? (
            /* State 2: Tidak ada hasil (Semua Aman / Kosong) */
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3 opacity-50"/>
                <p className="text-slate-600 font-bold">Semua Aman!</p>
                <p className="text-xs text-slate-400">Tidak ada siswa dengan risiko {filter !== 'ALL' ? filter : ''} saat ini.</p>
            </div>
        ) : (
            /* State 3: Ada Data Risiko */
            filteredList.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => navigate(`/kelas/${item.classId}`)} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden"
                >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.risk.level === 'RED' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                    
                    <div className="flex justify-between items-start pl-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                                {item.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{item.name}</h3>
                                <p className="text-xs text-slate-500">{item.nis || '-'} • {item.gender}</p>
                            </div>
                        </div>
                        {item.risk.level === 'RED' && (
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                BUTUH TINDAKAN
                            </span>
                        )}
                    </div>

                    <div className="mt-3 pl-3 flex flex-wrap gap-2">
                        {item.risk.factors.map((factor, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                {factor}
                            </span>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;