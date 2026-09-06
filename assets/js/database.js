import { db, rtdb } from './firebase-config.js';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import {
  ref, push, get, query as rQuery, limitToLast, update as rUpdate
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import {
  nextId, padNum, currentYear, todayStr, addDays,
  APP_STATUS, PAYMENT, CERT_STATUS, SUB_STATUS
} from './utils.js';
import { createLmsAccount } from './auth.js';

export const defaultLogoUrl = 'assets/img/company-logo.png';

export const defaultSettings = {
  company: {
    name: 'Raksude Tech', tagline: 'Empowering future innovators with real-world internship experience',
    logoUrl: defaultLogoUrl, faviconUrl: defaultLogoUrl, email: 'support@raksude.com', phone: '+91 98765 43210',
    address: '12, Tech Park, Bengaluru, Karnataka, India', website: '',
    facebook: '', twitter: '', linkedin: '', instagram: ''
  },
  home: {
    heroTitle: 'Kickstart Your Career With Our 30-Day Internship Program',
    heroSubtitle: 'Hands-on projects, weekly tasks, industry mentoring and a verified certificate — all from anywhere.',
    ctaText: 'Apply Now'
  },
  about: {
    mission: 'To make industry-ready skills accessible to every student through structured, mentor-guided internships.',
    vision: 'A world where every graduate enters the workforce with real project experience and confidence.',
    history: 'We started with a single batch of 10 students and have grown into a platform that mentors students across dozens of domains.',
    methodology: 'Each intern follows an individual 30-day plan: Week 1 fundamentals, Week 2 guided practice, Week 3 project build, Week 4 final project and review.'
  },
  payment: {
    qrEnabled: true, razorpayEnabled: false, stopPayment: false,
    qrImageUrl: '', qrUpiId: '', amount: 2999,
    razorpayKeyId: '',
    instructions: 'Scan the QR code with any UPI app, pay the exact amount, then submit your transaction ID below for verification.',
    razorpayFunctionsUrl: ''
  },
  certificate: { prefix: 'CERT', authorizedName: 'A. Kumar', designation: 'Founder & CEO', signatureUrl: 'assets/img/founder-signature.png', logoUrl: 'assets/img/certificate-logo.png', sealUrl: 'assets/img/certificate-seal.png', msmeUrl: 'assets/img/msme-badge.png' },
  policies: {
    privacy: `<div class="policy-document space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
  <div class="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
    <p class="font-bold text-slate-900 dark:text-white">Effective Date: September 2026 | Raksude Technologies Privacy Policy</p>
    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Compliant with Information Technology Act, 2000 & SPDI Rules. Complete data protection for applicants, enrolled interns, and certificate holders.</p>
  </div>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">1. Information Collection & Usage</h3>
  <p>Raksude Technologies collects personal identification (Name, Email, Phone, Address), educational credentials (College, Degree, Department, Roll Number), and LMS task deliverables solely to conduct virtual internships, evaluate progress, and issue verified completion certificates.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">2. Official Razorpay Payment Security</h3>
  <p>All fee transactions are processed through the RBI-authorized, PCI-DSS Level 1 certified Razorpay Payment Gateway. We do not store card numbers, CVVs, or bank credentials. Transactions are verified server-side using HMAC-SHA256 cryptography.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">3. Zero Data Sale Guarantee</h3>
  <p>We do not sell, rent, or lease personal information to third parties. Data is shared exclusively with necessary cloud infrastructure providers (Google Cloud / Firebase) to maintain platform uptime and database integrity.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">4. Student Rights & Lifelong Verification</h3>
  <p>Certificate verification records are securely preserved to ensure continuous validation for academic and employment background checks. Students may request data corrections by contacting our support desk.</p>
  <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono space-y-1">
    <p><strong>Contact:</strong> Raksude Technologies — Privacy Cell</p>
    <p><strong>Email:</strong> support@techintern.example | <strong>Phone:</strong> +91 98765 43210</p>
    <p><strong>Address:</strong> 12, Tech Park, Bengaluru, Karnataka, India - 560100</p>
  </div>
</div>`,

    refund: `<div class="policy-document space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
  <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
    <p class="font-bold text-slate-900 dark:text-white">Raksude Technologies — Transparent Refund & Cancellation Policy</p>
    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Please review cancellation guidelines and Razorpay transaction reversal rules.</p>
  </div>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">1. Nature of Enrollment Fee</h3>
  <p>The nominal fee covers LMS access provisioning, curriculum hosting, mentor evaluations, MSME accreditation verification, and cryptographic certificate issuance.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">2. Eligible Refund Conditions</h3>
  <p>• <strong>3-Day Cancellation Window:</strong> 100% refund if requested within 3 calendar days (72 hours) of payment, provided no milestone tasks have been submitted on the LMS.<br>
  • <strong>Duplicate Charges:</strong> Full automatic refund for multiple deductions resulting from network timeouts or gateway errors.<br>
  • <strong>Service Unavailability:</strong> Full refund if Raksude Technologies cannot provide the chosen internship track.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">3. Non-Refundable Scenarios</h3>
  <p>Refunds are not granted once milestone tasks have been submitted, once the certificate has been unlocked, after 3 days from payment, or in cases of academic dishonesty/plagiarism.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">4. Refund Process & Timelines</h3>
  <p>To request a refund, email support@techintern.example with your Student ID, Razorpay Payment ID, and transaction details. Valid refunds are processed via Razorpay back to your original payment method within 5 to 7 business days.</p>
  <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono space-y-1">
    <p><strong>Billing Desk:</strong> support@techintern.example | <strong>Phone:</strong> +91 98765 43210</p>
    <p><strong>Address:</strong> 12, Tech Park, Bengaluru, Karnataka, India</p>
  </div>
</div>`,

    terms: `<div class="policy-document space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
  <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
    <p class="font-bold text-slate-900 dark:text-white">Raksude Technologies — Terms & Conditions Agreement</p>
    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Legally binding agreement governing platform participation, code of conduct, certification, and Razorpay checkout.</p>
  </div>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance & Program Modality</h3>
  <p>By applying or accessing the LMS, you agree to these Terms. The internship is a 30-day remote virtual experiential training program consisting of milestone tasks and mentor reviews.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">2. Code of Conduct & Anti-Plagiarism</h3>
  <p>Interns must submit original code and project files. Submitting copied repositories, plagiarized work, or falsifying information will result in immediate disqualification without certificate or refund.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">3. Official Razorpay Payment Terms</h3>
  <p>Enrollment fees are processed exclusively through the official Razorpay Payment Gateway (supporting UPI and Cards). Instant verification is authenticated server-side using HMAC-SHA256 signatures.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">4. Certification & Employment Disclaimer</h3>
  <p>Official completion certificates are issued upon fulfilling 30-day tenure, submitting all required tasks, and fee clearance. Each certificate carries a unique Certificate ID and QR code verifiable on verify-certificate.html. This internship does not constitute an offer of employment or salary contract.</p>
  <h3 class="text-lg font-bold text-slate-900 dark:text-white">5. Governing Law & Contact</h3>
  <p>Governed by the laws of India, subject to the jurisdiction of courts in Bengaluru/Tamil Nadu. For legal inquiries, contact support@techintern.example or call +91 98765 43210.</p>
</div>`
  },
  emailjs: { enabled: false, serviceId: '', templateId: '', publicKey: '' }
};

let _settings = null;
export async function getSettings(force = false) {
  if (_settings && !force) return _settings;
  let stored = {};
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'app'));
      if (snap.exists()) stored = snap.data();
    } catch (e) { console.warn('settings load failed', e); }
  }
  _settings = { ...structuredClone(defaultSettings), ...stored };
  for (const k of Object.keys(defaultSettings)) {
    _settings[k] = { ...defaultSettings[k], ...(stored[k] || {}) };
  }
  // If stored policy has only short dummy text, enhance it with default comprehensive policy
  if (_settings.policies) {
    for (const pKey of ['privacy', 'refund', 'terms']) {
      const val = _settings.policies[pKey] || '';
      if (val.length < 250 || val.includes('Your data is used only to run the internship program') || val.includes('Fees are refunded 100% if requested within 3 days')) {
        _settings.policies[pKey] = defaultSettings.policies[pKey];
      }
    }
  }
  // Fallback to Raksude Tech logo if stored logoUrl is blank or unset
  if (!_settings.company.logoUrl) _settings.company.logoUrl = defaultLogoUrl;
  if (!_settings.company.name) _settings.company.name = 'Raksude Tech';
  if (!_settings.certificate.logoUrl) _settings.certificate.logoUrl = _settings.company.logoUrl || defaultLogoUrl;
  return _settings;
}
export async function saveSettings(patch) {
  await setDoc(doc(db, 'settings', 'app'), patch, { merge: true });
  _settings = null;
  return getSettings(true);
}

