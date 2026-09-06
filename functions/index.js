const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const Razorpay = require('razorpay');

admin.initializeApp();
const db = admin.firestore();

// Helper to fetch Razorpay credentials from secure_config
async function getRazorpayCredentials() {
  const doc = await db.collection('secure_config').doc('razorpay').get();
  const data = doc.exists ? doc.data() : {};
  return {
    keyId: data.keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_TYeA8mMupmzryt',
    keySecret: data.secretKey || process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: data.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || ''
  };
}

/**
 * Cloud Function: Create Razorpay Order
 * Generates an official Razorpay order_id securely from the server
 */
exports.createOrder = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    const { amount, studentId, currency = 'INR' } = req.body;
    const creds = await getRazorpayCredentials();

    if (!creds.keyId || !creds.keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    const instance = new Razorpay({
      key_id: creds.keyId,
      key_secret: creds.keySecret,
    });

    const options = {
      amount: Math.round(Number(amount || 199) * 100), // paise
      currency,
      receipt: `rcpt_${studentId}_${Date.now()}`,
      notes: { studentId }
    };

    const order = await instance.orders.create(options);
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: options.amount / 100,
      currency: options.currency,
      keyId: creds.keyId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cloud Function: Verify Razorpay Payment Signature
 * Computes HMAC-SHA256 signature, ensures idempotency, and updates student record
 */
exports.verifyPayment = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      amount,
      studentName,
      domainName
    } = req.body;

    if (!razorpay_payment_id || !studentId) {
      return res.status(400).json({ error: 'Missing paymentId or studentId' });
    }

    // Check duplicate payment (Idempotency)
    const existingPayment = await db.collection('payments').doc(razorpay_payment_id).get();
    if (existingPayment.exists) {
      return res.status(200).json({
        success: true,
        verified: true,
        alreadyProcessed: true,
        redirectUrl: `/certificate?studentId=${encodeURIComponent(studentId)}&paymentId=${encodeURIComponent(razorpay_payment_id)}`
      });
    }

    const creds = await getRazorpayCredentials();

    // Verify HMAC-SHA256 signature
    if (creds.keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', creds.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
      }
    }

    const nowIso = new Date().toISOString();
    const nowTs = Date.now();

    // Atomic Batch write: update student + record payment
    const batch = db.batch();

    const studentRef = db.collection('students').doc(studentId);
    batch.update(studentRef, {
      paymentStatus: 'paid',
      paymentVerified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id || '',
      paymentDate: nowIso,
      certificateStatus: 'UNLOCKED'
    });

    const paymentRef = db.collection('payments').doc(razorpay_payment_id);
    batch.set(paymentRef, {
      id: razorpay_payment_id,
      studentId,
      name: studentName || '',
      domainName: domainName || '',
      amount: Number(amount || 199),
      method: 'RAZORPAY',
      status: 'paid',
      paymentVerified: true,
      razorpayPaymentId: razorpay_payment_id,
      orderId: razorpay_order_id || '',
      createdAt: nowTs,
      paymentDate: nowIso
    });

    await batch.commit();

    res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      redirectUrl: `/certificate?studentId=${encodeURIComponent(studentId)}&paymentId=${encodeURIComponent(razorpay_payment_id)}`
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cloud Function: Razorpay Webhook Handler
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const creds = await getRazorpayCredentials();

    if (creds.webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', creds.webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).send('Invalid webhook signature');
      }
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const studentId = paymentEntity.notes?.studentId;
      const paymentId = paymentEntity.id;

      if (studentId && paymentId) {
        await db.collection('students').doc(studentId).set({
          paymentStatus: 'paid',
          paymentVerified: true,
          paymentId: paymentId,
          orderId: paymentEntity.order_id || '',
          paymentDate: new Date().toISOString(),
          certificateStatus: 'UNLOCKED'
        }, { merge: true });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send(error.message);
  }
});
