// Firebase configuration - fill these values from Firebase Console > Project Settings > Your apps.
// Enable: Authentication (Email/Password), Firestore Database, Realtime Database.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

export const firebaseConfig = {
  apiKey: "AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58",
  authDomain: "cvx-8790a.firebaseapp.com",
  databaseURL: "https://cvx-8790a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cvx-8790a",
  storageBucket: "cvx-8790a.firebasestorage.app",
  messagingSenderId: "1030281720381",
  appId: "1:1030281720381:web:61f28fbea7a77a8a223054",
  measurementId: "G-VXHQJSNPD9"
};

export const isConfigured = !JSON.stringify(firebaseConfig).includes('YOUR_');

let app = null, auth = null, db = null, rtdb = null;
if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  try { rtdb = getDatabase(app); } catch (e) { console.warn('Realtime Database unavailable', e); }
}

export { app, auth, db, rtdb };
