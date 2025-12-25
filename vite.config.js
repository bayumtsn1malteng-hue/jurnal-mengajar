import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Mode Latihan ON
      },
      // Pastikan file ini benar-benar ada di folder public Anda
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-1024x1024.png'], 
      manifest: {
        name: 'Jurnal Mengajar Guru',
        short_name: 'JurnalGuru',
        description: 'Aplikasi Harian Guru Offline-first',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-1024x1024.png', // Menggunakan file HD Anda
            sizes: '192x192',         // Browser akan me-resize otomatis
            type: 'image/png'
          },
          {
            src: 'pwa-1024x1024.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-1024x1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
})