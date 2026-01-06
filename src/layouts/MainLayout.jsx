// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, ClipboardCheck, BookOpen, ChartNoAxesColumn, User 
} from 'lucide-react';
import { Toaster } from 'sonner';

// --- IMPORT HOOK ---
import { useScheduleNotification } from '../hooks/useScheduleNotification';

const MainLayout = () => {
  // --- AKTIFKAN SISTEM NOTIFIKASI ---
  useScheduleNotification(); 

  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // ... (SISA KODE SAMA SEPERTI SEBELUMNYA) ...
  // Konfigurasi Menu
  const menus = [
    { 
      path: '/', 
      icon: <Home size={22} />, 
      label: 'Beranda' 
    },
    { 
      path: '/absensi', 
      icon: <ClipboardCheck size={22} />, 
      label: 'Absensi' 
    },
    { 
      path: '/jurnal', 
      icon: <BookOpen size={28} />, 
      label: 'Jurnal',
      isFloating: true 
    },
    { 
      path: '/nilai', 
      icon: <ChartNoAxesColumn size={22} />, 
      label: 'Nilai' 
    }, 
    { 
      path: '/profil', 
      icon: <User size={22} />, 
      label: 'Akun' 
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex-1 pb-24"> 
        <Outlet />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl">
        <div className="flex justify-between items-end px-2 pb-2 h-[70px]">
           {menus.map((menu) => {
             if (menu.isFloating) {
               return (
                 <div key={menu.path} className="relative -top-6 mx-2">
                   <Link 
                     to={menu.path} 
                     className={`
                        flex flex-col items-center justify-center w-16 h-16 rounded-full shadow-xl shadow-indigo-200 border-4 border-slate-50 transition-all transform active:scale-95
                        ${isActive(menu.path) 
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' 
                          : 'bg-indigo-500 text-white' 
                        }
                     `}
                   >
                     {menu.icon}
                   </Link>
                   <span className="text-[10px] font-bold text-slate-500 absolute -bottom-6 w-full text-center">
                     {menu.label}
                   </span>
                 </div>
               );
             }
             return (
               <Link 
                 key={menu.path} 
                 to={menu.path} 
                 className={`
                    flex flex-col items-center justify-center w-full py-2 rounded-xl transition-colors duration-300
                    ${isActive(menu.path) 
                      ? 'text-indigo-600' 
                      : 'text-slate-400 hover:text-slate-600'
                    }
                 `}
               >
                 <div className={`mb-1 transition-transform ${isActive(menu.path) ? '-translate-y-1' : ''}`}>
                    {menu.icon}
                 </div>
                 <span className={`text-[10px] font-medium ${isActive(menu.path) ? 'font-bold' : ''}`}>
                    {menu.label}
                 </span>
                 {isActive(menu.path) && (
                    <div className="w-1 h-1 bg-indigo-600 rounded-full mt-1 animate-in zoom-in" />
                 )}
               </Link>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;