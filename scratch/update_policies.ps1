# Script to upload comprehensive Privacy, Refund, and Terms policies into Firestore settings/app
$apiKey = 'AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58'

$privacyHtml = @"
<div class="policy-document space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
  <div class="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
    <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">🛡️</div>
    <div class="text-xs sm:text-sm">
      <p class="font-bold text-slate-900 dark:text-white">Effective Date: September 2026 | Last Updated: September 6, 2026</p>
      <p class="text-slate-600 dark:text-slate-400 mt-0.5">This Privacy Policy governs the manner in which Raksude Technologies collects, uses, maintains, and protects user data across our internship training and certification portal.</p>
    </div>
  </div>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">1</span>
      Introduction & Commitment to Privacy
    </h2>
    <p>Raksude Technologies ("Company", "we", "our", or "us") is dedicated to safeguarding the personal privacy of all students, interns, applicants, and visitors accessing our platform. This Privacy Policy details our data collection practices, storage security, and compliance with the Information Technology Act, 2000 and applicable digital data protection standards.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">2</span>
      Information We Collect
    </h2>
    <p>To provide a structured internship learning environment and issue verifiable completion credentials, we collect the following categories of information:</p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Personal Details:</strong> Full Name, Email Address, Contact Phone Number, Date of Birth, Gender, City, State, and Residential Address.</li>
      <li><strong>Educational & Academic Credentials:</strong> College / University Name, Degree (BE, B.Tech, B.Sc, BCA, etc.), Department/Specialization, Year of Study, and Register/Roll Number.</li>
      <li><strong>Internship Program Records:</strong> Assigned Internship Domain, Task Submissions, Project GitHub/Drive URLs, Mentor Evaluation Feedback, and Performance Milestones.</li>
      <li><strong>Payment & Transaction Records:</strong> Razorpay Transaction Reference ID, Razorpay Order ID, Timestamp, Fee Amount, and Payment Verification Status. <em>Note: We do NOT store credit/debit card numbers, CVVs, or UPI PINs. All financial payments are processed through Razorpay's PCI-DSS Level 1 compliant infrastructure.</em></li>
      <li><strong>Technical & Portal Usage Data:</strong> IP addresses, browser specifications, login activity, and local preferences (e.g. Dark/Light mode).</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">3</span>
      Purpose and Legal Basis for Processing
    </h2>
    <p>We process your information exclusively for legitimate educational and platform administration purposes, including:</p>
    <ul class="list-disc pl-5 space-y-1 text-xs sm:text-sm">
      <li>Reviewing and processing internship applications across chosen domains.</li>
      <li>Administering LMS portal credentials and task evaluation workflows.</li>
      <li>Conducting secure payment verification through our official Razorpay integration.</li>
      <li>Generating authentic ISO 9001:2015 & MSME recognized completion certificates.</li>
      <li>Allowing employers and academic institutions to verify certificate authenticity via our verification portal.</li>
      <li>Communicating program updates, task deadlines, and official announcements.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">4</span>
      Payment Security via Razorpay Gateway
    </h2>
    <p>All online payments on this portal are handled exclusively through <strong>Razorpay Software Private Limited</strong>. Razorpay is RBI-authorized and certified PCI-DSS Level 1 compliant. Your transaction data is encrypted in transit using 256-bit SSL encryption. Payment verification is authenticated server-side using cryptographic HMAC-SHA256 signature verification.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">5</span>
      Data Protection & Non-Disclosure
    </h2>
    <p><strong>We never sell, rent, lease, or trade student personal data to third parties.</strong> Data is shared only with vetted cloud infrastructure providers (Google Cloud / Firebase) for hosting and database integrity, and with notification systems for transactional alerts. We maintain strict Firestore security rules preventing unauthorized access to student databases.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">6</span>
      Data Retention & Student Rights
    </h2>
    <p>Internship and certificate records are retained indefinitely to guarantee lifelong certificate verification for students. Students have the right to request access to their profile, correction of typographical errors in names or credentials, or account closure by contacting our support team.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">7</span>
      Contact & Grievance Redressal
    </h2>
    <p>For any questions or privacy inquiries, contact our Privacy Officer:</p>
    <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-1 font-mono">
      <p><strong>Company:</strong> RAKSUDE TECHNOLOGIES</p>
      <p><strong>Address:</strong> 12, Tech Park, Bengaluru, Karnataka, India</p>
      <p><strong>Email:</strong> support@techintern.example / support@raksudetechnologies.com</p>
      <p><strong>Support Helpline:</strong> +91 98765 43210</p>
    </div>
  </section>
