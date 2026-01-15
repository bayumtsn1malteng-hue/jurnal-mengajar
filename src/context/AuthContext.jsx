// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
/**
 * EDUKASI: Import Layanan Google
 * Kita mengimpor initGoogleClient agar proses pengecekan token (kunci akses) 
 * bisa dilakukan langsung saat provider ini pertama kali dijalankan.
 */
import { initGoogleClient } from '../services/driveService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  /**
   * EDUKASI: State Login Google
   * Kita menambahkan state khusus untuk melacak apakah koneksi ke 
   * Google Drive/Gmail aktif atau tidak di level global.
   */
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);
  const [autoRestoreCandidate, setAutoRestoreCandidate] = useState(null);

  useEffect(() => {
    /**
     * EDUKASI: PROSES RE-HYDRATION (PENTING)
     * useEffect ini berjalan sekali saat aplikasi pertama kali dimuat (atau saat REFRESH).
     * Dengan memanggil initGoogleClient di sini, kita memastikan bahwa di halaman manapun
     * user berada, aplikasi akan selalu memeriksa LocalStorage untuk memulihkan sesi Google.
     */
    initGoogleClient((status) => {
      // Status ini didapat dari hasil pengecekan memori GAPI atau LocalStorage di driveService
      setIsGoogleLoggedIn(status);
      
      /**
       * EDUKASI: Sinkronisasi Status
       * Jika status login Google aktif, kita bisa memastikan data user tetap sinkron.
       * Ini mencegah user terlihat 'Logout' dari Gmail/Drive saat berpindah halaman.
       */
      if (status) {
        console.log("Sesi Google berhasil dipulihkan secara otomatis.");
      }
    });

    // Simulasi pengecekan user internal aplikasi (jika ada)
    const checkUser = async () => {
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    /**
     * EDUKASI: Cleanup Global
     * Saat user logout dari aplikasi, kita juga memastikan status Google di-reset.
     */
    setIsGoogleLoggedIn(false);
  };

  const clearAutoRestore = () => setAutoRestoreCandidate(null);

  /**
   * EDUKASI: Penjelasan Value
   * isGoogleLoggedIn sekarang tersedia di seluruh aplikasi melalui useAuth().
   * Komponen mana pun (Profil, Kelas, dll) bisa menggunakan ini untuk mengecek status Gmail.
   */
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isGoogleLoggedIn,
      setIsGoogleLoggedIn, // Digunakan oleh tombol login di page untuk update status
      login, 
      logout,
      autoRestoreCandidate,
      setAutoRestoreCandidate,
      clearAutoRestore
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
