import { isConfigured } from './firebase-config.js';
import { getSettings } from './database.js';
import { esc, initTheme, setTheme } from './utils.js';

export async function applyMeta(settings) {
  const c = settings.company || {};
  if (c.faviconUrl) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = c.faviconUrl;
  }
  if (c.name && !document.title.includes(c.name)) document.title = `${document.title} · ${c.name}`;
}

const NAV_LINKS = [
  { href: 'index.html', key: 'home', label: 'Home' },
  { href: 'about.html', key: 'about', label: 'About' },
  { href: 'internship.html', key: 'internship', label: 'Internship' },
  { href: 'apply.html', key: 'apply', label: 'Apply Internship' },
  { href: 'lms.html', key: 'lms', label: 'LMS Login' },
  { href: 'verify-certificate.html', key: 'verify', label: 'Verify Certificate' },
  { href: 'contact.html', key: 'contact', label: 'Contact' }
];

function logoHtml(c) {
  const name = esc(c.name || 'Raksude Tech');
  const src = prefix(c.logoUrl || 'assets/img/company-logo.png');
  return `<div class="h-9 w-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm border border-slate-200/80 shrink-0"><img src="${esc(src)}" alt="${name}" class="h-full w-full object-contain"></div>`;
}

function navbarHtml(c, active) {
  const links = NAV_LINKS.map((l) =>
    `<a href="${prefix(l.href)}" data-key="${l.key}" class="nav-link ${active === l.key ? 'active' : ''}">${l.label}</a>`).join('');
  return `
  <header class="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-16">
      <a href="${prefix('index.html')}" class="flex items-center gap-2 sm:gap-2.5 min-w-0">
        ${logoHtml(c)}
        <span class="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">${esc(c.name || 'Internship Portal')}</span>
      </a>
      <nav class="hidden lg:flex items-center gap-1">${links}</nav>
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button id="theme-toggle" class="icon-btn" title="Toggle dark mode" aria-label="Toggle dark mode">
          <svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 15A9.75 9.75 0 0 1 9 2.25 9.72 9.75 0 0 0 3.25 15a9.75 9.75 0 0 0 18.5 0Z"/></svg>
          <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.25"/><path stroke-linecap="round" d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>
        </button>
        <a href="${prefix('admin/login.html')}" class="hidden sm:inline-flex btn btn-outline btn-sm">Admin Login</a>
        <a href="${prefix('apply.html')}" class="btn btn-primary btn-sm !px-3 !py-1.5 sm:!px-4 text-xs sm:text-sm">Apply Now</a>
        <button id="menu-btn" class="icon-btn lg:hidden" aria-label="Open menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="hidden lg:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 shadow-xl">
      ${NAV_LINKS.map((l) => `<a href="${prefix(l.href)}" class="block rounded-lg px-3 py-2 text-sm font-medium ${active === l.key ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}">${l.label}</a>`).join('')}
      <a href="${prefix('admin/login.html')}" class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Admin Login</a>
    </div>
  </header>
  <div class="h-16"></div>`;
}

function prefix(href) {
  // Admin pages live one level deeper, so links need a ../ prefix.
  return location.pathname.includes('/admin/') ? `../${href}` : href;
}

