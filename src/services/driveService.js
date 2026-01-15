// src/services/driveService.js

/**
 * EDUKASI: Variabel Konfigurasi
 * CLIENT_ID & API_KEY didapat dari Google Cloud Console.
 * SCOPES menentukan izin apa saja yang diminta aplikasi kepada user.
 * drive.file: hanya mengizinkan akses ke file yang dibuat oleh aplikasi ini (lebih aman).
 */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ""; 
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

/**
 * EDUKASI: State Global Layanan
 * tokenClient: Objek dari GIS (Google Identity Services) untuk mengelola alur login.
 * gapiInited & gisInited: Flag untuk memastikan kedua library Google sudah siap sebelum digunakan.
 */
let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Inisialisasi Google Client (GAPI + GIS)
 */
export const initGoogleClient = (updateSigninStatus) => {
  if (!CLIENT_ID) {
    console.error("CLIENT_ID belum diset di .env");
    return;
  }

  // 1. Load GAPI (Google API Client Library)
  // EDUKASI: GAPI adalah library 'tua' namun masih diperlukan untuk berinteraksi dengan API Drive v3.
  const gapiScript = document.createElement('script');
  gapiScript.src = "https://apis.google.com/js/api.js";
  gapiScript.async = true;
  gapiScript.defer = true;
  gapiScript.onload = () => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        maybeEnableButtons(updateSigninStatus);
      } catch (err) {
        console.error("Gagal init GAPI:", err);
      }
    });
  };
  document.body.appendChild(gapiScript);

  // 2. Load GIS (Google Identity Services)
  // EDUKASI: GIS adalah library modern Google khusus untuk menangani Autentikasi dan Otorisasi (Login).
  const gisScript = document.createElement('script');
  gisScript.src = "https://accounts.google.com/gsi/client";
  gisScript.async = true;
  gisScript.defer = true;
  gisScript.onload = () => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error !== undefined) throw (resp);

          // --- FIX PENTING: SET TOKEN KE GAPI ---
          if (window.gapi.client) {
             window.gapi.client.setToken(resp);
             
             /**
              * EDUKASI: PERSISTENSI LOGIN (REVISI)
              * Kita menyimpan objek 'resp' (yang berisi access_token) ke LocalStorage.
              * Tanpa ini, saat refresh, variabel JavaScript akan hilang dan user dianggap logout.
              */
             localStorage.setItem('gdrive_token', JSON.stringify(resp));
          }

          updateSigninStatus(true);
        },
      });
      gisInited = true;
      maybeEnableButtons(updateSigninStatus);
    } catch (err) {
      console.error("Gagal init GIS:", err);
    }
  };
  document.body.appendChild(gisScript);
};

/**
 * EDUKASI: Logika Pengecekan Status Login (REVISI)
 * Fungsi ini dipanggil setiap kali salah satu library (GAPI/GIS) selesai dimuat.
 * Kita memodifikasinya agar memeriksa 'harta karun' di LocalStorage jika memori utama kosong.
 */
const maybeEnableButtons = (updateSigninStatus) => {
  if (gapiInited && gisInited) {
    // Pertama, cek apakah token ada di memori aktif GAPI
    let token = window.gapi.client.getToken();
    
    // Jika kosong (akibat refresh), coba ambil dari penyimpanan permanen browser
    if (!token) {
      const savedToken = localStorage.getItem('gdrive_token');
      if (savedToken) {
        token = JSON.parse(savedToken);
        /**
         * EDUKASI: RE-HYDRATION
         * Kita 'menyuntikkan' kembali token dari LocalStorage ke dalam GAPI client.
         * Ini membuat GAPI merasa user tidak pernah meninggalkan halaman.
         */
        window.gapi.client.setToken(token);
      }
    }
    
    // Jika token akhirnya ditemukan, beri tahu React bahwa user sedang login
    updateSigninStatus(!!token); 
  }
};

/**
 * EDUKASI: Fungsi Pemicu Login
 * requestAccessToken akan memunculkan popup Google. 'prompt: consent' memastikan
 * user selalu ditanya persetujuan (baik untuk testing).
 */
export const signIn = () => {
  if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' });
};

/**
 * EDUKASI: Fungsi Keluar (REVISI)
 * Selain memberitahu Google untuk mencabut akses (revoke), kita WAJIB
 * menghapus data di LocalStorage agar saat refresh, user tidak otomatis login lagi.
 */
export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    // Mencabut token di sisi server Google
    window.google.accounts.oauth2.revoke(token.access_token);
    // Menghapus token di sisi client (memori & storage)
    window.gapi.client.setToken('');
    localStorage.removeItem('gdrive_token');
  }
};

/**
 * EDUKASI: Helper Token
 * Digunakan untuk mengambil string token mentah yang dibutuhkan saat pemanggilan fetch API manual.
 */
export const getAccessToken = () => {
  return window.gapi.client.getToken()?.access_token;
};

// ==========================================
// FUNGSI API DRIVE (TIDAK BERUBAH)
// ==========================================

export const findAppFolder = async (folderName = "Jurnal_Mengajar_Backup") => {
  const response = await window.gapi.client.drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });
  const files = response.result.files;
  return (files && files.length > 0) ? files[0].id : null;
};

export const createAppFolder = async (folderName = "Jurnal_Mengajar_Backup") => {
  const fileMetadata = {
    'name': folderName,
    'mimeType': 'application/vnd.google-apps.folder'
  };
  const response = await window.gapi.client.drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  });
  return response.result.id;
};

export const uploadFileToDrive = async (folderId, fileName, jsonContent) => {
    const accessToken = getAccessToken();
    if (!accessToken) throw new Error("Token akses tidak ditemukan (Silakan login ulang)");

    const fileContent = JSON.stringify(jsonContent);

    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });

    if(!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error?.message || "Gagal upload file");
    }
    return await response.json();
};

export const listBackupFiles = async (folderId) => {
    const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType='application/json'`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc'
    });
    return response.result.files;
};

export const downloadBackupFile = async (fileId) => {
    const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    });
    return response.result;
};