</div>
"@

$refundHtml = @"
<div class="policy-document space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
  <div class="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
    <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold">💰</div>
    <div class="text-xs sm:text-sm">
      <p class="font-bold text-slate-900 dark:text-white">Transparent Refund & Cancellation Policy</p>
      <p class="text-slate-600 dark:text-slate-400 mt-0.5">Please review our refund guidelines carefully before submitting payment. We are committed to fair and transparent billing practices.</p>
    </div>
  </div>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">1</span>
      Nature of the Enrollment Fee
    </h2>
    <p>The fee paid for the Raksude Technologies Internship Program is a nominal administrative charge. It covers digital LMS provisioning, domain learning modules, mentor evaluations, MSME accreditation verification, and cryptographic certificate generation.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">2</span>
      Eligibility for Cancellation and Refund
    </h2>
    <p>Refunds are processed under the following eligible conditions:</p>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Initial 3-Day Window:</strong> A student may request a 100% full refund within <strong>3 calendar days (72 hours)</strong> of making the payment, provided they have NOT yet submitted any assignments on the LMS portal.</li>
      <li><strong>Duplicate / Multiple Deductions:</strong> If a technical issue or gateway timeout causes your account to be debited more than once for the same Student ID, the duplicate transaction will be refunded 100% automatically or upon notification.</li>
      <li><strong>Service Unavailability:</strong> If Raksude Technologies is unable to deliver the chosen internship domain or digital LMS platform, a full 100% refund will be provided.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">3</span>
      Non-Refundable Situations
    </h2>
    <p>Refunds will <strong>NOT</strong> be issued under any of the following circumstances:</p>
    <ul class="list-disc pl-5 space-y-1 text-xs sm:text-sm">
      <li>Once the student has submitted one or more milestone tasks on the LMS portal.</li>
      <li>Once the student's completion certificate has been unlocked, viewed, or downloaded.</li>
      <li>If the refund request is submitted after 3 calendar days from the transaction date.</li>
      <li>If the student is disqualified due to plagiarism, fraud, code of conduct violations, or submitting non-original project code.</li>
      <li>Change of personal schedule, college exams, or voluntary non-participation after enrollment.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">4</span>
      How to Request a Refund
    </h2>
    <p>To request an eligible refund, email our finance desk at <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 dark:text-indigo-400">support@techintern.example</code> with the subject line <strong>"Refund Request - [Student ID] - [Payment ID]"</strong>. Please provide:</p>
    <ol class="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
      <li>Student Full Name & Student ID (e.g. INT-2026-0001)</li>
      <li>Razorpay Payment ID (e.g. pay_xxxxxxxxxxxx)</li>
      <li>Date of Transaction and Amount Paid</li>
      <li>Detailed reason for the cancellation request</li>
    </ol>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">5</span>
      Refund Processing & Timeline
    </h2>
    <p>All valid refunds are verified and processed directly through the **Razorpay Payment Gateway** back to the original payment source (UPI account, Debit/Credit Card, or Bank Account). The refund will reflect in your account within <strong>5 to 7 business days</strong> depending on your issuing bank's clearing cycle.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">6</span>
      Billing Support Contact
    </h2>
    <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-1 font-mono">
      <p><strong>Department:</strong> Student Billing & Accounts Desk</p>
      <p><strong>Email:</strong> support@techintern.example / support@raksudetechnologies.com</p>
      <p><strong>Phone:</strong> +91 98765 43210 (Mon–Fri, 10 AM to 6 PM IST)</p>
    </div>
  </section>
</div>
"@

