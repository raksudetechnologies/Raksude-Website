// =============================================================================
// RAZORPAY CONFIGURATION FILE
// Inga ungal Razorpay details-ai manual-aga enter panni save seiyavum.
// Intha file-il direct-aga details enter pannikollalam, UI-la enter panna vendiyathillai.
// =============================================================================

export const razorpayConfig = {
  // 1. Gateway Status (true = Active, false = Disabled)
  enabled: true,

  // 2. Environment Mode: 'test' for Sandbox or 'live' for Production
  mode: 'test',

  // 3. Razorpay Key ID (Starts with rzp_test_ or rzp_live_)
  keyId: 'rzp_test_TYeA8mMupmzryt',

  // 4. Razorpay Key Secret (Strictly private)
  keySecret: 'YOUR_RAZORPAY_KEY_SECRET_HERE',

  // 5. Razorpay Hosted Payment Page URL (Optional - e.g. https://rzp.io/l/your_link)
  // If you created a Razorpay Payment Page or Payment Button, paste the link here.
  paymentPageUrl: '',

  // 6. Webhook Secret (Optional)
  webhookSecret: '',

  // 7. Backend Functions URL (Optional - leave empty for standard checkout)
  functionsUrl: '',

  // 8. Payment Defaults
  currency: 'INR',
  defaultAmount: 2999,

  // 9. Merchant Branding
  businessName: 'Zevyra Tech',
  themeColor: '#4f46e5'
};

/**
 * Checks whether valid Razorpay credentials have been entered in this file.
 */
export const isRazorpayConfigured = () => {
  return (
    razorpayConfig.enabled &&
    Boolean(razorpayConfig.keyId) &&
    !razorpayConfig.keyId.includes('YOUR_KEY_ID') &&
    razorpayConfig.keyId.startsWith('rzp_')
  );
};
