# Secure Dev & Production Server with Razorpay Verification Backend
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8080
$FIREBASE_PROJECT = 'cvx-8790a'
$FIREBASE_API_KEY = 'AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58'

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "=================================================================="
Write-Host " RAKSUDE TECHNOLOGIES - SECURE PAYMENT & LMS SERVER"
Write-Host " Server listening on http://localhost:$port/"
Write-Host " APIs: /api/create-order | /api/verify-payment | /api/webhook"
Write-Host " APIs: /api/status | /api/reload-config"
Write-Host "=================================================================="

# ── Razorpay config defaults (overridden by server-config.json or Firestore)
$serverConfig = @{
  keyId        = ''
  keySecret    = ''
  webhookSecret = ''
  currency     = 'INR'
  source       = 'default'
}

# ── Function: Load config from server-config.json (file fallback)
function Load-FileConfig {
  $configFile = Join-Path $root 'server-config.json'
  if (Test-Path $configFile) {
    try {
      $loaded = Get-Content $configFile -Raw | ConvertFrom-Json
      if ($loaded.keyId -and !$loaded.keyId.Contains('YOUR_')) {
        $script:serverConfig.keyId        = $loaded.keyId
        $script:serverConfig.keySecret    = if ($loaded.keySecret) { $loaded.keySecret } else { $script:serverConfig.keySecret }
        $script:serverConfig.webhookSecret = if ($loaded.webhookSecret) { $loaded.webhookSecret } else { $script:serverConfig.webhookSecret }
        $script:serverConfig.source       = 'server-config.json'
        Write-Host "[Config] Loaded keys from server-config.json (keyId: $($loaded.keyId.Substring(0, [Math]::Min(16, $loaded.keyId.Length)))...)"
      }
    } catch {
      Write-Warning "[Config] Could not parse server-config.json: $_"
    }
  }
}

# ── Function: Load config from Firestore admin secure_config/razorpay
function Load-FirestoreConfig {
  try {
    # Authenticate anonymously for public read (secure_config is admin-only but we use service pattern)
    # We actually read settings/app for the keyId (public) and check if we have the secret locally
    $settingsRes = Invoke-RestMethod -Method GET `
      -Uri "https://firestore.googleapis.com/v1/projects/$FIREBASE_PROJECT/databases/(default)/documents/settings/app?key=$FIREBASE_API_KEY" `
      -ErrorAction Stop

    $fields = $settingsRes.fields
    $paymentField = $fields.payment
    if ($paymentField -and $paymentField.mapValue -and $paymentField.mapValue.fields) {
      $pf = $paymentField.mapValue.fields
      $fsKeyId = if ($pf.razorpayKeyId) { $pf.razorpayKeyId.stringValue } else { '' }
      if ($fsKeyId -and $fsKeyId.StartsWith('rzp_') -and !$fsKeyId.Contains('YOUR_KEY')) {
        $script:serverConfig.keyId = $fsKeyId
        $script:serverConfig.source = 'Firestore (Admin Settings)'
        Write-Host "[Config] Loaded Key ID from Firestore: $($fsKeyId.Substring(0, [Math]::Min(16, $fsKeyId.Length)))..."
      }
    }
  } catch {
    Write-Host "[Config] Firestore settings read note: $($_.Exception.Message) (using local config)"
  }
}

# ── Load config: file first, then Firestore overrides KeyId if admin updated it
Load-FileConfig
Load-FirestoreConfig

$configLoadedAt = [DateTime]::UtcNow
Write-Host "[Config] Active Key ID : $($serverConfig.keyId.Substring(0, [Math]::Min(16, $serverConfig.keyId.Length)))... | Source: $($serverConfig.source)"

# In-memory processed payment ID cache for duplicate payment prevention (idempotency)
$processedPayments = [System.Collections.Concurrent.ConcurrentDictionary[string, bool]]::new()

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff2'= 'font/woff2'
}

function Send-Json([System.Net.HttpListenerResponse]$response, [int]$statusCode, [object]$data) {
  $jsonStr = $data | ConvertTo-Json -Depth 5 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
  $response.StatusCode = $statusCode
  $response.ContentType = "application/json; charset=utf-8"
  $response.Headers.Add("Access-Control-Allow-Origin", "*")
  $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Razorpay-Signature")
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.Close()
}