$termsHtml = @"
<div class="policy-document space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
  <div class="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
    <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">📋</div>
    <div class="text-xs sm:text-sm">
      <p class="font-bold text-slate-900 dark:text-white">Terms of Service & Internship Agreement</p>
      <p class="text-slate-600 dark:text-slate-400 mt-0.5">Please read these terms carefully before participating in the Raksude Technologies Virtual Internship Program.</p>
    </div>
  </div>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">1</span>
      Acceptance of Agreement
    </h2>
    <p>By registering, applying for an internship, accessing the Student LMS portal, or completing payment via Razorpay, you ("Student" or "Intern") acknowledge and agree to comply with and be bound by these Terms & Conditions. If you do not agree with any part, you must refrain from using the platform.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">2</span>
      Program Modality, Structure & Duration
    </h2>
    <p>The Raksude Technologies Internship is a 30-day remote, virtual experiential training program designed to equip students with practical domain experience. Interns are provided structured weekly curriculum tasks, milestone projects, and code evaluation through our online portal.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">3</span>
      Student Responsibilities & Code of Conduct
    </h2>
    <ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
      <li><strong>Original Submissions:</strong> Interns must submit their own original code and project files. Submitting plagiarized repositories or solutions copied from other students is strictly prohibited.</li>
      <li><strong>Authenticity of Information:</strong> The name, college, degree, and identification details entered must be accurate and authentic, as these are permanently embedded in your final certificate.</li>
      <li><strong>Timely Submissions:</strong> Milestone assignments must be submitted via the LMS within the stipulated timeline to qualify for graduation.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">4</span>
      Fee Payment & Razorpay Gateway Terms
    </h2>
    <p>Internship enrollment fees are payable in Indian Rupees (INR). All payments are routed securely through the authorized Razorpay Payment Gateway. Razorpay supports UPI (QR Code & Apps) and Cards. Transactions are finalized upon automated backend HMAC verification. Please review our Refund Policy for cancellation guidelines.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">5</span>
      Certification & Online Verification
    </h2>
    <p>Upon completing task requirements and fee verification, interns receive an official Certificate of Internship Completion verified by Raksude Technologies with ISO 9001:2015 and MSME credentials. Certificates include a unique Certificate ID and QR code verifiable by employers 24/7 on our public verification portal.</p>
    <p class="text-xs text-slate-500 italic mt-1"><strong>Disclaimer:</strong> The internship certificate validates successful experiential training and task completion. It does not constitute a contract of employment or a guarantee of job placement.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">6</span>
      Intellectual Property Rights
    </h2>
    <p>Interns retain ownership of the original code and creative project solutions they author during the program. The curriculum materials, platform branding, documentation, and LMS infrastructure remain the exclusive intellectual property of Raksude Technologies.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">7</span>
      Governing Law & Legal Jurisdiction
    </h2>
    <p>These terms and conditions are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute or controversy arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru / Tamil Nadu, India.</p>
  </section>

  <section class="space-y-2">
    <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
      <span class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 text-xs flex items-center justify-center font-bold">8</span>
      Official Contact Information
    </h2>
    <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-1 font-mono">
      <p><strong>Entity:</strong> RAKSUDE TECHNOLOGIES</p>
      <p><strong>Office:</strong> 12, Tech Park, Bengaluru, Karnataka, India</p>
      <p><strong>Email:</strong> support@techintern.example / support@raksudetechnologies.com</p>
      <p><strong>Helpline:</strong> +91 98765 43210</p>
    </div>
  </section>
</div>
"@

# Authenticate anonymously to get token
$authRes = Invoke-RestMethod -Method POST -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey" -ContentType 'application/json' -Body '{}'
$token = $authRes.idToken
$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }

# Patch settings/app policies
$patchBody = @{
    fields = @{
        policies = @{
            mapValue = @{
                fields = @{
                    privacy = @{ stringValue = $privacyHtml }
                    refund  = @{ stringValue = $refundHtml }
                    terms   = @{ stringValue = $termsHtml }
                }
            }
        }
    }
} | ConvertTo-Json -Depth 6

$updateMask = 'updateMask.fieldPaths=policies'
$res = Invoke-RestMethod -Method PATCH -Uri "https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/settings/app`?$updateMask" `
    -Headers $headers -Body $patchBody

Write-Host "Policies successfully updated in Firestore settings/app!"
