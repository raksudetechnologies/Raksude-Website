import { getStudentByUid, listTasks, listSubmissions, getNotifications, markNotificationsRead } from './database.js';
import { esc, initTheme, setTheme, fmtTs } from './utils.js';
import { logout } from './auth.js';

export const getMyStudent = (user) => (user ? getStudentByUid(user.uid) : null);

// Aggregate task progress for a student across all 4 weeks.
export async function getTaskProgress(student) {
  const [tasks, subs] = await Promise.all([
    listTasks({ domainId: student.domainId }),
    listSubmissions({ studentId: student.studentId })
  ]);
  const byTask = Object.fromEntries(subs.map((s) => [s.taskId, s]));
  const total = tasks.length;
  const submitted = tasks.filter((t) => byTask[t.id]).length;
  const completed = tasks.filter((t) => byTask[t.id]?.status === 'COMPLETED').length;
  return { total, submitted, completed, pct: total ? Math.round((completed / total) * 100) : 0, tasks, byTask };
}

const LMS_LINKS = [
  { hash: '#dashboard', key: 'dashboard', label: 'Dashboard', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>` },
  { hash: '#tasks', key: 'tasks', label: 'Tasks', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>` },
  { hash: '#payment', key: 'payment', label: 'Payment', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>` },
  { hash: '#idcard', key: 'idcard', label: 'ID Card', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"/></svg>` },
  { hash: '#offer', key: 'offer', label: 'Offer Letter', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>` },
  { hash: '#certificate', key: 'certificate', label: 'Certificate', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0H9.497m5.003 0a3 3 0 0 0 2.25-2.88V7.5a3 3 0 0 0-3-3H10.25a3 3 0 0 0-3 3v5.245a3 3 0 0 0 2.25 2.88"/></svg>` },
  { hash: '#feedback', key: 'feedback', label: 'Feedback', iconSvg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 49.188 49.188 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>` }
];

// Renders the LMS topbar + sidebar into #lms-chrome.
// Idempotent: subsequent calls only refresh the active link highlight.
export async function renderLmsChrome(student, settings, activeKey) {
  initTheme();
  const c = settings.company || {};
  const host = document.getElementById('lms-chrome');
  if (!host) return;

  // Update active links if already rendered
  if (host.dataset.rendered) {
    host.querySelectorAll('a.side-link').forEach((a) => {
      a.classList.toggle('active', a.dataset.key === activeKey);
    });
    document.querySelectorAll('.lms-mobile-bottom-item').forEach((a) => {
      a.classList.toggle('active', a.dataset.key === activeKey);
    });
    return;
  }
  host.dataset.rendered = '1';

  const name = esc(c.name || 'Internship Portal');
  const logoSrc = c.logoUrl || 'assets/img/company-logo.png';
  const logo = `<div class="h-9 w-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm border border-slate-200/80 shrink-0"><img src="${esc(logoSrc)}" class="h-full w-full object-contain" alt="logo"></div>`;

  host.innerHTML = `
  <!-- Topbar -->
  <div class="fixed top-0 inset-x-0 z-50 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 sm:px-6">
    <div class="flex items-center gap-2.5 sm:gap-3">
      <button id="lms-menu-btn" class="icon-btn md:hidden" aria-label="Menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <a href="#dashboard" class="flex items-center gap-2">
        ${logo}
        <span class="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">${name}</span>
      </a>
      <span class="hidden lg:inline text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full px-2.5 py-0.5 border border-indigo-100 dark:border-indigo-900/40">Student LMS</span>
    </div>

    <div class="flex items-center gap-1 sm:gap-2">
      <!-- Notifications -->
      <div class="relative">
        <button id="bell-btn" class="icon-btn relative" aria-label="Notifications">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.86 17.08a24 24 0 0 0-5.72 0M18 8a6 3 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a1.88 1.88 0 0 1-3.46 0"/></svg>
          <span id="bell-dot" class="hidden absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>
        <div id="bell-panel" class="hidden absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] card p-3.5 z-50 max-h-96 overflow-auto shadow-2xl">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Notifications</span>
          </div>
          <div id="bell-list" class="space-y-2 text-sm"></div>
        </div>
      </div>

      <!-- Theme Toggle -->
      <button id="theme-toggle" class="icon-btn" aria-label="Toggle dark mode">
        <svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 15A9.75 9.75 0 0 1 9 2.25 9.72 9.75 0 0 0 3.25 15a9.75 9.75 0 0 0 18.5 0Z"/></svg>
        <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.25"/><path stroke-linecap="round" d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>
      </button>

      <!-- User Chip -->
      <div class="hidden sm:block text-right mr-1">
        <p class="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]">${esc(student.name || '')}</p>
        <p class="text-[11px] font-mono text-slate-400">${esc(student.studentId)}</p>
      </div>

      <button id="lms-logout" class="btn btn-outline btn-sm !py-1.5 !px-2.5 sm:!px-3.5 text-xs font-semibold">Logout</button>
    </div>
  </div>

  <!-- Mobile Backdrop Overlay -->
  <div id="lms-sidebar-backdrop" class="hidden md:hidden"></div>

  <!-- Sidebar / Mobile Drawer -->
  <aside id="lms-sidebar" class="fixed z-40 top-16 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4 space-y-1 hidden md:block shadow-2xl md:shadow-none overflow-y-auto">
    <div class="md:hidden pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
          ${esc((student.name || 'S').charAt(0))}
        </div>
        <div class="truncate">
          <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${esc(student.name || '')}</p>
          <p class="text-[10px] text-slate-400 font-mono">${esc(student.studentId)}</p>
        </div>
      </div>
      <button id="lms-close-drawer" class="icon-btn !w-7 !h-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Close menu">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18 18 6M6 6l12 12"/></svg>
      </button>
    </div>
    ${LMS_LINKS.map((l) => `<a href="${l.hash}" data-key="${l.key}" class="side-link ${activeKey === l.key ? 'active' : ''}"><span class="side-icon">${l.iconSvg}</span><span>${l.label}</span></a>`).join('')}
  </aside>

  <!-- Mobile Quick Thumb Navigation Bar -->
  <nav class="lms-mobile-bottom-bar" id="lms-bottom-bar">
    <a href="#dashboard" data-key="dashboard" class="lms-mobile-bottom-item ${activeKey === 'dashboard' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>
      <span>Dashboard</span>
    </a>
    <a href="#tasks" data-key="tasks" class="lms-mobile-bottom-item ${activeKey === 'tasks' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
      <span>Tasks</span>
    </a>
    <a href="#certificate" data-key="certificate" class="lms-mobile-bottom-item ${activeKey === 'certificate' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0H9.497m5.003 0a3 3 0 0 0 2.25-2.88V7.5a3 3 0 0 0-3-3H10.25a3 3 0 0 0-3 3v5.245a3 3 0 0 0 2.25 2.88"/></svg>
      <span>Certificate</span>
    </a>
    <button id="lms-bottom-more-btn" class="lms-mobile-bottom-item" aria-label="More navigation options">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
      <span>Menu</span>
    </button>
  </nav>

  <!-- Padded Content Wrap: includes pb-20 on mobile so bottom bar never obscures content -->
  <div class="md:pl-64 pt-16 pb-20 md:pb-8 min-h-screen"></div>`;

  // Move page content container into the padded area
  const content = document.getElementById('lms-content');
  if (content) host.lastElementChild.appendChild(content);

  // Drawer toggle logic
  const toggleDrawer = (open) => {
    const sidebar = document.getElementById('lms-sidebar');
    const backdrop = document.getElementById('lms-sidebar-backdrop');
    if (!sidebar) return;
    const shouldOpen = open !== undefined ? open : sidebar.classList.contains('hidden');
    sidebar.classList.toggle('hidden', !shouldOpen);
    backdrop?.classList.toggle('hidden', !shouldOpen);
  };

  document.getElementById('lms-menu-btn')?.addEventListener('click', () => toggleDrawer(true));
  document.getElementById('lms-bottom-more-btn')?.addEventListener('click', () => toggleDrawer(true));
  document.getElementById('lms-close-drawer')?.addEventListener('click', () => toggleDrawer(false));
  document.getElementById('lms-sidebar-backdrop')?.addEventListener('click', () => toggleDrawer(false));

  // Auto-close mobile drawer when any link is clicked
  host.querySelectorAll('a.side-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) toggleDrawer(false);
    });
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => setTheme(!document.documentElement.classList.contains('dark')));
  document.getElementById('lms-logout')?.addEventListener('click', async () => { await logout(); location.href = 'lms.html'; });

  const bellBtn = document.getElementById('bell-btn');
  const bellPanel = document.getElementById('bell-panel');
  bellBtn?.addEventListener('click', async () => {
    bellPanel.classList.toggle('hidden');
    if (!bellPanel.classList.contains('hidden')) {
      const notes = await getNotifications(student.studentId);
      document.getElementById('bell-list').innerHTML = notes.length
        ? notes.map((n) => `<div class="rounded-xl border border-slate-100 dark:border-slate-700/80 p-2.5 ${n.read ? 'opacity-60' : 'bg-indigo-50/50 dark:bg-indigo-950/20'}">
            <p class="font-semibold text-slate-800 dark:text-slate-100 text-sm">${esc(n.title)}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${esc(n.body || '')}</p>
            <p class="text-[10px] text-slate-400 mt-1">${fmtTs(n.createdAt)}</p></div>`).join('')
        : '<p class="text-slate-400 text-xs py-2 text-center">No notifications yet.</p>';
      document.getElementById('bell-dot').classList.add('hidden');
      await markNotificationsRead(student.studentId);
    }
  });

  const notes = await getNotifications(student.studentId);
  if (notes.some((n) => !n.read)) document.getElementById('bell-dot').classList.remove('hidden');
}
