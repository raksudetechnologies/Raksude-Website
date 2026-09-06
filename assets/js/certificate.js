import { calcInternship, INTERNSHIP, PAYMENT, fmtDate, esc } from './utils.js';
import { listTasks, listSubmissions, createCertificate, getDomain } from './database.js';

// Certificate unlocks only when ALL of these are true:
//  1. Payment = PAID
//  2. Full internship period completed (based on domain duration days)
//  3. Every active task has a GitHub submission
//  4. Every submission is approved (COMPLETED)
export async function getCertificateStatus(student) {
  if (student.certificateStatus === 'UNLOCKED' && student.certificateId) {
    return { unlocked: true, certificateId: student.certificateId };
  }

  // Fetch domain to get the actual duration (days) — prioritize student.duration or domain.duration, default 30
  let domainDays = Number(student.duration) || 30;
  try {
    if (student.domainId) {
      const domain = await getDomain(student.domainId);
      if (domain && domain.duration && Number(domain.duration) >= 1) {
        domainDays = Number(domain.duration);
      }
    }
  } catch (e) {
    console.warn('Could not fetch domain duration for certificate check:', e.message);
  }

  const timeline = calcInternship(student.startDate, domainDays);
  const [tasks, subs] = await Promise.all([
    listTasks({ domainId: student.domainId }),
    listSubmissions({ studentId: student.studentId })
  ]);
  const byTask = Object.fromEntries(subs.map((s) => [s.taskId, s]));
  const submittedCount = tasks.filter((t) => byTask[t.id]).length;
  const completedCount = tasks.filter((t) => byTask[t.id]?.status === 'COMPLETED').length;
  const checklist = [
    { key: 'payment', label: 'Internship fee paid', done: student.paymentStatus === PAYMENT.PAID },
    { key: 'days', label: `${domainDays}-day internship period completed`, done: timeline.status === INTERNSHIP.COMPLETED },
    { key: 'submissions', label: `GitHub submissions (${submittedCount}/${tasks.length})`, done: tasks.length > 0 && submittedCount === tasks.length },
    { key: 'tasks', label: `Tasks approved by mentor (${completedCount}/${tasks.length})`, done: tasks.length > 0 && completedCount === tasks.length }
  ];
  return { unlocked: false, eligible: checklist.every((c) => c.done), checklist, domainDays };
}

// Checks eligibility and, if met, generates the certificate automatically.
export async function unlockIfEligible(student, settings) {
  const st = await getCertificateStatus(student);
  if (st.unlocked) return st.certificateId;
  if (st.eligible) {
    const cert = await createCertificate(student, settings);
    return cert.certificateId;
  }
  return null;
}

// Bundled Founder & CEO signature, used when no custom signature is configured.
export const defaultSignatureUrl = () => `${location.origin}/assets/img/founder-signature.png`;

