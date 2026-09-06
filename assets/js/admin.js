import { requireAdmin, logout } from './auth.js';
import { getSettings } from './database.js';
import { esc, initTheme, setTheme } from './utils.js';

const ADMIN_LINKS = [
  { href: 'dashboard.html', key: 'dashboard', label: 'Dashboard', icon: 'D' },
  { href: 'students.html', key: 'students', label: 'Students', icon: 'S' },
  { href: 'applications.html', key: 'applications', label: 'Applications', icon: 'A' },
  { href: 'domains.html', key: 'domains', label: 'Domains', icon: 'DM' },
  { href: 'tasks.html', key: 'tasks', label: 'Tasks', icon: 'T' },
  { href: 'submissions.html', key: 'submissions', label: 'Submissions', icon: 'SB' },
  { href: 'payments.html', key: 'payments', label: 'Payments', icon: 'P' },
  { href: 'razorpay.html', key: 'razorpay', label: 'Razorpay', icon: 'RZ' },
  { href: 'certificates.html', key: 'certificates', label: 'Certificates', icon: 'C' },
  { href: 'contacts.html', key: 'contacts', label: 'Contacts', icon: 'CT' },
  { href: 'feedback.html', key: 'feedback', label: 'Feedback', icon: 'F' },
  { href: 'settings.html', key: 'settings', label: 'Settings', icon: 'ST' }
];

function sidebarHtml(settings, active) {
  const c = settings.company || {};
  let logoSrc = c.logoUrl || 'assets/img/company-logo.png';
  if (!logoSrc.startsWith('http') && !logoSrc.startsWith('/') && !logoSrc.startsWith('../')) {
    logoSrc = `../${logoSrc}`;
  }
  const logo = `<div class="h-9 w-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm border border-slate-200/80 shrink-0"><img src="${esc(logoSrc)}" class="h-full w-full object-contain" alt="logo"></div>`;
  return `
  <aside id="admin-sidebar" class="fixed z-40 inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex-col hidden md:flex">
    <div class="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200 dark:border-slate-700">
      ${logo}<span class="font-extrabold text-slate-900 dark:text-white">${esc(c.name || 'Admin')}</span>
    </div>
    <nav class="flex-1 overflow-y-auto p-4 space-y-1">
      ${ADMIN_LINKS.map((l) => `<a href="${l.href}" class="side-link ${active === l.key ? 'active' : ''}"><span class="side-icon">${l.icon}</span>${l.label}</a>`).join('')}
    </nav>
    <div class="p-4 border-t border-slate-200 dark:border-slate-700">
      <a href="../index.html" class="side-link"><span class="side-icon">W</span>View Website</a>
    </div>
  </aside>`;
}

function topbarHtml(user, active) {
  return `
  <header class="fixed top-0 right-0 left-0 md:left-64 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6">
    <div class="flex items-center gap-3">
      <button id="admin-menu-btn" class="icon-btn md:hidden" aria-label="Menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <h1 id="page-title" class="text-lg font-bold text-slate-900 dark:text-white"></h1>
    </div>
    <div class="flex items-center gap-2">
      <button id="theme-toggle" class="icon-btn" aria-label="Toggle dark mode">
        <svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 15A9.75 9.75 0 0 1 9 2.25 9.72 9.75 0 0 0 3.25 15a9.75 9.75 0 0 0 18.5 0Z"/></svg>
        <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.25"/><path stroke-linecap="round" d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>
      </button>
      <span class="hidden sm:inline text-sm text-slate-500 dark:text-slate-300">${esc(user.email || '')}</span>
      <button id="admin-logout" class="btn btn-outline btn-sm">Logout</button>
    </div>
  </header>
  <div id="mobile-admin-nav" class="hidden md:hidden fixed inset-0 z-50">
    <div class="absolute inset-0 bg-slate-900/60" id="mobile-nav-backdrop"></div>
    <div class="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 p-4 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <span class="font-bold text-slate-900 dark:text-white">Menu</span>
        <button id="mobile-nav-close" class="icon-btn" aria-label="Close">✕</button>
      </div>
      <nav class="space-y-1">${ADMIN_LINKS.map((l) => `<a href="${l.href}" class="side-link ${active === l.key ? 'active' : ''}"><span class="side-icon">${l.icon}</span>${l.label}</a>`).join('')}</nav>
    </div>
  </div>`;
}

// Guards an admin page: requires an authenticated admin, renders the shared
// chrome (sidebar + topbar), and returns { user, settings } for page code.
export async function initAdminPage(active) {
  initTheme();
  const user = await requireAdmin();
  const settings = await getSettings();

  const wrap = document.createElement('div');
  wrap.innerHTML = sidebarHtml(settings, active) + topbarHtml(user, active);
  while (wrap.firstChild) document.body.prepend(wrap.firstChild);

  // Mark the active item in the mobile nav too
  document.querySelectorAll('#mobile-admin-nav .side-link').forEach((a) => {
    if (a.getAttribute('href') === `${active}.html`) a.classList.add('active');
  });

  const main = document.getElementById('content');
  if (main) main.classList.add('md:pl-64', 'pt-16');

  const link = ADMIN_LINKS.find((l) => l.key === active);
  const title = document.getElementById('page-title');
  if (title && link) title.textContent = link.label;
  document.title = `${link ? link.label : 'Admin'} · ${settings.company?.name || 'Admin'}`;

  document.getElementById('admin-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-admin-nav').classList.remove('hidden');
  });
  document.getElementById('mobile-nav-close')?.addEventListener('click', () => {
    document.getElementById('mobile-admin-nav').classList.add('hidden');
  });
  document.getElementById('mobile-nav-backdrop')?.addEventListener('click', () => {
    document.getElementById('mobile-admin-nav').classList.add('hidden');
  });
  document.getElementById('theme-toggle')?.addEventListener('click', () => setTheme(!document.documentElement.classList.contains('dark')));
  document.getElementById('admin-logout')?.addEventListener('click', async () => { await logout(); location.href = 'login.html'; });

  return { user, settings };
}

// Confirm dialog helper (Promise-based).
export function confirmDialog(message, { danger = true } = {}) {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal" style="width:min(420px,calc(100vw - 2rem))">
        <div class="modal-body pt-5">
          <p class="text-sm text-slate-700 dark:text-slate-200">${esc(message)}</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline btn-sm" data-r="0">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-r="1">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    root.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
      root.remove();
      resolve(b.dataset.r === '1');
    }));
  });
}

// Generic loading / empty / error blocks for list pages.
export const loadingBlock = () => `<div class="loading">Loading…</div>`;
export const emptyBlock = (msg = 'Nothing here yet.') => `<div class="py-12 text-center text-slate-400 text-sm">${esc(msg)}</div>`;
export const errorBlock = (e) => `<div class="py-10 text-center text-rose-500 text-sm">Error: ${esc(e.message || e)}</div>`;
