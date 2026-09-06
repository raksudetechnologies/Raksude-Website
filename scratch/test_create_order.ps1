$body = @{
    amount = 199
    studentId = 'INT-2026-0001'
    currency = 'INR'
} | ConvertTo-Json

$res = Invoke-RestMethod -Method POST -Uri 'http://localhost:8080/api/create-order' -Body $body -ContentType 'application/json'
$res | ConvertTo-Json
