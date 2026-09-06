# Internship Portal

A production-ready, fully client-side internship portal built with **HTML5 + CSS3 (Tailwind CDN) + vanilla JavaScript ES modules**, backed by **Firebase Authentication, Firestore and Realtime Database**. No Node.js server, no PHP, no SQL — and **no Firebase Storage**: every file (offer letters, ID-card photos, signatures, QR images) is referenced by external URL.

## Core concepts

- **No batch system** — every student gets an independent 30-day window.
  `start = registration date`, `end = start + 29 days` (exactly 30 calendar days, inclusive).
- **Automation** — date math, weekly task unlocks (Week 1: day 1, Week 2: day 8, Week 3: day 15, Week 4: day 22), application approval, LMS credential creation, task submission approval, status transitions and certificate unlocking are all automatic.
- **Only manual step** — approving QR (UPI) payments, done from Admin → Payments.
- **Certificate unlock rule** — payment PAID **and** 30 days completed **and** every task submitted **and** every submission approved (auto-approved on submit).

## Project structure

```
index.html                 Home / landing (dynamic from settings)
about.html                 About + methodology
internship.html            Domain listing (dynamic)
apply.html                 Multi-section application form → Firestore
lms.html                   Student LMS login (verified via RTDB lms_users)
razorpay.html              Standalone public Razorpay payment & proof submission page
student.html               Student dashboard (tasks, payment, ID card, certificate…)
verify-certificate.html    Public certificate verification by ID
contact.html               Contact form → Firestore
privacy.html refund.html terms.html   Policies editable from Admin → Settings
setup-recovery.html        Admin Recovery & First-Run setup tool (emergency admin creation)
admin/
  login.html dashboard.html students.html applications.html domains.html
  tasks.html submissions.html payments.html razorpay.html certificates.html
  contacts.html feedback.html settings.html
assets/
  css/style.css            Shared component styles (cards, badges, tables, modals…)
  js/firebase-config.js    ← PUT YOUR FIREBASE CONFIG HERE
  js/razorpay-config.js    ← ENTER YOUR RAZORPAY CREDENTIALS HERE MANUALLY
  js/razorpay.js           Razorpay integration logic
  js/utils.js              Dates, 30-day calc, ID counters, toasts, badges, CSV…
  js/database.js           All Firestore/RTDB access + default settings
  js/auth.js               Student login (RTDB-only), admin guard, adminLogin
  js/settings.js           Public navbar/footer chrome + policy pages
  js/student.js            LMS chrome + task progress
  js/tasks.js              Weekly unlock logic + submissions
  js/payment.js            QR payment flow (manual approval)
  js/certificate.js        Eligibility engine + certificate rendering
  js/admin.js              Admin chrome, auth guard, dialogs
  img/founder-signature.png Bundled Founder & CEO signature
firestore.rules            Firestore security rules (includes secure_config vault)
database.rules.json        Realtime Database rules (lms_users, notifications, activity)
```

## Setup (10 minutes)

1. **Firebase console** → create a project, then enable:
   - Authentication → Sign-in method → **Email/Password**
   - **Firestore Database** (production mode is fine — rules below open what's needed)
   - **Realtime Database** (used for notifications + activity feed)
2. Project settings → *Your apps* → add a **Web app** → copy the config object.
3. Paste it into `assets/js/firebase-config.js` (replace the `YOUR_…` placeholders, including `databaseURL`).
4. Deploy the whole folder to any static host (Firebase Hosting, Netlify, Vercel). For Firebase Hosting:
   `firebase init hosting` → public dir `.` → deploy.
5. Open `setup.html` once:
   - **Step 1** creates the first admin account (bootstrap window closes automatically after this).
   - **Step 2** seeds default settings + 3 sample domains with 4 tasks each.
6. Log in at `admin/login.html`, then configure everything from **Admin → Settings**: company branding, fee, QR image URL, Razorpay key, certificate signatory, policy texts, EmailJS.
7. Delete `setup.html`.

## Student lifecycle

1. Student applies via `apply.html` → gets an `APP-YYYY-####` ID (auto-approved instantly).
2. Approval is **automatic**: a student record `INT-YYYY-####` is created with its own 30-day window, and the LMS account is generated on the spot — **username = application email, password = application mobile number** — shown on the success screen and emailed if EmailJS is configured. Admin → Applications remains available for reviewing/rejecting/editing.
3. Student logs in at `lms.html` with their **email (username) + mobile number (password)**, works through weekly tasks, submits **GitHub repository URLs** (no file uploads). Submissions are **auto-approved** the moment they are submitted; Admin → Submissions can still revert one if needed.
4. Payment: **QR/UPI** (student submits transaction ID → admin approves in Payments) and/or **Razorpay** (auto-confirmed). Payment ON/OFF switches and a global "Stop payment" switch live in Settings.
5. When all certificate conditions are met, the certificate auto-unlocks with a unique `CERT-YYYY-######` ID, verifiable publicly at `verify-certificate.html`.

## Razorpay Configuration & Architecture

Razorpay is kept completely secure and decoupled from generic public UI inputs:

1. **Direct Configuration File (`assets/js/razorpay-config.js`)**:
   - You can enter your Razorpay `keyId`, `keySecret`, `paymentPageUrl`, `mode`, and defaults directly inside this file.
   - No sensitive credentials need to be typed into generic public forms.

2. **Dedicated Secure Admin Page (`admin/razorpay.html`)**:
   - Accessible via Admin Navigation &rarr; Razorpay.
   - Stores configuration in `/secure_config/razorpay`, which is protected by strict Firestore rules (`allow read, write: if isAdmin();`).
   - Completely invisible and inaccessible to students.

3. **Dedicated Public Payment Page (`razorpay.html`)**:
   - Students can open your Razorpay hosted link / checkout, pay their fee, and submit their Payment ID (`pay_...`).
   - Submissions appear in **Admin &rarr; Payments** as `RAZORPAY` with status `PENDING`, allowing the admin to easily review, approve, or reject.
   - Once approved, the student's LMS payment status becomes `PAID`.

## Security notes

- `firestore.rules` restricts: settings/domains/tasks writes to admins; students read only their own doc (via `uid_map`); payments/certificates management is admin-only; certificate verification is a public *get-by-id* only.
- To keep the portal **fully automatic with no server**, the apply flow is allowed a few shape-checked writes from anonymous visitors: creating the application + `app_locks` duplicate guard, flipping the application's `status`/`studentId`, creating the student record, and creating the `lms_users`/`uid_map` entries for the generated account. `lms_users` listing is public because the LMS login matches username/email/mobile client-side. The `students` counter is public for auto enrolment.
- The bootstrap rule (`meta/setup`) allows creating the **first** admin only until `setup.html` writes the flag. For stricter production posture, remove the bootstrap clause after setup.
- Students can update `paymentStatus`/`certificateStatus` on their own doc only because unlock/payment confirmation runs client-side. For hardened deployments move those writes (and the anonymous apply-flow writes above) into a Cloud Function and narrow the rules accordingly.

## Optional extras included

EmailJS notifications (application received, credentials, certificate) — enable in Settings · CSV export across admin lists · jsPDF student progress report · auto-generated **Offer Letter** (PDF download, signed with the bundled Founder & CEO signature) · dark mode · notification bell (Realtime DB) · admin activity feed · social share links on certificates.

## Local preview

Any static server works, e.g. `npx serve .` or `python -m http.server`. (Opening files via `file://` will not work — ES modules need HTTP.)
#   R a k s u d e - W e b s i t e  
 #   R a k s u d e - W e b s i t e  
 #   R a k s u d e - W e b s i t e  
 