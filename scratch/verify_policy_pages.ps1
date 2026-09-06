$p = Invoke-WebRequest -Uri 'http://localhost:8080/privacy.html' -UseBasicParsing
$r = Invoke-WebRequest -Uri 'http://localhost:8080/refund.html' -UseBasicParsing
$t = Invoke-WebRequest -Uri 'http://localhost:8080/terms.html' -UseBasicParsing

@{
    privacyStatus = $p.StatusCode
    privacyLength = $p.Content.Length
    refundStatus = $r.StatusCode
    refundLength = $r.Content.Length
    termsStatus = $t.StatusCode
    termsLength = $t.Content.Length
} | ConvertTo-Json
