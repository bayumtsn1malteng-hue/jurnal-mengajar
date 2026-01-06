// src/components/AutoSyncHandler.jsx
import { useEffect, useRef, useState } from 'react';
import { db } from '../db';
import { useAuth } from '../context/AuthContext';
import { performAutoSync } from '../services/backupService';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

// --- BAGIAN 1: SETUP GLOBAL HOOKS (Dijalankan sekali saja) ---
// Kita menempelkan 'penyakelar' ke database Dexie agar memberi sinyal saat ada perubahan
if (!db._syncHooksAttached) {
    db._syncHooksAttached = true;
    
    // Fungsi untuk mengirim sinyal ke jendela browser
    const notifyChange = () => {
        window.dispatchEvent(new Event('local-db-change'));
    };

    // Tempelkan ke semua tabel yang ada di database
    db.tables.forEach(table => {
        // Hook bawaan Dexie (tanpa plugin tambahan)
        table.hook('creating', () => { notifyChange(); }); // Saat data dibuat
        table.hook('updating', () => { notifyChange(); }); // Saat data diedit
        table.hook('deleting', () => { notifyChange(); }); // Saat data dihapus
    });
}

// --- BAGIAN 2: KOMPONEN UI ---
const StatusIndicator = ({ status }) => {
    if (status === 'idle') return null;
    return (
        <div className="fixed bottom-4 left-4 z-50 bg-white shadow-lg border rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold transition-all duration-300 animate-in slide-in-from-bottom-5">
            {status === 'syncing' && (
                <>
                    <RefreshCw size={14} className="animate-spin text-blue-600"/>
                    <span className="text-slate-600">Menyimpan ke Cloud...</span>
                </>
            )}
            {status === 'success' && (
                <>
                    <CheckCircle size={14} className="text-green-600"/>
                    <span className="text-slate-600">Tersimpan</span>
                </>
            )}
            {status === 'error' && (
                <>
                    <AlertCircle size={14} className="text-red-500"/>
                    <span className="text-red-600">Gagal Sync</span>
                </>
            )}
        </div>
    );
};

const AutoSyncHandler = () => {
    const { isAuthenticated } = useAuth();
    const [syncStatus, setSyncStatus] = useState('idle'); 
    const debounceTimer = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Fungsi Trigger Sync (dengan penunda/debounce 5 detik)
        const triggerSync = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            setSyncStatus('syncing'); 
            
            // Tunggu 5 detik setelah user berhenti mengetik/klik
            debounceTimer.current = setTimeout(async () => {
                try {
                    console.log("⏳ Auto-Sync Started...");
                    await performAutoSync();
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 3000);
                } catch (error) {
                    console.error("Sync Error:", error);
                    setSyncStatus('error');
                }
            }, 5000); 
        };

        // Dengarkan sinyal dari global hook di atas
        window.addEventListener('local-db-change', triggerSync);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            window.removeEventListener('local-db-change', triggerSync);
        };
    }, [isAuthenticated]);

    return <StatusIndicator status={syncStatus} />;
};

export default AutoSyncHandler;