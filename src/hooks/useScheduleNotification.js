// src/hooks/useScheduleNotification.js
import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import toast from 'react-hot-toast';

// Duplikasi Mapping Waktu (Agar mandiri & konsisten)
const TIME_MAPPING = {
  NORMAL: {
    'I':   '07:30', 'II':  '08:10', 'III': '08:50', 'IV':  '09:30',
    'V':   '10:40', 'VI':  '11:20', 'VII': '12:00', 'VIII':'12:40',
  },
  JUMAT: {
    'I':   '07:30', 'II':  '08:10', 'III': '08:50', 'IV':  '09:30',
    'V':   '10:40', 'VI':  '11:20'
  }
};

export const useScheduleNotification = () => {
  const lastNotifiedRef = useRef(null);

  // 1. Ambil Pengaturan
  const settings = useLiveQuery(async () => {
    const schedule = await db.settings.get('mySchedule');
    const notifEnabled = await db.settings.get('enableNotifications');
    return {
      schedules: schedule?.value || [],
      isEnabled: notifEnabled?.value ?? true // Default ON
    };
  }, []);

  // 2. Definisi Fungsi Trigger (DIPINDAHKAN KE ATAS)
  const triggerNotification = (scheduleItem) => {
    const title = "🔔 Saatnya Masuk Kelas!";
    const body = `Mapel: ${scheduleItem.subject || 'Pelajaran'}\nKelas: ${scheduleItem.className}\nJam ke-${scheduleItem.startPeriod}`;

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'jurnal-schedule'
        });
      } catch (e) {
        console.error("Notifikasi Error:", e);
      }
    } else {
      toast(body, {
        icon: '🔔',
        duration: 6000,
        position: 'top-center',
        style: { border: '2px solid #6366f1', color: '#4338ca' }
      });
    }
  };

  // 3. Interval Pengecekan
  useEffect(() => {
    if (!settings?.isEnabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
      const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      if (lastNotifiedRef.current === currentTime) return;

      const todaySchedules = settings.schedules.filter(s => s.day === dayName);
      
      todaySchedules.forEach(item => {
        const isFriday = dayName === 'Jumat';
        const map = isFriday ? TIME_MAPPING.JUMAT : TIME_MAPPING.NORMAL;
        const startTime = map[item.startPeriod];

        if (startTime === currentTime) {
          triggerNotification(item);
          lastNotifiedRef.current = currentTime;
        }
      });
    };

    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);

  }, [settings]);
};