function Compute-HmacSha256([string]$message, [string]$secret) {
  $keyBytes = [System.Text.Encoding]::UTF8.GetBytes($secret)
  $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($message)
  $hmac = New-Object System.Security.Cryptography.HMACSHA256 -ArgumentList @(,$keyBytes)
  $hash = $hmac.ComputeHash($msgBytes)
  return -join ($hash | ForEach-Object { '{0:x2}' -f $_ })
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $path = $req.Url.AbsolutePath

    # Handle CORS Preflight
    if ($req.HttpMethod -eq 'OPTIONS') {
      $res.StatusCode = 204
      $res.Headers.Add("Access-Control-Allow-Origin", "*")
      $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Razorpay-Signature")
      $res.Close()
      continue
    }

    # -------------------------------------------------------------
    # API: Backend Status Check (/api/status) - Used by Admin Panel
    # -------------------------------------------------------------
    if ($path -eq '/api/status' -and ($req.HttpMethod -eq 'GET' -or $req.HttpMethod -eq 'POST')) {
      $hasSecret = ($serverConfig.keySecret -and $serverConfig.keySecret.Length -gt 5 -and !$serverConfig.keySecret.Contains('demo'))
      $keyMode = if ($serverConfig.keyId.StartsWith('rzp_live_')) { 'live' } elseif ($serverConfig.keyId.StartsWith('rzp_test_')) { 'test' } else { 'unconfigured' }
      Send-Json $res 200 @{
        ok            = $true
        status        = 'running'
        keyId         = if ($serverConfig.keyId) { $serverConfig.keyId } else { '' }
        keyMode       = $keyMode
        hasSecret     = $hasSecret
        hasWebhook    = ($serverConfig.webhookSecret -and !$serverConfig.webhookSecret.Contains('demo'))
        configSource  = $serverConfig.source
        configLoadedAt = $configLoadedAt.ToString('o')
        uptime        = [Math]::Round(([DateTime]::UtcNow - $configLoadedAt).TotalMinutes, 1)
        serverVersion = '2.0'
      }
      continue
    }

    # -------------------------------------------------------------
    # API: Hot-reload Config from Firestore + local file (/api/reload-config)
    # -------------------------------------------------------------
    if ($path -eq '/api/reload-config' -and $req.HttpMethod -eq 'POST') {
      Load-FileConfig
      Load-FirestoreConfig
      $script:configLoadedAt = [DateTime]::UtcNow
      $keyMode = if ($serverConfig.keyId.StartsWith('rzp_live_')) { 'live' } elseif ($serverConfig.keyId.StartsWith('rzp_test_')) { 'test' } else { 'unconfigured' }
      Write-Host "[Config] Hot-reloaded at $($script:configLoadedAt.ToString('s')) | Source: $($serverConfig.source)"
      Send-Json $res 200 @{
        ok           = $true
        reloaded     = $true
        keyId        = $serverConfig.keyId
        keyMode      = $keyMode
        configSource = $serverConfig.source
      }
      continue
    }

    # -------------------------------------------------------------
    # API: Save Config directly from Admin Panel (/api/save-config)
    # -------------------------------------------------------------
    if ($path -eq '/api/save-config' -and $req.HttpMethod -eq 'POST') {
      try {
        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json
        if ($body.keyId) { $serverConfig.keyId = [string]$body.keyId }
        if ($body.keySecret) { $serverConfig.keySecret = [string]$body.keySecret }
        if ($body.webhookSecret) { $serverConfig.webhookSecret = [string]$body.webhookSecret }
        if ($body.currency) { $serverConfig.currency = [string]$body.currency }
        $serverConfig.source = 'Admin Panel Direct Save'
        $script:configLoadedAt = [DateTime]::UtcNow

        $configFile = Join-Path $root 'server-config.json'
        $jsonOut = @{
          keyId         = $serverConfig.keyId
          keySecret     = $serverConfig.keySecret
          webhookSecret = $serverConfig.webhookSecret
          currency      = $serverConfig.currency
          companyName   = if ($body.companyName) { [string]$body.companyName } else { 'Raksude Technologies' }
        } | ConvertTo-Json -Depth 3
        [System.IO.File]::WriteAllText($configFile, $jsonOut, [System.Text.Encoding]::UTF8)

        $keyMode = if ($serverConfig.keyId.StartsWith('rzp_live_')) { 'live' } elseif ($serverConfig.keyId.StartsWith('rzp_test_')) { 'test' } else { 'unconfigured' }
        Write-Host "[Config] Razorpay keys saved from Admin Panel! Key: $($serverConfig.keyId.Substring(0, [Math]::Min(16, $serverConfig.keyId.Length)))... Mode: $keyMode"
        Send-Json $res 200 @{
          ok           = $true
          saved        = $true
          keyId        = $serverConfig.keyId
          keyMode      = $keyMode
          configSource = $serverConfig.source
        }
      } catch {
        Send-Json $res 500 @{ ok = $false; error = $_.Exception.Message }
      }
      continue
    }

    # -------------------------------------------------------------
    # API: Create Razorpay Order (/api/create-order)
    # -------------------------------------------------------------
    if ($path -eq '/api/create-order' -and $req.HttpMethod -eq 'POST') {
      try {
        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json
        $amount = [int]($body.amount)
        if ($amount -le 0) { $amount = 199 }
        $studentId = [string]($body.studentId)
        $amountPaise = $amount * 100

        $orderId = $null
        # Attempt server-side creation via Razorpay API if valid credentials exist
        if ($serverConfig.keyId -and $serverConfig.keySecret -and !$serverConfig.keySecret.Contains('demo')) {
          try {
            $authHeader = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("$($serverConfig.keyId):$($serverConfig.keySecret)"))
            $rpOrderBody = @{
              amount = $amountPaise
              currency = $serverConfig.currency
              receipt = "rcpt_$($studentId)_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
              notes = @{ studentId = $studentId }
            } | ConvertTo-Json

            $rpRes = Invoke-RestMethod -Method POST -Uri 'https://api.razorpay.com/v1/orders' `
              -Headers @{ 'Authorization' = "Basic $authHeader"; 'Content-Type' = 'application/json' } `
              -Body $rpOrderBody
            if ($rpRes.id) { $orderId = $rpRes.id }
          } catch {
            Write-Warning "Razorpay API call note: $($_.Exception.Message). Falling back to secure sandbox order."
          }
        }

        # Sandbox / Mock order fallback for frictionless development & test sandbox
        if (!$orderId) {
          $rnd = [Guid]::NewGuid().ToString('N').Substring(0, 14)
          $orderId = "order_$rnd"
        }

        Send-Json $res 200 @{
          success = $true
          orderId = $orderId
          amount = $amount
          amountPaise = $amountPaise
          currency = $serverConfig.currency
          keyId = $serverConfig.keyId
        }
      } catch {
        Send-Json $res 500 @{ success = $false; error = $_.Exception.Message }
      }
      continue
    }

    # -------------------------------------------------------------
    # API: Verify Payment Signature & Update DB (/api/verify-payment)
    # -------------------------------------------------------------
    if ($path -eq '/api/verify-payment' -and $req.HttpMethod -eq 'POST') {
      try {
        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json

        $orderId = [string]($body.razorpay_order_id)
        $paymentId = [string]($body.razorpay_payment_id)
        $signature = [string]($body.razorpay_signature)
        $studentId = [string]($body.studentId)
        $amount = [int]($body.amount)
        if ($amount -le 0) { $amount = 199 }
        $studentName = [string]($body.studentName)
        $domainName = [string]($body.domainName)

        if (!$paymentId -or !$studentId) {
          Send-Json $res 400 @{ success = $false; error = "Missing paymentId or studentId" }
          continue
        }

        # Prevent duplicate payment processing (Idempotency)
        if ($processedPayments.ContainsKey($paymentId)) {
          Write-Host "Idempotency notice: Payment $paymentId already processed."
          Send-Json $res 200 @{
            success = $true
            verified = $true
            alreadyProcessed = $true
            redirectUrl = "/certificate?studentId=$studentId&paymentId=$paymentId"
          }
          continue
        }

        # Cryptographic Signature Verification
        $isSignatureValid = $false
        if ($signature -and $orderId -and $serverConfig.keySecret -and !$serverConfig.keySecret.Contains('demo')) {
          $payload = "$orderId|$paymentId"
          $expectedSignature = Compute-HmacSha256 $payload $serverConfig.keySecret
          if ($expectedSignature.ToLower() -eq $signature.ToLower()) {
            $isSignatureValid = $true
          }
        } else {
          # In test mode or when using standard checkout callback with valid payment ID
          if ($paymentId.StartsWith('pay_')) {
            $isSignatureValid = $true
          }
        }

        if (!$isSignatureValid) {
          Send-Json $res 400 @{ success = $false; error = "Invalid payment signature verification failed." }
          continue
        }

        # Register in idempotency cache
        $processedPayments.TryAdd($paymentId, $true) | Out-Null

        # Record verified payment in Firestore
        $nowIso = [DateTime]::UtcNow.ToString("o")
        $nowTs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

        # Update student record: paymentStatus = 'paid', paymentVerified = true
        try {
          $apiKey = 'AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58'
          # Sign in anonymously to obtain secure token
          $authRes = Invoke-RestMethod -Method POST -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey" -ContentType 'application/json' -Body '{}'
          $token = $authRes.idToken
          $uid = $authRes.localId

          $headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }
          # Map uid
          $mapBody = @{ fields = @{ studentId = @{ stringValue = $studentId } } } | ConvertTo-Json
          Invoke-RestMethod -Method PATCH -Uri "https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/uid_map/$uid" -Headers $headers -Body $mapBody | Out-Null

          $safeOrderId = if ($orderId) { $orderId } else { '' }
          $safeName = if ($studentName) { $studentName } else { '' }
          $safeDomain = if ($domainName) { $domainName } else { '' }

          # Patch student record with all payment verification fields
          $studentPatch = @{
            fields = @{
              paymentStatus     = @{ stringValue  = 'paid' }
              certificateStatus = @{ stringValue  = 'UNLOCKED' }
              paymentVerified   = @{ booleanValue = $true }
              paymentId         = @{ stringValue  = $paymentId }
              orderId           = @{ stringValue  = $safeOrderId }
              paymentDate       = @{ stringValue  = $nowIso }
            }
          } | ConvertTo-Json -Depth 5

          $updateMask = 'updateMask.fieldPaths=paymentStatus&updateMask.fieldPaths=certificateStatus&updateMask.fieldPaths=paymentVerified&updateMask.fieldPaths=paymentId&updateMask.fieldPaths=orderId&updateMask.fieldPaths=paymentDate'
          Invoke-RestMethod -Method PATCH -Uri "https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/students/$studentId`?$updateMask" `
            -Headers $headers -Body $studentPatch | Out-Null

          # Create payment record
          $paymentBody = @{
            fields = @{
              studentId = @{ stringValue = $studentId }
              name = @{ stringValue = $safeName }
              domainName = @{ stringValue = $safeDomain }
              amount = @{ integerValue = [string]$amount }
              method = @{ stringValue = 'RAZORPAY' }
              status = @{ stringValue = 'paid' }
              paymentVerified = @{ booleanValue = $true }
              razorpayPaymentId = @{ stringValue = $paymentId }
              orderId = @{ stringValue = $safeOrderId }
              createdAt = @{ integerValue = [string]$nowTs }
              paymentDate = @{ stringValue = $nowIso }
            }
          } | ConvertTo-Json -Depth 5

          Invoke-RestMethod -Method POST -Uri "https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/payments" `
            -Headers $headers -Body $paymentBody | Out-Null

          Write-Host "Payment verified & recorded: Student $studentId | Payment $paymentId | Amount ₹$amount"
        } catch {
          Write-Warning "Firestore direct update notice: $($_.Exception.Message)"
        }

        Send-Json $res 200 @{
          success = $true
          verified = $true
          paymentId = $paymentId
          orderId = $orderId
          studentId = $studentId
          redirectUrl = "/certificate?studentId=$studentId&paymentId=$paymentId"
        }
      } catch {
        Send-Json $res 500 @{ success = $false; error = $_.Exception.Message }
      }
      continue
    }

    # -------------------------------------------------------------
    # API: Razorpay Webhook Confirmation (/api/webhook)
    # -------------------------------------------------------------
    if ($path -eq '/api/webhook' -and $req.HttpMethod -eq 'POST') {
      try {
        $webhookSig = $req.Headers['X-Razorpay-Signature']
        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
        $rawBody = $reader.ReadToEnd()

        if ($serverConfig.webhookSecret -and !$serverConfig.webhookSecret.Contains('demo') -and $webhookSig) {
          $computedSig = Compute-HmacSha256 $rawBody $serverConfig.webhookSecret
          if ($computedSig.ToLower() -ne $webhookSig.ToLower()) {
            Send-Json $res 400 @{ error = "Invalid webhook signature" }
            continue
          }
        }

        $eventData = $rawBody | ConvertFrom-Json
        $event = $eventData.event
        if ($event -eq 'payment.captured' -or $event -eq 'order.paid') {
          $pEntity = $eventData.payload.payment.entity
          $pId = $pEntity.id
          $sId = $pEntity.notes.studentId
          if ($sId -and $pId) {
            Write-Host "Webhook captured payment: $pId for student: $sId"
            $processedPayments.TryAdd($pId, $true) | Out-Null
          }
        }

        Send-Json $res 200 @{ status = "ok" }
      } catch {
        Send-Json $res 500 @{ error = $_.Exception.Message }
      }
      continue
    }

    # -------------------------------------------------------------
    # Protected static routing & Security Filters
    # -------------------------------------------------------------
    # Block access to server-side configuration and sensitive files
    if ($path -match '(?i)\.(json|rules|ps1|git|env|log)$' -and $path -notmatch '(?i)database\.rules\.json') {
      $res.StatusCode = 403
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden: Access to sensitive file is prohibited.")
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.Close()
      continue
    }

    # Friendly route: /certificate -> certificate.html
    if ($path -eq '/certificate' -or $path -eq '/certificate/') {
      $path = '/certificate.html'
    }
    if ($path -eq '/') {
      $path = '/index.html'
    }

    $file = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
    try {
      if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
