$settingsContent = Get-Content 'assets\js\settings.js' -Raw

@{
    hasPrivacyRazorpay = $settingsContent.Contains('PCI-DSS Level 1 Certified')
    hasRefund3Days     = $settingsContent.Contains('3-Day Initial Cancellation Window')
    hasTermsPlagiarism = $settingsContent.Contains('Academic Integrity & Anti-Plagiarism Policy')
    hasContactInfo     = $settingsContent.Contains('12, Tech Park, Bengaluru')
} | ConvertTo-Json
