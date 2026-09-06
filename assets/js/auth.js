import { auth, db, rtdb, isConfigured, firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously,
  signOut, onAuthStateChanged, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { doc, getDoc, getDocs, setDoc, collection } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

export const watchAuth = (cb) => {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
};
export const currentUser = () => auth?.currentUser || null;
export const logout = () => signOut(auth);

const ensure = () => { if (!isConfigured || !auth) throw new Error('Firebase is not configured. Edit assets/js/firebase-config.js first.'); };
const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();
const normalizeMobile = (value = '') => {
  const d = String(value || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
};

// Student LMS login: verified against lightweight /lms_auth index,
// then establishes an authenticated session mapped to the canonical /students/{studentId} record.
export async function studentLogin(identifier, password) {
  ensure();
  const raw = String(identifier || '').trim();
  const email = normalizeEmail(raw);
  const mobile = normalizeMobile(raw);
  const pass = String(password || '');
  if (!email && !mobile) throw new Error('Enter your email or mobile number');

  const safeId = raw.replace(/[.#$\[\]@]/g, '_').toLowerCase();
  let authData = null;

  // 1. Direct O(1) lookup in secured /lms_auth index
  if (db) {
    const candidateKeys = [];
    if (email) candidateKeys.push(`email_${safeId}`, safeId);
    if (mobile) candidateKeys.push(`phone_${mobile}`, mobile);

    for (const key of candidateKeys) {
      try {
        const snap = await getDoc(doc(db, 'lms_auth', key));
        if (snap.exists()) {
          const data = snap.data();
          if (data.active !== false && normalizeMobile(data.mobile || data.phone || '') === normalizeMobile(pass)) {
            authData = data;
            break;
          }
        }
      } catch (e) {
        /* proceed to next candidate */
      }
    }

    // Legacy fallback check (for previously enrolled students during transition)
    if (!authData) {
      for (const legacyKey of [safeId, mobile].filter(Boolean)) {
        try {
          const legSnap = await getDoc(doc(db, 'lms_users', legacyKey));
          if (legSnap.exists()) {
            const data = legSnap.data();
            if (normalizeMobile(data.mobile || data.phone || '') === normalizeMobile(pass)) {
              authData = data;
              break;
            }
          }
        } catch (_) {}
      }
    }
  }

  // 2. Realtime Database fallback for legacy accounts if Firestore returned no match
  if (!authData && rtdb) {
    try {
      const snapDirect = await get(ref(rtdb, `lms_users/${safeId}`));
      if (snapDirect.exists()) {
        const u = snapDirect.val();
        if (normalizeMobile(u.mobile || u.phone) === normalizeMobile(pass)) {
          authData = u;
        }
      }
      if (!authData && mobile) {
        const snapPhone = await get(ref(rtdb, `lms_users_phone/${mobile}`));
        if (snapPhone.exists()) {
          const u = snapPhone.val();
          if (normalizeMobile(u.mobile || u.phone) === normalizeMobile(pass)) {
            authData = u;
          }
        }
      }
    } catch (_) {}
  }

  if (!authData || !authData.studentId) {
    throw new Error('Invalid email/mobile or password. Please verify your credentials.');
  }

  // Establish authenticated session via anonymous auth mapped to studentId
  const cred = await signInAnonymously(auth);
  await setDoc(doc(db, 'uid_map', cred.user.uid), { studentId: authData.studentId });

  // Fetch canonical student record
  let studentRecord = { studentId: authData.studentId, email: authData.email || email, mobile: authData.mobile || mobile };
  try {
    const stuSnap = await getDoc(doc(db, 'students', authData.studentId));
    if (stuSnap.exists()) {
      studentRecord = { ...stuSnap.data(), ...studentRecord };
    }
  } catch (_) {}

  return studentRecord;
}

export async function adminLogin(email, password) {
  ensure();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const adminSnap = await getDoc(doc(db, 'admins', cred.user.uid));
  if (!adminSnap.exists()) {
    await signOut(auth);
    throw new Error('This account does not have admin access');
  }
  return cred.user;
}

// Resolves with the admin user, or redirects to the admin login page.
export function requireAdmin() {
  return new Promise((resolve) => {
    if (!isConfigured) { location.href = 'login.html?setup=1'; return; }
    onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = 'login.html'; return; }
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (!adminSnap.exists()) { await signOut(auth); location.href = 'login.html'; return; }
      resolve(user);
    });
  });
}

// A secondary Firebase app instance lets admins create Auth users
// without being signed out of their own session.
let secondaryApp = null;
function secondaryAuth() {
  if (!secondaryApp) secondaryApp = initializeApp(firebaseConfig, 'user-factory');
  return getAuth(secondaryApp);
}

export async function adminCreateUser(email, password) {
  ensure();
  const sAuth = secondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(sAuth, email, password);
    return cred.user.uid;
  } finally {
    await signOut(sAuth);
  }
}

// Creates the LMS credential record:
// Canonical student record is saved in /students/{studentId}.
// Lightweight lookup pointer is saved in /lms_auth/{key}.
// ZERO duplicate profile copies across RTDB and Firestore!
export async function createLmsAccount(student, username, password) {
  ensure();
  const uname = String(username || '').trim().toLowerCase();
  if (!uname) throw new Error('Username is required');
  const email = normalizeEmail(student.email);
  const mobile = normalizeMobile(student.phone || student.mobile || '');

  const safeEmail = email.replace(/[.#$\[\]@]/g, '_');
  const safeUname = uname.replace(/[.#$\[\]@]/g, '_');

  const compactAuthRecord = {
    studentId: student.studentId,
    email,
    mobile,
    active: true,
    createdAt: Date.now()
  };

  if (db) {
    // 1. Primary canonical store: /students/{studentId}
    await setDoc(doc(db, 'students', student.studentId), {
      lms: { username: uname, email, mobile, active: true, createdAt: Date.now() }
    }, { merge: true });

    // 2. Lightweight lookup pointer for direct O(1) login (no duplicate profile copies)
    await setDoc(doc(db, 'lms_auth', `email_${safeEmail}`), compactAuthRecord);
    if (safeUname !== safeEmail) {
      await setDoc(doc(db, 'lms_auth', `email_${safeUname}`), compactAuthRecord);
    }
    if (mobile) {
      await setDoc(doc(db, 'lms_auth', `phone_${mobile}`), compactAuthRecord);
    }
  }

  return { uid: '', username: uname };
}

export const resetPasswordEmail = (email) => { ensure(); return sendPasswordResetEmail(auth, email); };
