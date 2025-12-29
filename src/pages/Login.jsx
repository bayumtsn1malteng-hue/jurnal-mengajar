// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import toast, { Toaster } from 'react-hot-toast'; // Tambahkan Import Ini
import { LogIn, User, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validasi sederhana
    if (!username || !password) {
      toast.error("Username dan Password harus diisi!"); // Ganti Alert
      return;
    }

    try {
      // Cek user di DB (Simulasi)
      const setting = await db.settings.get('teacherName');
      
      // Password Hardcoded Sederhana (Bisa dikembangkan nanti)
      if (password === '123456') { 
        toast.success("Login Berhasil!"); // Feedback Positif
        
        // Simpan nama jika belum ada
        if (!setting) {
            await db.settings.put({ key: 'teacherName', value: username });
        }
        
        // Delay sedikit agar user sempat baca toast
        setTimeout(() => navigate('/'), 1000);
      } else {
        toast.error("Password salah! (Hint: 123456)"); // Ganti Alert
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* PENTING: Pasang Toaster di sini */}
      <Toaster position="top-center" /> 

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Selamat Datang</h1>
          <p className="text-slate-500 text-sm">Silakan masuk untuk memulai</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">Nama Guru</label>
            <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  placeholder="Masukkan nama Anda"
                />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">PIN / Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                  placeholder="••••••"
                />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 mt-4"
          >
            Masuk Aplikasi
          </button>
        </form>
        
        <p className="text-center text-[10px] text-slate-400 mt-6">
            Versi 1.1.0 • Jurnal Mengajar App
        </p>
      </div>
    </div>
  );
};

export default Login;