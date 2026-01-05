// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initGoogleClient, signIn as googleSignIn, signOut as googleSignOut, getAccessToken } from '../services/driveService';
import { isLocalDbEmpty, getLastBackupMetadata } from '../services/backupService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRestoreCandidate, setAutoRestoreCandidate] = useState(null);

  useEffect(() => {
    // 1. Definisi fungsi di dalam useEffect agar dependency aman
    const checkAutoRestore = async () => {
        try {
            const isEmpty = await isLocalDbEmpty();
            if (!isEmpty) return;

            console.log("DB Lokal kosong, cek backup cloud...");
            const lastBackup = await getLastBackupMetadata();
            
            if (lastBackup) {
                setAutoRestoreCandidate(lastBackup);
            }
        } catch (e) {
            console.error("Gagal cek auto restore:", e);
        }
    };

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
          
          // Panggil cek restore setelah login sukses
          checkAutoRestore();
        }
      } catch (error) {
        console.error("Gagal ambil profil:", error);
        toast.error("Gagal memuat profil pengguna.");
      }
    };

    const handleStatusChange = async (signedIn) => {
      setIsAuthenticated(signedIn);
      if (signedIn) {
        await fetchUserProfile();
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    // 2. Init Client
    initGoogleClient(handleStatusChange);
  }, []); // Dependency array kosong aman karena semua fungsi ada di dalam

  const clearAutoRestore = () => setAutoRestoreCandidate(null);

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
        autoRestoreCandidate, 
        clearAutoRestore 
    }}>
      {children}
    </AuthContext.Provider>
  );
};