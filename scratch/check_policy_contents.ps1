$p = (Invoke-WebRequest -Uri 'http://localhost:8080/privacy.html' -UseBasicParsing).Content
$r = (Invoke-WebRequest -Uri 'http://localhost:8080/refund.html' -UseBasicParsing).Content
$t = (Invoke-WebRequest -Uri 'http://localhost:8080/terms.html' -UseBasicParsing).Content

@{
    privacyHasRazorpay = $p.Contains('Razorpay')
    privacyHasRaksude  = $p.Contains('Raksude')
    refundHas3Days     = $r.Contains('3-Day') -or $r.Contains('3 calendar days')
    refundHasRazorpay  = $r.Contains('Razorpay')
    termsHasAntiPlagiarism = $t.Contains('Anti-Plagiarism') -or $t.Contains('Original')
    termsHasRazorpay   = $t.Contains('Razorpay')
} | ConvertTo-Json