function footerHtml(settings) {
  const c = settings.company || {};
  const social = [
    ['Facebook', c.facebook], ['Twitter', c.twitter], ['LinkedIn', c.linkedin], ['Instagram', c.instagram]
  ].filter(([, u]) => u).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" class="hover:text-indigo-500">${n}</a>`).join(' · ');
  return `
  <footer class="bg-slate-900 text-slate-300 mt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="flex items-center gap-2 mb-3">${logoHtml(c)}<span class="font-bold text-white">${esc(c.name || '')}</span></div>
        <p class="text-sm text-slate-400">${esc(c.tagline || '')}</p>
        ${social ? `<p class="text-sm mt-3 space-x-1">${social}</p>` : ''}
      </div>
      <div>
        <h4 class="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Quick Links</h4>
        <ul class="space-y-2 text-sm">${NAV_LINKS.map((l) => `<li><a href="${prefix(l.href)}" class="hover:text-white">${l.label}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Policies</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="${prefix('privacy.html')}" class="hover:text-white">Privacy Policy</a></li>
          <li><a href="${prefix('refund.html')}" class="hover:text-white">Refund Policy</a></li>
          <li><a href="${prefix('terms.html')}" class="hover:text-white">Terms &amp; Conditions</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Contact</h4>
        <ul class="space-y-2 text-sm text-slate-400">
          ${c.email ? `<li>${esc(c.email)}</li>` : ''}
          ${c.phone ? `<li>${esc(c.phone)}</li>` : ''}
          ${c.address ? `<li>${esc(c.address)}</li>` : ''}
        </ul>
      </div>
    </div>
    <div class="border-t border-slate-800 py-4 text-center text-xs text-slate-500">© ${new Date().getFullYear()} ${esc(c.name || 'Internship Portal')}. All rights reserved.</div>
  </footer>`;
}

function wireChrome() {
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  menuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });
  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
  });
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setTheme(!document.documentElement.classList.contains('dark'));
  });
}

function setupBanner() {
  if (isConfigured || document.getElementById('setup-banner')) return;
  const el = document.createElement('div');
  el.id = 'setup-banner';
  el.className = 'bg-amber-500 text-amber-950 text-sm font-medium text-center px-4 py-2';
  el.innerHTML = 'Firebase is not configured yet — open <code class="font-mono">assets/js/firebase-config.js</code> and paste your Firebase web-app config, then run <a class="underline font-bold" href="setup.html">setup.html</a>.';
  document.body.prepend(el);
}

// Main entry for all public pages: renders navbar + footer from dynamic settings.
const KEY_ALIAS = { index: 'home', 'verify-certificate': 'verify' };
export async function applyPublicChrome(active) {
  active = KEY_ALIAS[active] || active;
  initTheme();
  const settings = await getSettings();
  applyMeta(settings);
  const nav = document.getElementById('nav');
  if (nav) nav.outerHTML = navbarHtml(settings.company || {}, active);
  const footer = document.getElementById('footer');
  if (footer) footer.outerHTML = footerHtml(settings);
  wireChrome();
  setupBanner();
  return settings;
}

export const DEFAULT_POLICIES = {
  privacy: `
<div class="policy-document space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
  <div class="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3.5 shadow-sm">
    <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-md shadow-indigo-600/20">🛡️</div>
    <div>
      <h3 class="font-extrabold text-slate-900 dark:text-white text-base">Privacy Commitment & Regulatory Compliance</h3>
      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
        Effective Date: <strong>September 2026</strong> | Compliant with Information Technology Act, 2000, SPDI Rules 2011 & Indian Digital Personal Data Protection standards.
      </p>
    </div>
  </div>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">1</span>
      Introduction & Scope
    </h2>
    <p>
      <strong>RAKSUDE TECHNOLOGIES</strong> ("we", "our", "us", or "the Company") operates the Virtual Internship & Learning Management System portal (<a href="index.html" class="text-indigo-600 dark:text-indigo-400 underline font-semibold">raksudetechnologies.com</a>). We are strongly dedicated to respecting and safeguarding the personal information and privacy rights of our student applicants, enrolled interns, mentors, and platform visitors.
    </p>
    <p>
      This Privacy Policy describes how we collect, handle, process, store, and protect your personal data when you submit an internship application, access the Student LMS portal, pay fees through our authorized payment gateway, or view and verify completion certificates.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">2</span>
      Categories of Information We Collect
    </h2>
    <p>To provide high-quality internship training, authenticate student identity, and issue verifiable MSME/ISO certificates, we collect the following types of information:</p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-3">
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-1.5">
        <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span class="text-indigo-600 font-extrabold">•</span> Personal Identification Data
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Full Legal Name, Contact Phone Number, Primary Email Address, Date of Birth, Gender, Residential Address, City, State, and Country.</p>
      </div>

      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-1.5">
        <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span class="text-indigo-600 font-extrabold">•</span> Academic Credentials
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">College / Institution Name, Degree Program (BE / B.Tech / B.Sc / BCA / MCA), Academic Department/Major, Year of Study, and Student Roll/Register Number.</p>
      </div>

      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-1.5">
        <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span class="text-indigo-600 font-extrabold">•</span> Internship & LMS Activity
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Assigned Domain, Task Submissions, Project GitHub / Drive links, evaluation milestones, submission timestamps, mentor feedback, and performance scores.</p>
      </div>

      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-1.5">
        <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span class="text-indigo-600 font-extrabold">•</span> Payment & Gateway Information
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Razorpay Payment ID (<code>pay_xxxx</code>), Razorpay Order ID (<code>order_xxxx</code>), transaction timestamp, amount paid, and verification status. <em>We never store credit card numbers, CVVs, or UPI PINs.</em></p>
      </div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">3</span>
      How We Use Your Personal Data
    </h2>
    <ul class="list-disc pl-5 space-y-2 text-xs sm:text-sm">
      <li><strong>Application Review & Onboarding:</strong> To verify student eligibility and assign appropriate domain curriculum tracks (Full Stack, Python, Data Science, AI/ML, Cloud, etc.).</li>
      <li><strong>LMS Access & Progress Tracking:</strong> To generate personalized student accounts, manage task assignments, review code deliverables, and log milestone achievements.</li>
      <li><strong>Secure Transaction Processing:</strong> To generate official Razorpay order records and verify payments through cryptographic HMAC-SHA256 signature checks.</li>
      <li><strong>Certification & Online Verification:</strong> To issue authentic, tamper-evident MSME & ISO 9001:2015 verified completion certificates with unique Certificate IDs and QR codes verifiable globally by employers.</li>
      <li><strong>Transactional Communication:</strong> To send automated admission confirmations, task review feedback, and certificate release notifications via email.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">4</span>
      Payment Gateway Security (Official Razorpay Integration)
    </h2>
    <p>
      All financial transactions on our portal are processed exclusively through <strong>Razorpay Software Private Limited</strong> ("Razorpay"). 
    </p>
    <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
      <p class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span class="text-emerald-500 font-black">✓</span> Highest Security Standard: PCI-DSS Level 1 Certified
      </p>
      <p>
        Razorpay is regulated by the Reserve Bank of India (RBI) and complies with the strictest global data protection standards (PCI-DSS Level 1, ISO 27001).
        When paying via Razorpay's official checkout, your payment instrument details (Card numbers, UPI handles, Net Banking credentials) are transmitted directly across end-to-end 256-bit SSL encrypted channels to banking networks.
        Our servers never inspect, capture, or store sensitive card numbers or bank passwords.
      </p>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">5</span>
      Data Sharing, Disclosure & Non-Sale Policy
    </h2>
    <p>
      <strong>We have a strict Zero Data Sale Policy.</strong> We do not sell, rent, trade, or monetize student personal information to any third-party marketing companies, advertisers, or data brokers.
    </p>
    <p>We share information solely with essential, trusted technical infrastructure partners who assist in our platform operations:</p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Google Cloud / Firebase:</strong> Highly secure, ISO 27001 certified cloud database, authentication, and encrypted document storage.</li>
      <li><strong>Razorpay:</strong> Secure payment gateway processing for enrollment fees.</li>
      <li><strong>EmailJS / Transactional Mailers:</strong> For dispatching automated application confirmations and receipt notices.</li>
      <li><strong>Law Enforcement / Statutory Authorities:</strong> Solely if strictly mandated by applicable laws, court summons, or regulatory directives.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">6</span>
      Data Retention & Student Rights
    </h2>
    <p>
      Student registration details, task completion history, and certificate records are securely retained to provide perpetual online certificate validation for your academic and employment career.
    </p>
    <p>Students enjoy the following rights regarding their personal data:</p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Right of Access:</strong> You can view all your personal records, submissions, and payment status anytime in the Student Portal.</li>
      <li><strong>Right to Rectification:</strong> You may request corrections to name spelling, college name, or contact information before final certificate issuance.</li>
      <li><strong>Right to Erasure:</strong> You may request deletion of non-essential profile data upon completion of your internship by writing to our support desk.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">7</span>
      Cookies & Local Browser Storage
    </h2>
    <p>
      Our portal utilizes standard browser <code>localStorage</code> and minimal session cookies purely for functional purposes: keeping you authenticated in the LMS, preventing repeated logins, and saving your preferred UI appearance (Dark/Light mode). We do not use third-party tracking or advertising cookies.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">8</span>
      Contact Us & Grievance Redressal
    </h2>
    <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our designated Grievance Officer:</p>
    <div class="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs sm:text-sm">
      <p class="font-bold text-slate-900 dark:text-white">RAKSUDE TECHNOLOGIES — Privacy & Compliance Cell</p>
      <p><strong>Registered Address:</strong> 12, Tech Park, Bengaluru, Karnataka, India - 560100</p>
      <p><strong>Support Email:</strong> <a href="mailto:support@techintern.example" class="text-indigo-600 dark:text-indigo-400 font-mono font-semibold underline">support@techintern.example</a></p>
      <p><strong>Helpline:</strong> +91 98765 43210 (Monday to Friday, 10:00 AM – 6:00 PM IST)</p>
      <p class="text-slate-500 text-[11px] pt-1">Standard response turnaround: 24 to 48 business hours.</p>
    </div>
  </section>
</div>`,

  refund: `
<div class="policy-document space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
  <div class="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3.5 shadow-sm">
    <div class="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-md shadow-amber-600/20">💰</div>
    <div>
      <h3 class="font-extrabold text-slate-900 dark:text-white text-base">Fair & Transparent Refund Policy</h3>
      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
        Effective Date: <strong>September 2026</strong> | Applicable to all internship program enrollments and digital fee transactions via Razorpay.
      </p>
    </div>
  </div>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">1</span>
      Purpose & Nature of Fees
    </h2>
    <p>
      At <strong>RAKSUDE TECHNOLOGIES</strong>, we maintain complete transparency regarding our program charges. The fee charged for our virtual internship program is a nominal, one-time administrative fee (e.g. ₹199 or as indicated during checkout).
    </p>
    <p>
      This fee directly covers the operational costs of provisioning dedicated LMS student credentials, hosting project resources, individual mentor evaluation of submitted assignments, MSME Udyam credentials verification, and issuing a cryptographically verifiable ISO 9001:2015 completion certificate.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">2</span>
      Eligibility Criteria for Refunds
    </h2>
    <p>We offer full or partial refunds under the following specific, verified circumstances:</p>

    <div class="space-y-3 my-3">
      <div class="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
        <h4 class="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span>✓</span> 3-Day Initial Cancellation Window (100% Refund)
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
          If you decide not to proceed with the internship, you may request a <strong>100% full refund within 3 calendar days (72 hours)</strong> of your transaction, provided that you have <strong>NOT submitted any assignments or milestone tasks</strong> on the LMS portal.
        </p>
      </div>

      <div class="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
        <h4 class="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span>✓</span> Duplicate or Erroneous Deductions (100% Refund)
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
          If your bank account or UPI application was debited more than once for the same Student ID due to a network glitch or payment gateway timeout, all excess transactions will be refunded in full immediately upon verification.
        </p>
      </div>

      <div class="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
        <h4 class="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span>✓</span> Program Cancellation by Raksude Technologies (100% Refund)
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
          In the rare event that Raksude Technologies is unable to deliver the chosen internship domain track, platform curriculum, or mentor guidance, a complete 100% refund will be issued without any deduction.
        </p>
      </div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">3</span>
      Non-Refundable Circumstances
    </h2>
    <p>Refunds will <strong>NOT</strong> be approved or processed under any of the following conditions:</p>
    <ul class="list-disc pl-5 space-y-2 text-xs sm:text-sm">
      <li><strong>After Task Submission:</strong> Once a student has submitted one or more milestone tasks, projects, or code files on the LMS, the resources and mentor time have been committed, making the fee non-refundable.</li>
      <li><strong>After Certificate Unlock:</strong> Once the official Certificate of Internship has been generated, unlocked, previewed, or downloaded.</li>
      <li><strong>Expired Timeframe:</strong> If the refund request is submitted after 3 calendar days (72 hours) from the date and time of payment.</li>
      <li><strong>Academic Misconduct or Disqualification:</strong> If a student's enrollment is terminated due to plagiarism, submitting fabricated code, cheating, or violating student code of conduct.</li>
      <li><strong>Voluntary Non-Participation:</strong> Lack of personal time, conflicting college exam schedules, or choosing not to log in after enrolling does not entitle a student to a refund.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">4</span>
      Step-by-Step Refund Request Process
    </h2>
    <p>To submit a valid refund request, please adhere to the following simple procedure:</p>
    <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-2">
      <p>Send an email from your registered email address to <a href="mailto:support@techintern.example" class="text-indigo-600 dark:text-indigo-400 font-mono font-bold underline">support@techintern.example</a> with the subject line:</p>
      <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 font-mono text-xs border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
        REFUND REQUEST - [Your Student ID] - [Your Payment ID]
      </div>
      <p class="font-bold text-slate-900 dark:text-white pt-1">Please include the following details in your email body:</p>
      <ol class="list-decimal pl-5 space-y-1 text-xs">
        <li>Student Full Name (as provided during registration)</li>
        <li>Student ID (e.g. <code>INT-2026-0001</code>)</li>
        <li>Razorpay Payment ID (e.g. <code>pay_xxxxxxxxxxxxxx</code>)</li>
        <li>Date and exact amount of payment</li>
        <li>Clear description of the reason for your refund request</li>
        <li>Screenshot of the payment receipt or transaction SMS (for duplicate charge claims)</li>
      </ol>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">5</span>
      Refund Processing & Timeline
    </h2>
    <ul class="list-disc pl-5 space-y-2 text-xs sm:text-sm">
      <li><strong>Acknowledgement:</strong> Our billing support team will review and verify your request within <strong>24 to 48 business hours</strong>.</li>
      <li><strong>Original Payment Method:</strong> All approved refunds are credited back directly through the <strong>Razorpay Payment Gateway</strong> to the original payment source (your UPI linked account, Debit Card, Credit Card, or Net Banking account).</li>
      <li><strong>Credit Timeline:</strong> Once initiated by us, the funds typically reflect in your bank account within <strong>5 to 7 business days</strong>, governed by your bank's NEFT/IMPS clearing cycle and RBI processing regulations.</li>
      <li><strong>Zero Deductions for Gateway Errors:</strong> No cancellation penalty or processing fee is deducted for duplicate payment reversals or service errors caused by our systems.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">6</span>
      Billing & Accounts Helpdesk
    </h2>
    <div class="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 space-y-1.5 text-xs sm:text-sm">
      <p class="font-bold text-slate-900 dark:text-white">RAKSUDE TECHNOLOGIES — Student Accounts Desk</p>
      <p><strong>Address:</strong> 12, Tech Park, Bengaluru, Karnataka, India - 560100</p>
      <p><strong>Email:</strong> <a href="mailto:support@techintern.example" class="text-indigo-600 dark:text-indigo-400 font-mono font-semibold underline">support@techintern.example</a></p>
      <p><strong>Phone Support:</strong> +91 98765 43210 (Mon to Fri, 10:00 AM – 6:00 PM IST)</p>
      <p class="text-slate-500 text-[11px] pt-1">Please keep your Razorpay Payment ID handy for prompt assistance.</p>
    </div>
  </section>
</div>`,

  terms: `
<div class="policy-document space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
  <div class="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3.5 shadow-sm">
    <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-md shadow-blue-600/20">📋</div>
    <div>
      <h3 class="font-extrabold text-slate-900 dark:text-white text-base">Student Internship Terms & Conditions Agreement</h3>
      <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
        Effective Date: <strong>September 2026</strong> | Legally binding agreement governing platform participation, code of conduct, certification, and Razorpay checkout.
      </p>
    </div>
  </div>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">1</span>
      Acceptance of Terms
    </h2>
    <p>
      These Terms and Conditions ("Terms", "Agreement") constitute a legally binding agreement between you ("Student", "Intern", "User", or "you") and <strong>RAKSUDE TECHNOLOGIES</strong> ("Company", "we", "us", or "our"), governing your access to and use of our website (<a href="index.html" class="text-indigo-600 dark:text-indigo-400 underline font-semibold">raksudetechnologies.com</a>), the Student LMS portal, application modules, and related educational services.
    </p>
    <p>
      By submitting an internship application, creating an account, logging into the LMS portal, or completing payment via Razorpay, you explicitly confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy and Refund Policy. If you do not agree, you must immediately discontinue using our services.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">2</span>
      Eligibility & Registration Authenticity
    </h2>
    <ul class="list-disc pl-5 space-y-2 text-xs sm:text-sm">
      <li><strong>Student Status:</strong> The program is open to undergraduate students, postgraduate scholars, diploma candidates, and recent graduates seeking industry-aligned practical training.</li>
      <li><strong>Accuracy of Information:</strong> You agree to provide truthful, accurate, and complete information during application and profile setup. Providing fictitious names, fake college credentials, or impersonating others will result in immediate disqualification without refund.</li>
      <li><strong>One Student Per Account:</strong> Each student account and Student ID (e.g. <code>INT-2026-0001</code>) is unique and non-transferable. Account sharing or allowing third parties to submit tasks on your behalf is strictly forbidden.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">3</span>
      Program Structure, Modality & Duration
    </h2>
    <p>
      The Raksude Technologies Internship is a <strong>30-day remote virtual internship program</strong>. The program is structured into practical learning milestones designed to build job-ready technical proficiencies in domains such as Web Development, Python, Machine Learning, Cloud Computing, UI/UX Design, and Cybersecurity.
    </p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li>Interns receive project tasks and documentation through the Student LMS portal.</li>
      <li>Interns are required to complete assigned tasks independently and submit their work (GitHub repository links, deployment URLs, or technical documentation) via the portal.</li>
      <li>Mentors review submitted deliverables, evaluate code quality, and provide constructive guidance.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">4</span>
      Fee Structure & Official Razorpay Terms
    </h2>
    <p>
      A nominal enrollment fee is charged to maintain cloud server infrastructure, task review resources, and perpetual verification systems.
    </p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Payment Routing:</strong> All payments are processed exclusively through the official <strong>Razorpay Payment Gateway</strong>.</li>
      <li><strong>Permitted Methods:</strong> Supported payment instruments include UPI (scan dynamic Razorpay QR code or enter UPI ID via GPay, PhonePe, Paytm, BHIM) and major Credit/Debit Cards (Visa, MasterCard, RuPay, Amex).</li>
      <li><strong>Automated Instant Verification:</strong> Once completed, payment verification is cryptographically authenticated server-side using HMAC-SHA256 signatures, marking your account as PAID immediately.</li>
      <li><strong>Taxes:</strong> All fees are stated in Indian Rupees (INR) and are inclusive of applicable taxes unless specified otherwise.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">5</span>
      Academic Integrity & Anti-Plagiarism Policy
    </h2>
    <p>
      Raksude Technologies upholds the highest standards of academic honesty and ethics:
    </p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Original Code:</strong> All project submissions, codebases, and reports must be your original work. While utilizing open-source libraries and frameworks is encouraged, directly copying code from fellow interns or public repositories without attribution constitutes plagiarism.</li>
      <li><strong>Consequences of Violation:</strong> Any submission found to violate academic integrity will be rejected. Repeated violations will result in permanent disqualification from the platform without certificate issuance or fee refund.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">6</span>
      Certification & Verification Disclaimers
    </h2>
    <p>
      An official Certificate of Internship Completion will be awarded upon meeting the following cumulative criteria:
    </p>
    <ol class="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
      <li>Active participation throughout the 30-day program tenure.</li>
      <li>Satisfactory completion and submission of assigned milestone tasks.</li>
      <li>Verification of nominal enrollment fee via Razorpay.</li>
    </ol>
    <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2 my-2">
      <p class="font-bold text-slate-900 dark:text-white">Important Certification Clarifications:</p>
      <p>
        • <strong>Permanent Authenticity:</strong> Each certificate carries a unique Certificate ID, MSME Udyam credentials, and an encrypted QR code verifiable 24/7 on our public verification portal (<a href="verify-certificate.html" class="text-indigo-600 underline font-semibold">verify-certificate.html</a>).
      </p>
      <p>
        • <strong>No Employment Guarantee:</strong> The certificate recognizes successful completion of educational and skill-building training. Participation in this virtual internship does <strong>NOT</strong> constitute an offer of employment, permanent hiring, salary, or contractual employment with Raksude Technologies or partner organizations.
      </p>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">7</span>
      Intellectual Property Rights
    </h2>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Student Work:</strong> You retain complete intellectual property ownership of the original code, software applications, and project assets you independently create during the internship.</li>
      <li><strong>Platform IP:</strong> All course content, problem statements, LMS software, logos, trademarks, website code, and visual designs remain the exclusive property of Raksude Technologies. You may not republish, sell, or commercially exploit platform curriculum materials.</li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">8</span>
      Limitation of Liability & Warranty Disclaimer
    </h2>
    <p>
      The internship platform, training materials, and digital services are provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by Indian law, Raksude Technologies disclaims all warranties, express or implied.
      The Company shall not be liable for any indirect, incidental, or consequential damages, service downtimes, or technical interruptions beyond our reasonable control.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">9</span>
      Governing Law & Jurisdiction
    </h2>
    <p>
      These Terms and Conditions shall be governed by, interpreted, and construed in accordance with the substantive laws of India.
      Any disputes, claims, or controversies arising out of or relating to these terms or platform usage shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka, India</strong> or <strong>Tamil Nadu, India</strong>.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
      <span class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-black">10</span>
      Official Contact Information
    </h2>
    <div class="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-1.5 text-xs sm:text-sm">
      <p class="font-bold text-slate-900 dark:text-white">RAKSUDE TECHNOLOGIES — Legal & Academic Operations</p>
      <p><strong>Corporate Office:</strong> 12, Tech Park, Bengaluru, Karnataka, India - 560100</p>
      <p><strong>Official Email:</strong> <a href="mailto:support@techintern.example" class="text-indigo-600 dark:text-indigo-400 font-mono font-semibold underline">support@techintern.example</a></p>
      <p><strong>Helpline:</strong> +91 98765 43210 (Monday to Friday, 10:00 AM – 6:00 PM IST)</p>
    </div>
  </section>
</div>`
};

// Policy pages (privacy / refund / terms) pull editable HTML from settings.
export async function applyPolicyPage(key, title) {
  const settings = await applyPublicChrome('about');
  const t = document.getElementById('policy-title') || document.getElementById('policyTitle');
  if (t) t.textContent = title;
  const body = document.getElementById('policy-content') || document.getElementById('policyContent');
  const stored = settings.policies?.[key];
  const isCustomSubstantive = stored && stored.length > 300 && !stored.includes('Your data is used only to run the internship program');
  if (body) {
    body.innerHTML = isCustomSubstantive ? stored : (DEFAULT_POLICIES[key] || stored || '<p>Content coming soon.</p>');
  }
  return settings;
}

