// src/services/driveService.js
import { gapi } from 'gapi-script';

// KONFIGURASI GOOGLE DRIVE
// Ganti string di bawah dengan Client ID dari Google Cloud Console Anda
const CLIENT_ID = "778219124620-fn6op23burks8gug4d20hjjt5dsdenjq.apps.googleusercontent.com"; 
const API_KEY = ""; // Opsional untuk scope file pribadi
const SCOPES = "https://www.googleapis.com/auth/drive.file";

/**
 * TASK-002: Inisialisasi Google Client
 * @param {function} updateSigninStatus - Callback untuk update state React saat status login berubah
 */
export const initGoogleClient = (updateSigninStatus) => {
  const start = () => {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: SCOPES,
      // discoveryDocs diperlukan untuk memudahkan akses endpoint API
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    }).then(() => {
      // TASK-004: Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, (error) => {
      console.error("Gagal inisialisasi GAPI:", error);
    });
  };

  gapi.load('client:auth2', start);
};

/**
 * TASK-003: Fungsi Login & Logout
 */
export const signIn = () => {
  return gapi.auth2.getAuthInstance().signIn();
};

export const signOut = () => {
  return gapi.auth2.getAuthInstance().signOut();
};

/**
 * Helper untuk mendapatkan token akses saat ini (berguna untuk upload manual nanti)
 */
export const getAccessToken = () => {
  return gapi.auth.getToken().access_token;
};