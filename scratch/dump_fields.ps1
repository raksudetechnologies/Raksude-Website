$res = Invoke-RestMethod -Uri 'https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/students/INT-2026-0001?key=AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58'
$res.fields | ConvertTo-Json -Depth 4
