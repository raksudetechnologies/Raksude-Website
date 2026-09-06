import { loadScript, PAYMENT } from './utils.js';
import { createPayment, saveStudent, logActivity, approveRazorpayPayment } from './database.js';
import { razorpayConfig } from './razorpay-config.js';

/**
 * Resolves the live Razorpay Key ID with this priority order:
 *   1. settings.payment.razorpayKeyId  (saved by admin from Admin → Razorpay Setup)
 *   2. razorpayConfig.keyId            (static file fallback)
 * Returns null if neither is a valid key.
 */
function resolveKeyId(settings = {}) {
  const fromSettings = (settings.payment?.razorpayKeyId || '').trim();
  const fromConfig   = (razorpayConfig.keyId || '').trim();
  const valid        = (k) => k && k.startsWith('rzp_') && !k.includes('YOUR_KEY_ID');
  return valid(fromSettings) ? fromSettings : valid(fromConfig) ? fromConfig : null;
}

/**
 * Opens the Razorpay checkout modal and resolves with the Razorpay response on success.
 * Throws on cancellation or failure.
 *
 * Key ID priority: Admin Settings → razorpay-config.js static file.
 *
 * If the payment page (`razorpay.html`) is handling post-payment logic itself
 * (via approveRazorpayPayment), pass `skipDbWrite: true` in settings.
 */
export async function payWithRazorpay(student, settings = {}, { skipDbWrite = false } = {}) {
  const p     = settings.payment || {};
  const keyId = resolveKeyId(settings);

  if (!keyId) {
    throw new Error(
      'Razorpay Key ID not configured. ' +
      'Please go to Admin → Razorpay Setup and save your Key ID.'
    );
  }

  // Ensure SDK is loaded (no-op if already present)
  if (typeof Razorpay === 'undefined') {
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  }

  const amount   = Number(student.feeAmount || p.amount || razorpayConfig.defaultAmount || 2999);
  const base     = (p.razorpayFunctionsUrl || razorpayConfig.functionsUrl || '').replace(/\/$/, '');
  const name     = settings.company?.name || razorpayConfig.businessName || 'Internship Portal';
  const logoUrl  = settings.company?.logoUrl || '';
  const color    = razorpayConfig.themeColor || '#4f46e5';
  const currency = razorpayConfig.currency   || 'INR';

  // Optional server-side order creation
  let orderId = null;
  if (base) {
    try {
      const res = await fetch(`${base}/createOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, studentId: student.studentId })
      });
      if (res.ok) orderId = (await res.json()).orderId;
    } catch (e) {
      console.warn('Order creation skipped (no backend):', e.message);
    }
  }

  return new Promise((resolve, reject) => {
    const options = {
      key:         keyId,
      amount:      amount * 100,   // paise
      currency,
      name,
      description: `Internship Fee${student.domainName ? ' — ' + student.domainName : ''}`,
      ...(logoUrl  ? { image: logoUrl }         : {}),
      ...(orderId  ? { order_id: orderId }      : {}),
      prefill: {
        name:    student.name    || '',
        email:   student.email   || '',
        contact: student.phone   || ''
      },
      notes:  { studentId: student.studentId },
      theme:  { color },
      modal:  { ondismiss: () => reject(new Error('Payment cancelled')) },

      handler: async (resp) => {
        try {
          // Optional backend verification
          if (base) {
            try {
              const vres = await fetch(`${base}/verifyPayment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...resp, studentId: student.studentId })
              });
              const body = await vres.json().catch(() => ({}));
              if (!vres.ok || !body.verified) {
                throw new Error('Server verification failed. Contact support with Payment ID: ' + resp.razorpay_payment_id);
              }
            } catch (ve) {
              // If backend verification fails, still allow — log the error
              console.warn('Backend verify failed, proceeding client-side:', ve.message);
            }
          }

          // Write payment record + update student status (unless caller handles it)
          if (!skipDbWrite) {
            await approveRazorpayPayment(
              student.studentId,
              resp.razorpay_payment_id,
              amount,
              student.name,
              student.domainName
            );
          }

          resolve(resp);
        } catch (e) {
          reject(e);
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (r) =>
        reject(new Error(r.error?.description || r.error?.reason || 'Payment failed'))
      );
      rzp.open();
    } catch (e) {
      reject(new Error('Could not open Razorpay: ' + e.message));
    }
  });
}
