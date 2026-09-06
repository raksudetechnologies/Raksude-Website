$res = Invoke-RestMethod -Uri 'https://firestore.googleapis.com/v1/projects/cvx-8790a/databases/(default)/documents/settings/app?key=AIzaSyAYpO4rp6_Y9LWYSZR3Lub8Su9NHcN2Y58'
if ($res.fields.company -and $res.fields.company.mapValue -and $res.fields.company.mapValue.fields) {
    $res.fields.company.mapValue.fields | ConvertTo-Json -Depth 4
}
