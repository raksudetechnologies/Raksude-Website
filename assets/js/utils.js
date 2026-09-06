import { db } from './firebase-config.js';
import { doc, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// ---------- Status constants ----------
export const PAYMENT = { NOT_PAID: 'NOT_PAID', PENDING: 'PENDING', PAID: 'PAID', REJECTED: 'REJECTED' };
export const INTERNSHIP = { UPCOMING: 'UPCOMING', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED' };
export const CERT_STATUS = { LOCKED: 'LOCKED', UNLOCKED: 'UNLOCKED' };
export const APP_STATUS = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' };
export const SUB_STATUS = { SUBMITTED: 'SUBMITTED', COMPLETED: 'COMPLETED' };
export const TOTAL_DAYS = 30;
// Week N unlocks on day (N-1)*7 + 1  ->  W1: day 1, W2: day 8, W3: day 15, W4: day 22
export const weekUnlockDay = (week) => (week - 1) * 7 + 1;

// ---------- Date helpers (local, ISO YYYY-MM-DD strings) ----------
const pad2 = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayStr = () => toISO(new Date());
export const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);
export const fmtDate = (iso) => (iso ? parseISO(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtTs = (ms) => (ms ? new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Individual internship calculation using the student's actual duration (days).
// totalDays defaults to TOTAL_DAYS (30) for backward compatibility.
export function calcInternship(startDate, totalDays = TOTAL_DAYS) {
  const days = Number(totalDays) || TOTAL_DAYS;
  const today = todayStr();
  const endDate = addDays(startDate, days - 1);
  let status, currentDay, remainingDays;
  if (today < startDate) { status = INTERNSHIP.UPCOMING; currentDay = 0; remainingDays = days; }
  else if (today > endDate) { status = INTERNSHIP.COMPLETED; currentDay = days; remainingDays = 0; }
  else { status = INTERNSHIP.ACTIVE; currentDay = diffDays(today, startDate) + 1; remainingDays = days - currentDay; }
  const totalWeeks = Math.max(1, Math.ceil(days / 7));
  const week = currentDay <= 0 ? 1 : Math.min(totalWeeks, Math.ceil(currentDay / 7));
  return { startDate, endDate, totalDays: days, currentDay, remainingDays, status, week, totalWeeks, progressPct: Math.round((currentDay / days) * 100) };
}

// ---------- Sequential ID counters (Firestore transactions) ----------
export async function nextId(name) {
  const ref = doc(db, 'counters', name);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const seq = (snap.exists() ? (snap.data().seq || 0) : 0) + 1;
    tx.set(ref, { seq });
    return seq;
  });
}
export const padNum = (n, len) => String(n).padStart(len, '0');
export const currentYear = () => new Date().getFullYear();

// ---------- DOM / misc helpers ----------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const qs = (name) => new URLSearchParams(location.search).get(name);
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

export function toast(msg, type = 'info') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

export function showFatal(msg) {
  const host = document.getElementById('fatal') || document.body;
  host.innerHTML = `<div class="card" style="max-width:640px;margin:80px auto;padding:28px;text-align:center">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">Setup Required</h2>
    <p style="color:#64748b">${msg}</p></div>`;
}

export function genPassword(len = 10) {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let p = '';
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

const BADGE_COLOR = {
  PAID: 'green', APPROVED: 'green', COMPLETED: 'green', ACTIVE: 'green', UNLOCKED: 'green',
  SUBMITTED: 'blue', PENDING: 'amber', UPCOMING: 'amber',
  NOT_PAID: 'gray', LOCKED: 'gray', NOT_STARTED: 'gray', INACTIVE: 'gray',
  REJECTED: 'red'
};
export const badge = (status) => `<span class="badge badge-${BADGE_COLOR[status] || 'gray'}">${esc(String(status || '').replace(/_/g, ' '))}</span>`;

export function exportCSV(filename, rows) {
  if (!rows || !rows.length) { toast('No data to export', 'error'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

// Optional EmailJS notifications (enabled via Admin Settings)
export async function sendEmail(settings, params) {
  const cfg = settings?.emailjs;
  if (!cfg?.enabled || !cfg.publicKey) return false;
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
    await emailjs.send(cfg.serviceId, cfg.templateId, params, cfg.publicKey);
    return true;
  } catch (e) { console.warn('EmailJS failed', e); return false; }
}

// ---------- Theme ----------
export function setTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}
export const initTheme = () => setTheme(localStorage.getItem('theme') === 'dark');

// ---------- Print & download ----------
export function printElement(el) {
  const clone = el.cloneNode(true);
  clone.classList.add('print-area');
  document.body.appendChild(clone);
  window.print();
  setTimeout(() => clone.remove(), 500);
}

export async function downloadAsImage(el, filename) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

// Renders an element to an A4 PDF (html2canvas + jsPDF).
// captureWidth: force a fixed layout width (viewport-independent).
// fitSinglePage: shrink slightly to fit one page when content just overflows.
export async function downloadAsPdf(el, filename, { captureWidth = null, fitSinglePage = false } = {}) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

  const prevWidth = el.style.width;
  const prevMaxWidth = el.style.maxWidth;
  if (captureWidth) { el.style.width = `${captureWidth}px`; el.style.maxWidth = 'none'; }
  let canvas;
  try {
    canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  } finally {
    el.style.width = prevWidth;
    el.style.maxWidth = prevMaxWidth;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = 210, pageH = 297;
  const img = canvas.toDataURL('image/jpeg', 0.92);
  const imgH = canvas.height * pageW / canvas.width;

  if (fitSinglePage && imgH > pageH && imgH <= pageH * 1.25) {
    const k = pageH / imgH;
    const w = pageW * k;
    pdf.addImage(img, 'JPEG', (pageW - w) / 2, 0, w, pageH);
  } else {
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(img, 'JPEG', 0, position, pageW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, position, pageW, imgH);
      heightLeft -= pageH;
    }
  }
  pdf.save(filename);
}