// Secure Configurations (accessible only by authenticated Admin via strict Firestore rules)
export async function getSecureConfig(docId) {
  if (!db) return {};
  try {
    const snap = await getDoc(doc(db, 'secure_config', docId));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    console.warn(`Failed to fetch secure_config/${docId}:`, e);
    return {};
  }
}

export async function saveSecureConfig(docId, data) {
  if (!db) throw new Error('Database not initialized');
  await setDoc(doc(db, 'secure_config', docId), { ...data, updatedAt: Date.now() }, { merge: true });
  return getSecureConfig(docId);
}

const snapMap = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const readDoc = async (col, id) => {
  if (!db) return null;
  const s = await getDoc(doc(db, col, id));
  return s.exists() ? { id: d_id(s), ...s.data() } : null;
};
const d_id = (s) => s.id;

// ---------- Domains ----------
export async function listDomains({ includeInactive = false } = {}) {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'domains'));
  let rows = snapMap(snap);
  if (!includeInactive) rows = rows.filter((d) => d.status !== 'INACTIVE');
  return rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}
export const getDomain = (id) => readDoc('domains', id);
export const saveDomain = (data, id) => setDoc(doc(db, 'domains', id), data, { merge: true });
export const deleteDomain = (id) => deleteDoc(doc(db, 'domains', id));

