import { prisma } from "../config/db.js";
import { createPaymentSchema } from '../validator/paymentValidator.js';

const createPayment = async (req, res) => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const payment = await prisma.payment.create({
      data: value,
    });

    try {
      const notificationType = payment.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING';
      const notificationTitle = payment.status === 'SUCCESS' ? 'Payment Successful' : 'Payment Pending';
      const notificationDescription = payment.status === 'SUCCESS' 
        ? `Your payment of ${payment.amount} has been processed successfully.`
        : `Your payment of ${payment.amount} is pending approval.`;

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: notificationTitle,
          description: notificationDescription,
          type: notificationType,
          date: new Date(),
        },
      });
    } catch (notificationError) {
      console.error('Failed to create payment notification:', notificationError.message || notificationError);
    }

    return res.status(201).json({ ok: true, message: 'Payment created successfully', payment });
  } catch (err) {
    console.error('Create payment error:', err);
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const getPaymentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ ok: false, message: 'User ID is required' });
    }

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ ok: true, payments });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const getPaymentByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ ok: false, message: 'Payment reference is required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: 'Payment not found' });
    }

    return res.status(200).json({ ok: true, payment });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { member: { select: { id: true, fullname: true, email: true, uid: true } } },
      }),
      prisma.payment.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ ok: false, message: 'Payment reference is required' });
    }

    // Update payment to set isVerify to true
    const payment = await prisma.payment.update({
      where: { reference: id },
      data: { isVerify: true },
      include: { member: true },
    });

    // Notify user
    if (payment.userId) {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Verified',
          description: `Your payment of ${payment.amount} has been verified successfully.`,
          type: 'SUCCESS',
          date: new Date(),
        },
      });
    }

    // Notify agent
    if (payment.agentId) {
      await prisma.notification.create({
        data: {
          userId: payment.agentId,
          title: 'Payment Verification Success',
          description: `A payment of ${payment.amount} for your member has been verified successfully.`,
          type: 'SUCCESS',
          date: new Date(),
        },
      });
    }

    return res.status(200).json({ ok: true, message: 'Payment verified successfully', payment });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

export {
  createPayment,
  getPaymentsByUserId,
  getPaymentByReference,  
  getAllPayments,
  verifyPayment,
};