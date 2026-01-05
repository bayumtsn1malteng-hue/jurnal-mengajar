// src/services/driveService.js

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ""; 
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

let tokenClient;
let gapiInited = false;
let gisInited = false;

export const initGoogleClient = (updateSigninStatus) => {
  if (!CLIENT_ID) {
    console.error("CLIENT_ID belum diset di .env");
    return;
  }
  const gapiScript = document.createElement('script');
  gapiScript.src = "https://apis.google.com/js/api.js";
  gapiScript.async = true;
  gapiScript.defer = true;
  gapiScript.onload = () => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
        gapiInited = true;
        maybeEnableButtons(updateSigninStatus);
      } catch (err) {
        console.error("Gagal init GAPI:", err);
      }
    });
  };
  document.body.appendChild(gapiScript);

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
          if (window.gapi.client) window.gapi.client.setToken(resp);
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

const maybeEnableButtons = (updateSigninStatus) => {
  if (gapiInited && gisInited) {
    const token = window.gapi.client.getToken();
    updateSigninStatus(!!token); 
  }
};

export const signIn = () => { if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' }); };
export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};
export const getAccessToken = () => window.gapi.client.getToken()?.access_token;

// --- FUNGSI API DRIVE ---

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
  const fileMetadata = { 'name': folderName, 'mimeType': 'application/vnd.google-apps.folder' };
  const response = await window.gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
  return response.result.id;
};

// FUNGSI BARU: Cari file spesifik dalam folder
export const findFileInFolder = async (folderId, fileName) => {
    const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive'
    });
    const files = response.result.files;
    return (files && files.length > 0) ? files[0] : null;
};

// Upload Baru
export const uploadFileToDrive = async (folderId, fileName, jsonContent) => {
    const accessToken = getAccessToken();
    if (!accessToken) throw new Error("Token akses tidak ditemukan");
    const fileContent = JSON.stringify(jsonContent);
    const metadata = { name: fileName, mimeType: 'application/json', parents: [folderId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });
    if(!response.ok) { const err = await response.json(); throw new Error(err.error?.message || "Gagal upload"); }
    return await response.json();
};

// FUNGSI BARU: Update File (PATCH)
export const updateFileInDrive = async (fileId, jsonContent) => {
    const accessToken = getAccessToken();
    const fileContent = JSON.stringify(jsonContent);
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' }),
        body: fileContent
    });
    if(!response.ok) { const err = await response.json(); throw new Error(err.error?.message || "Gagal update"); }
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
    const response = await window.gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
    return response.result;
};