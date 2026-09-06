$res = Invoke-RestMethod -Uri 'https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/settings/app?key=AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58'
if ($res.fields.policies -and $res.fields.policies.mapValue -and $res.fields.policies.mapValue.fields) {
    $res.fields.policies.mapValue.fields | ConvertTo-Json -Depth 4
} else {
    Write-Host 'No policies found in Firestore settings/app'
}
