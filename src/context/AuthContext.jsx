// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initGoogleClient, signIn as googleSignIn, signOut as googleSignOut, getAccessToken } from '../services/driveService';
// Import logic cek DB & cek Drive
import { isLocalDbEmpty, getLastBackupMetadata } from '../services/backupService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // STATE BARU: Menyimpan file kandidat restore otomatis
  const [autoRestoreCandidate, setAutoRestoreCandidate] = useState(null);

  // Fungsi helper untuk mengambil profil user
  const fetchUserProfile = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const profile = await response.json();
        setUser(profile);
        setIsAuthenticated(true);

        // --- LOGIC AUTO-PROMPT RESTORE (TASK 6.1) ---
        checkAutoRestore();
      }
    } catch (error) {
      console.error("Gagal ambil profil:", error);
      toast.error("Gagal memuat profil pengguna.");
    }
  };

  // Fungsi Cek Restore Otomatis
  const checkAutoRestore = async () => {
      // 1. Cek apakah DB lokal kosong?
      const isEmpty = await isLocalDbEmpty();
      if (!isEmpty) return; // Jika ada data, jangan tawarkan restore (takut tertimpa)

      // 2. Cek apakah ada backup di Drive?
      console.log("DB Lokal kosong, cek backup cloud...");
      const lastBackup = await getLastBackupMetadata();
      
      // 3. Jika ada, simpan ke state global agar App.jsx bisa memunculkan Modal
      if (lastBackup) {
          setAutoRestoreCandidate(lastBackup);
      }
  };

  // Fungsi untuk membersihkan state kandidat restore (dipanggil setelah modal ditutup)
  const clearAutoRestore = () => setAutoRestoreCandidate(null);

  useEffect(() => {
    const handleStatusChange = async (signedIn) => {
      setIsAuthenticated(signedIn);
      if (signedIn) {
        await fetchUserProfile();
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initGoogleClient(handleStatusChange);
  }, []);

  const login = () => {
    googleSignIn();
  };

  const logout = () => {
    googleSignOut();
    setIsAuthenticated(false);
    setUser(null);
    toast.success("Berhasil logout");
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated, 
        login, 
        logout, 
        loading,
        autoRestoreCandidate, // Expose state ini
        clearAutoRestore 
    }}>
      {children}
    </AuthContext.Provider>
  );
};