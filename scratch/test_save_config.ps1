$body = @{
    keyId = 'rzp_test_TYeA8mMupmzryt'
    keySecret = 'rzp_test_secret_demo'
    webhookSecret = 'rzp_webhook_secret_demo'
    currency = 'INR'
    companyName = 'Raksude Technologies'
} | ConvertTo-Json

$res = Invoke-RestMethod -Method POST -Uri 'http://localhost:8080/api/save-config' -Body $body -ContentType 'application/json'
$res | ConvertTo-Json
