import { createPayment, saveStudent, logActivity } from './database.js';
import { PAYMENT } from './utils.js';


export function getPaymentView(student, settings) {
  const p = settings.payment || {};
  return {
    fee: student.feeAmount != null ? Number(student.feeAmount) : Number(p.amount || 199),
    razorpayOn: p.razorpayEnabled !== false,
    stop: !!p.stopPayment,
    status: student.paymentStatus
  };
}