// ---------- Applications ----------
export async function createApplication(data) {
  const email = String(data?.personal?.email || '').trim().toLowerCase();
  const domainId = String(data?.internship?.domainId || '').trim();

  // Duplicate guard via a deterministic lock doc (anonymous-safe: a direct get,
  // not a query over all applications).
  const lockId = email && domainId ? `${email}___${domainId}` : null;
  if (lockId && db) {
    const lock = await getDoc(doc(db, 'app_locks', lockId));
    if (lock.exists()) {
      const lockData = lock.data() || {};
      const sId = lockData.studentId || lockData.appId || '';
      return {
        ...data,
        appId: lockData.appId || 'APP-REGISTERED',
        studentId: sId,
        status: APP_STATUS.APPROVED,
        alreadyApplied: true
      };
    }
  }

  // Auto-generate IDs
  const appSeq = await nextId('applications');
  const appId = `APP-${currentYear()}-${padNum(appSeq, 4)}`;

  const stuSeq = await nextId('students');
  const studentId = `INT-${currentYear()}-${padNum(stuSeq, 4)}`;

  const feeAmount = Number((await getSettings()).payment?.amount || 0);
  const startDate = data.internship?.startDate || todayStr();

  // Fetch domain to get the configured duration (days) — default 30
  let domainDuration = 30;
  try {
    const domainId = data.internship?.domainId;
    if (domainId) {
      const domainDoc = await getDomain(domainId);
      if (domainDoc && domainDoc.duration && Number(domainDoc.duration) >= 1) {
        domainDuration = Number(domainDoc.duration);
      }
    }
  } catch (e) {
    console.warn('Could not fetch domain duration on apply:', e.message);
  }

  const endDate = data.internship?.endDate || addDays(startDate, domainDuration - 1);

  // 1. Create student document using domain-specific duration
  const student = {
    studentId, uid: '',
    name: data.personal?.fullName || '', email: data.personal?.email || '', phone: data.personal?.phone || '',
    gender: data.personal?.gender || '', dob: data.personal?.dob || '',
    address: data.personal?.address || '', city: data.personal?.city || '', state: data.personal?.state || '', country: data.personal?.country || '',
    college: data.academic?.college || '', degree: data.academic?.degree || '', department: data.academic?.department || '',
    yearOfStudy: data.academic?.yearOfStudy || '', rollNumber: data.academic?.rollNumber || data.academic?.rollNo || '',
    domainId: data.internship?.domainId || '', domainName: data.internship?.domainName || '',
    startDate,
    endDate,
    duration: domainDuration,
    certificateName: data.certificate?.name || data.personal?.fullName || '',
    paymentStatus: PAYMENT.NOT_PAID, certificateStatus: CERT_STATUS.LOCKED,
    feeAmount,
    lms: null, photoUrl: '', offerLetterUrl: '', active: true,
    applicationId: appId, createdAt: Date.now()
  };
  await setDoc(doc(db, 'students', studentId), student);


  // 2. Create application document - automatically approved
  const app = {
    ...data,
    appId,
    studentId,
    duration: domainDuration,        // domain days stored on application
    startDate,
    endDate,
    status: APP_STATUS.APPROVED,
    approvedAt: Date.now(),
    approvedBy: 'auto',
    createdAt: Date.now()
  };
  await setDoc(doc(db, 'applications', appId), app);

  if (lockId) await setDoc(doc(db, 'app_locks', lockId), { appId, studentId, email, createdAt: Date.now() });

  // 3. Auto-provision LMS account so student can login immediately after applying
  const uEmail = email;
  const uMobile = String(data.personal?.phone || '').replace(/\D/g, '');
  const uPass = uMobile.length >= 6 ? uMobile : '123456';
  if (uEmail) {
    try {
      await createLmsAccount({ studentId, email: uEmail, phone: uMobile }, uEmail, uPass);
    } catch (lmsErr) {
      console.warn('LMS account provision on apply:', lmsErr.message);
    }
  }

  await logActivity(`Application ${appId} auto-approved -> student ${studentId}`);
  return app;
}
export async function listApplications() {
  if (!db) return [];
  return snapMap(await getDocs(collection(db, 'applications'))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export const getApplication = (id) => readDoc('applications', id);
export const updateApplication = (id, patch) => setDoc(doc(db, 'applications', id), patch, { merge: true });
export const rejectApplication = (id) => updateDoc(doc(db, 'applications', id), { status: APP_STATUS.REJECTED });

// Approve: converts an application into a student document with its own 30-day window.
export async function approveApplication(app) {
  let studentId = app.studentId;
  let studentExists = false;
  if (studentId && db) {
    try {
      const snap = await getDoc(doc(db, 'students', studentId));
      if (snap.exists()) studentExists = true;
    } catch (_) {}
  }

  let studentObj = null;
  if (!studentId || !studentExists) {
    if (!studentId) {
      const seq = await nextId('students');
      studentId = `INT-${currentYear()}-${padNum(seq, 4)}`;
    }
    const feeAmount = Number((await getSettings()).payment?.amount || 0);
    const startDate = app.internship?.startDate || todayStr();

    // Fetch domain duration
    let domainDuration = 30;
    try {
      const domainId = app.internship?.domainId;
      if (domainId) {
        const domainDoc = await getDomain(domainId);
        if (domainDoc && domainDoc.duration && Number(domainDoc.duration) >= 1) {
          domainDuration = Number(domainDoc.duration);
        }
      }
    } catch (e) {
      console.warn('Could not fetch domain duration on approve:', e.message);
    }

    const endDate = app.internship?.endDate || addDays(startDate, domainDuration - 1);

    studentObj = {
      studentId, uid: '',
      name: app.personal?.fullName || '', email: app.personal?.email || '', phone: app.personal?.phone || '',
      gender: app.personal?.gender || '', dob: app.personal?.dob || '',
      address: app.personal?.address || '', city: app.personal?.city || '', state: app.personal?.state || '', country: app.personal?.country || '',
      college: app.academic?.college || '', degree: app.academic?.degree || '', department: app.academic?.department || '',
      yearOfStudy: app.academic?.yearOfStudy || '', rollNumber: app.academic?.rollNo || app.academic?.rollNumber || '',
      domainId: app.internship?.domainId || '', domainName: app.internship?.domainName || '',
      startDate,
      endDate,
      duration: domainDuration,
      certificateName: app.certificate?.name || app.personal?.fullName || '',
      paymentStatus: PAYMENT.NOT_PAID, certificateStatus: CERT_STATUS.LOCKED,
      feeAmount,
      lms: null, photoUrl: '', offerLetterUrl: '', active: true,
      applicationId: app.appId, createdAt: Date.now()
    };
    if (db) await setDoc(doc(db, 'students', studentId), studentObj);
  }

  if (db) {
    // Pull startDate/endDate/duration from the student object if newly created, else from app
    const appStartDate = studentObj?.startDate || app.internship?.startDate || app.startDate;
    const appEndDate = studentObj?.endDate || app.internship?.endDate || app.endDate;
    const appDuration = studentObj?.duration || app.duration || 30;
    await updateDoc(doc(db, 'applications', app.appId), {
      status: APP_STATUS.APPROVED,
      studentId,
      duration: appDuration,
      startDate: appStartDate,
      endDate: appEndDate
    });
  }

  // Automatic LMS account provisioning
  const uEmail = String(app.personal?.email || '').trim().toLowerCase();
  const uMobile = String(app.personal?.phone || '').replace(/\D/g, '');
  const uPass = uMobile.length >= 6 ? uMobile : '123456';
  if (uEmail) {
    try {
      await createLmsAccount({ studentId, email: uEmail, phone: uMobile }, uEmail, uPass);
    } catch (lmsErr) {
      console.warn('LMS account provision note:', lmsErr.message);
    }
  }

  await logActivity(`Application ${app.appId} approved -> student ${studentId}`);
  return studentId;
}

// ---------- Students ----------
export async function listStudents({ includeInactive = false } = {}) {
  if (!db) return [];
  let rows = snapMap(await getDocs(collection(db, 'students')));
  if (!includeInactive) rows = rows.filter((s) => s.active !== false);
  return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export const getStudent = (id) => readDoc('students', id);
export async function getStudentByUid(uid) {
  if (!db || !uid) return null;
  const map = await getDoc(doc(db, 'uid_map', uid));
  if (!map.exists()) return null;
  return getStudent(map.data().studentId);
}
export const saveStudent = (studentId, patch) => setDoc(doc(db, 'students', studentId), patch, { merge: true });

export async function createStudentManual(data) {
  const seq = await nextId('students');
  const studentId = `INT-${currentYear()}-${padNum(seq, 4)}`;
  const startDate = data.startDate || todayStr();

  let domainDuration = Number(data.duration) || 0;
  if (!domainDuration && data.domainId) {
    try {
      const domainDoc = await getDomain(data.domainId);
      if (domainDoc && domainDoc.duration && Number(domainDoc.duration) >= 1) {
        domainDuration = Number(domainDoc.duration);
      }
    } catch (_) {}
  }
  if (!domainDuration) domainDuration = 30;

  const endDate = data.endDate || addDays(startDate, domainDuration - 1);

  const student = {
    uid: '', gender: '', dob: '', address: '', city: '', state: '', country: '',
    degree: '', department: '', yearOfStudy: '', rollNumber: '', phone: '',
    certificateName: data.name || '', paymentStatus: PAYMENT.NOT_PAID, certificateStatus: CERT_STATUS.LOCKED,
    feeAmount: Number((await getSettings()).payment?.amount || 0),
    lms: null, photoUrl: '', offerLetterUrl: '', active: true, createdAt: Date.now(),
    ...data, studentId, startDate, endDate, duration: domainDuration
  };
  await setDoc(doc(db, 'students', studentId), student);
  await logActivity(`Student ${studentId} created manually`);
  return student;
}

// ---------- Tasks ----------
export async function listTasks({ domainId, week, includeInactive = false } = {}) {
  if (!db) return [];
  let rows = snapMap(await getDocs(collection(db, 'tasks')));
  if (domainId) rows = rows.filter((t) => t.domainId === domainId);
  if (week) rows = rows.filter((t) => Number(t.week) === Number(week));
  if (!includeInactive) rows = rows.filter((t) => t.active !== false);
  return rows.sort((a, b) => (Number(a.week) - Number(b.week)) || (Number(a.order) - Number(b.order)) || (a.title || '').localeCompare(b.title || ''));
}
export const saveTask = (data, id) => setDoc(doc(db, 'tasks', id || doc(collection(db, 'tasks')).id), data, { merge: true });
export const deleteTask = (id) => deleteDoc(doc(db, 'tasks', id));

// ---------- Submissions ----------
// Submissions are auto-approved on submit; the only manual review left is QR payments.
export async function submitTask(sub) {
  const id = `${sub.studentId}_${sub.taskId}`;
  const now = Date.now();
  await setDoc(doc(db, 'submissions', id), {
    ...sub, id, status: SUB_STATUS.COMPLETED, submittedAt: now, approvedAt: now, approvedBy: 'auto'
  }, { merge: true });
  await pushNotification(sub.studentId, 'Task approved', `"${sub.taskTitle}" was submitted and approved automatically. Keep going!`);
  await logActivity(`${sub.studentId} submitted "${sub.taskTitle}" (${sub.githubUrl}) — auto-approved`);
  return id;
}
export async function listSubmissions({ studentId } = {}) {
  if (!db) return [];
  const snap = studentId
    ? await getDocs(query(collection(db, 'submissions'), where('studentId', '==', studentId)))
    : await getDocs(collection(db, 'submissions'));
  return snapMap(snap).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
}
export const setSubmissionStatus = (id, status) => updateDoc(doc(db, 'submissions', id), { status });

// ---------- Payments ----------
export async function createPayment(p) {
  const id = doc(collection(db, 'payments')).id;
  const payment = { ...p, id, createdAt: Date.now() };
  await setDoc(doc(db, 'payments', id), payment);
  return payment;
}
export async function listPayments() {
  if (!db) return [];
  return snapMap(await getDocs(collection(db, 'payments'))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Auto-approve a Razorpay payment from JS SDK callback (no backend needed).
// Creates an APPROVED record, marks student PAID, and pushes notification.
export async function approveRazorpayPayment(studentId, razorpayPaymentId, amount, studentName = '', domainName = '') {
  let sName = studentName;
  let dName = domainName;
  if (!sName || !dName) {
    try {
      const sDoc = await getStudent(studentId);
      if (sDoc) {
        if (!sName) sName = sDoc.name || sDoc.certificateName || '';
        if (!dName) dName = sDoc.domainName || '';
      }
    } catch (_) {}
  }

  const payment = await createPayment({
    studentId,
    name: sName,
    domainName: dName,
    amount: Number(amount),
    method: 'RAZORPAY',
    razorpayPaymentId,
    paymentDate: todayStr(),
    status: 'APPROVED',
    paymentVerified: true
  });
  await saveStudent(studentId, {
    paymentStatus: PAYMENT.PAID,
    certificateStatus: 'UNLOCKED',
    paymentVerified: true,
    paymentId: razorpayPaymentId,
    paymentDate: new Date().toISOString()
  });
  await pushNotification(studentId, 'Payment successful 🎉',
    `Your Razorpay payment of ₹${amount} was received. Your certificate is now unlocked!`);
  await logActivity(`Razorpay auto-approved & certificate unlocked: ${studentId} (${razorpayPaymentId}) ₹${amount}`);
  return payment;
}

export async function reviewQrPayment(payment, approve) {
  await updateDoc(doc(db, 'payments', payment.id), { status: approve ? 'APPROVED' : 'REJECTED', reviewedAt: Date.now() });
  await saveStudent(payment.studentId, { paymentStatus: approve ? PAYMENT.PAID : PAYMENT.REJECTED });
  await pushNotification(payment.studentId,
    approve ? 'Payment approved' : 'Payment rejected',
    approve ? 'Your payment was verified successfully. Your internship is now fully active.'
            : 'Your payment could not be verified. Please contact support or submit payment again.');
  await logActivity(`QR payment ${approve ? 'approved' : 'rejected'} for ${payment.studentId} (txn ${payment.transactionId})`);
}


// Admin records an offline/manual payment (cash, offline UPI, bank transfer…).
// Creates an APPROVED payment record and marks the student PAID.
export async function recordManualPayment(student, { amount, method = 'MANUAL', note = '' } = {}) {
  const payment = await createPayment({
    studentId: student.studentId, name: student.name, domainName: student.domainName,
    amount: Number(amount), method, transactionId: note || 'manual', paymentDate: todayStr(),
    status: 'APPROVED'
  });
  await saveStudent(student.studentId, { paymentStatus: PAYMENT.PAID });
  await pushNotification(student.studentId, 'Payment approved',
    'Your payment was recorded and verified. Your internship is now fully active.');
  await logActivity(`Manual payment recorded for ${student.studentId} (${method} ${amount})`);
  return payment;
}

// ---------- Certificates ----------
export async function createCertificate(student, settings, { manual = false } = {}) {
  const seq = await nextId('certificates');
  const prefix = settings?.certificate?.prefix || 'CERT';
  const certificateId = `${prefix}-${currentYear()}-${padNum(seq, 6)}`;
  // Use the student's domain duration if stored, otherwise derive from start/end dates
  const duration = student.duration || student.domainDuration
    || (student.startDate && student.endDate
        ? Math.round((new Date(student.endDate) - new Date(student.startDate)) / 86400000) + 1
        : 30);
  const cert = {
    certificateId, studentId: student.studentId,
    name: student.certificateName || student.name,
    domainName: student.domainName, startDate: student.startDate, endDate: student.endDate,
    duration,
    issueDate: todayStr(),
    companyName: settings?.company?.name || '',
    authorizedName: settings?.certificate?.authorizedName || '',
    designation: settings?.certificate?.designation || '',
    manual, createdAt: Date.now()
  };
  await setDoc(doc(db, 'certificates', certificateId), cert);
  await saveStudent(student.studentId, { certificateStatus: CERT_STATUS.UNLOCKED, certificateId });
  await pushNotification(student.studentId, 'Certificate unlocked', 'Your internship certificate is ready. Open the Certificate page to view and download it.');
  await logActivity(`Certificate ${certificateId} issued to ${student.studentId}${manual ? ' (manual)' : ''}`);
  return cert;
}
export const getCertificate = (id) => readDoc('certificates', id);
export async function listCertificates() {
  if (!db) return [];
  return snapMap(await getDocs(collection(db, 'certificates'))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// ---------- Contacts & feedback ----------
export async function addContact(c) {
  const id = doc(collection(db, 'contacts')).id;
  await setDoc(doc(db, 'contacts', id), { ...c, id, read: false, createdAt: Date.now() });
  await logActivity(`New contact message from ${c.name || 'visitor'}`);
  return id;
}
export async function listContacts() {
  if (!db) return [];
  return snapMap(await getDocs(collection(db, 'contacts'))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export const setContactRead = (id, read) => updateDoc(doc(db, 'contacts', id), { read });
export const deleteContact = (id) => deleteDoc(doc(db, 'contacts', id));

export async function addFeedback(f) {
  await setDoc(doc(db, 'feedback', f.studentId), { ...f, createdAt: Date.now() });
  await logActivity(`Feedback (${f.rating} stars) from ${f.studentId}`);
}
export async function listFeedback() {
  if (!db) return [];
  return snapMap(await getDocs(collection(db, 'feedback'))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// ---------- Realtime Database: notifications & activity ----------
export async function pushNotification(studentId, title, body) {
  if (!rtdb) return;
  try { await push(ref(rtdb, `notifications/${studentId}`), { title, body, read: false, createdAt: Date.now() }); } catch (e) { console.warn(e); }
}
export async function getNotifications(studentId) {
  if (!rtdb) return [];
  try {
    const snap = await get(rQuery(ref(rtdb, `notifications/${studentId}`), limitToLast(20)));
    const val = snap.val() || {};
    return Object.entries(val).map(([key, v]) => ({ key, ...v })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch { return []; }
}
export async function markNotificationsRead(studentId) {
  if (!rtdb) return;
  try {
    const notes = await getNotifications(studentId);
    const upd = {};
    notes.forEach((n) => { if (!n.read) upd[`${n.key}/read`] = true; });
    if (Object.keys(upd).length) await rUpdate(ref(rtdb, `notifications/${studentId}`), upd);
  } catch (e) { console.warn(e); }
}
export async function logActivity(text) {
  if (!rtdb) return;
  try { await push(ref(rtdb, 'activity'), { text, createdAt: Date.now() }); } catch { /* non-fatal */ }
}
export async function getActivity(limit = 20) {
  if (!rtdb) return [];
  try {
    const snap = await get(rQuery(ref(rtdb, 'activity'), limitToLast(limit)));
    return Object.values(snap.val() || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch { return []; }
}