export function certificateHtml(cert, settings) {
  const c = settings.company || {};
  const certCfg = settings.certificate || {};
  const rawLogo = certCfg.logoUrl || c.logoUrl;
  const logoUrl = (rawLogo && rawLogo !== 'assets/img/company-logo.png') ? rawLogo : 'assets/img/certificate-logo.png';
  const sealUrl = certCfg.sealUrl || 'assets/img/certificate-seal.png';
  const msmeUrl = certCfg.msmeUrl || 'assets/img/msme-badge.png';
  const companyName = cert.companyName || c.name || 'Raksude Technologies';
  const durationLabel = cert.duration ? `${cert.duration} days` : '30 days';
  const verifyUrl = `${location.origin}/verify-certificate.html?id=${encodeURIComponent(cert.certificateId || '')}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=1e40af&margin=4`;

  return `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Montserrat:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <div class="cert-paper" id="certificate-paper">

    <!-- ── ARCHITECTURAL CORNER ACCENTS & FRAME ── -->
    <div class="cert-corner cert-corner-tl"></div>
    <div class="cert-corner cert-corner-tr"></div>
    <div class="cert-corner cert-corner-bl"></div>
    <div class="cert-corner cert-corner-br"></div>
    <div class="cert-inner-frame"></div>
    <div class="cert-watermark" style="background-image:url('${esc(sealUrl)}');"></div>

    <!-- ── TOP ROW: Company Logo | Company Branding | MSME Badge ── -->
    <div style="position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="flex:1;max-width:250px;">
        <img src="${esc(logoUrl)}" style="height:76px;max-width:230px;object-fit:contain;background:transparent;display:block;" alt="${esc(companyName)}">
      </div>
      <div style="flex:1.4;text-align:center;padding:0 8px;">
        <h2 style="font-family:'Cinzel',serif;font-size:25px;font-weight:900;color:#1e3a8a;letter-spacing:3.5px;text-transform:uppercase;margin:0;line-height:1.2;">${esc(companyName)}</h2>
        <p style="font-family:'Montserrat',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:0.25em;color:#475569;text-transform:uppercase;margin:4px 0 0;">An MSME Registered Enterprise</p>
        <p style="font-family:'Montserrat',sans-serif;font-size:8px;font-weight:600;letter-spacing:0.12em;color:#64748b;margin:2px 0 0;">Registered under Government of India’s Udyam Registration System</p>
      </div>
      <div style="flex:1;max-width:250px;display:flex;justify-content:flex-end;">
        <img src="${esc(msmeUrl)}" style="height:66px;max-width:230px;object-fit:contain;background:transparent;display:block;" alt="MSME / UDYAM Registered Enterprise - Government of India">
      </div>
    </div>

    <!-- ── ORNAMENTAL DIVIDER ── -->
    <div style="position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:12px;margin:10px auto 14px;width:82%;">
      <div style="flex:1;height:1.5px;background:linear-gradient(to right,transparent,#93c5fd,#1e40af);"></div>
      <div style="width:7px;height:7px;transform:rotate(45deg);background:#1e40af;"></div>
      <div style="flex:1;height:1.5px;background:linear-gradient(to left,transparent,#93c5fd,#1e40af);"></div>
    </div>

    <!-- ── CERTIFICATE HEADING ── -->
    <div style="position:relative;z-index:2;text-align:center;margin-bottom:8px;">
      <div style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:700;font-size:60px;color:#1e3a8a;line-height:1.05;letter-spacing:1.5px;">Certificate</div>
      <div style="font-family:'Montserrat',sans-serif;font-size:11.5px;font-weight:800;letter-spacing:0.52em;color:#64748b;text-transform:uppercase;margin-top:4px;">of Achievement</div>
    </div>

    <!-- ── PRESENTED TO ── -->
    <div style="position:relative;z-index:2;text-align:center;margin:12px 0 6px;">
      <p style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:14.5px;color:#64748b;margin:0;">This acknowledgment is proudly presented to</p>
    </div>

    <!-- ── CANDIDATE NAME ── -->
    <div style="position:relative;z-index:2;text-align:center;margin:8px 0 4px;">
      <h1 style="font-family:'Playfair Display',serif;font-size:38px;font-weight:900;color:#0f172a;letter-spacing:3px;text-transform:uppercase;margin:0;line-height:1.2;">${esc(cert.name || '')}</h1>
    </div>
    <div style="position:relative;z-index:2;width:360px;height:2px;background:#1e40af;margin:8px auto 18px;border-radius:2px;"></div>

    <!-- ── BODY TEXT ── -->
    <div style="position:relative;z-index:2;text-align:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px;color:#334155;line-height:1.8;max-width:760px;margin:0 auto 24px;">
      <p style="margin:0;">This is to certify that <strong>${esc(cert.name || '')}</strong> has successfully completed an internship in <strong style="color:#1e40af;">${esc(cert.domainName || '')}</strong></p>
      <p style="margin:2px 0 0;">from <strong>${fmtDate(cert.startDate)}</strong> to <strong>${fmtDate(cert.endDate)}</strong> (${durationLabel}).</p>
    </div>

    <!-- ── BOTTOM ROW: Verification | Seal | Signature ── -->
    <div style="position:relative;z-index:2;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:8px;">

      <!-- Left: QR Code & Verification -->
      <div style="display:flex;align-items:center;gap:12px;min-width:220px;">
        <div style="padding:4px;background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.04);flex-shrink:0;">
          <img src="${qrUrl}" style="width:76px;height:76px;display:block;" alt="Scan QR Code">
        </div>
        <div style="font-family:'Montserrat',sans-serif;font-size:9px;color:#64748b;line-height:1.45;">
          <p style="margin:0;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.6px;font-size:8.5px;">✔ VERIFIED CERTIFICATE</p>
          <p style="margin:3px 0 0;font-family:monospace;font-size:9.5px;">ID: <strong style="color:#0f172a;">${esc(cert.certificateId || '')}</strong></p>
          <p style="margin:2px 0 0;">Issued: <strong style="color:#475569;">${fmtDate(cert.issueDate)}</strong></p>
          <p style="margin:2px 0 0;font-size:8px;color:#94a3b8;">Scan QR to verify online</p>
        </div>
      </div>

      <!-- Center: Official Circular Seal -->
      <div style="text-align:center;flex-shrink:0;">
        <div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;margin:0 auto;">
          <img src="${esc(sealUrl)}" style="width:94px;height:94px;object-fit:contain;background:transparent;filter:drop-shadow(0 2px 5px rgba(30,64,175,0.18));" alt="Official Seal">
        </div>
      </div>

      <!-- Right: Signature & Authority -->
      <div style="text-align:center;min-width:200px;">
        <div style="height:48px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:4px;">
          <img src="${esc(certCfg.signatureUrl || defaultSignatureUrl())}" style="max-height:48px;max-width:170px;object-fit:contain;display:block;" alt="Signature">
        </div>
        <div style="width:190px;height:1.5px;background:#1e40af;margin:0 auto 6px;"></div>
        <p style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;color:#0f172a;margin:0;letter-spacing:0.5px;">${esc(cert.authorizedName || certCfg.authorizedName || 'Hariharan M')}</p>
        <p style="font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#64748b;margin:2px 0 0;letter-spacing:0.8px;text-transform:uppercase;">${esc(cert.designation || certCfg.designation || 'Founder & CEO')}</p>
      </div>

    </div>
  </div>`;
}
