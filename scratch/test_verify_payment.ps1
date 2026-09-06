$body = @{
    razorpay_order_id = 'order_f5f4cedb909146'
    razorpay_payment_id = 'pay_TEST12345678'
    razorpay_signature = ''
    studentId = 'INT-2026-0001'
    amount = 199
    studentName = 'Test Student'
    domainName = 'Full Stack Web Development'
} | ConvertTo-Json

$res = Invoke-RestMethod -Method POST -Uri 'http://localhost:8080/api/verify-payment' -Body $body -ContentType 'application/json'
$res | ConvertTo-Json
