import { prisma } from "../config/db.js";
import {
  createPaymentTransactionSchema,
  getPaymentTransactionSchema,
} from '../validator/paymentTransactionValidator.js';
import { customAlphabet } from 'nanoid';

const transactionReferenceSuffix = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

const generateTransactionReference = () => {
  return `TXN-${new Date().toISOString().split('T')[0]}-${transactionReferenceSuffix()}`;
};

const createPaymentTransaction = async (req, res) => {
  try {
    const { error, value } = createPaymentTransactionSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        reference: value.reference || generateTransactionReference(),
        userId: value.userId,
        pricingId: value.pricingId,
        companyId: value.companyId || null,
        centerId: value.centerId,
        amount: Number(value.amount),
        currency: value.currency || 'NGN',
        paymentId: value.paymentId,
        date: value.date ? new Date(value.date) : new Date(),
        type: value.type || 'COMPLETE',
        category: value.category || null,
        name: value.name || null,
        billing: value.billing || 'MONTHLY',
        status: value.status || 'PENDING',
        metadata: value.metadata || null,
      },
    });

    return res.status(201).json({
      ok: true,
      message: 'Payment transaction created successfully',
      transaction,
    });
  } catch (err) {
    console.error('Create payment transaction error:', err);
    return res.status(500).json({
      ok: false,
      message: err?.message || 'Server error',
    });
  }
};

const getPaymentTransactionsByUserId = async (req, res) => {
  try {
    const { userId, type } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const { fromDate, toDate, query } = req.query;
 
    if (!userId) {
      return res.status(400).json({ ok: false, message: 'User ID is required' });
    }

    // Build where clause based on type
    let where = {};
    if (String(type).toLocaleLowerCase() === ('COMPANY').toLocaleLowerCase()) {
      where.companyId = userId;
    } else if (String(type).toLocaleLowerCase() === ('CENTER').toLocaleLowerCase()) {
      where.centerId = userId;
    } else {
      // Default to MEMBER or any other type
      where.userId = userId;
    }

    // Add date range filtering
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }

    // Add payment ID query filtering
    if (query) {
      where.paymentId = {
        contains: query,
        mode: 'insensitive',
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentTransaction.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err?.message || 'Server error',
    });
  }
};

const getPaymentTransactionsByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    if (!paymentId) {
      return res.status(400).json({ ok: false, message: 'Payment ID is required' });
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: { paymentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentTransaction.count({ where: { paymentId } }),
    ]);

    return res.status(200).json({
      ok: true,
      transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err?.message || 'Server error',
    });
  }
};

const getPaymentTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ ok: false, message: 'Transaction reference is required' });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return res.status(404).json({ ok: false, message: 'Transaction not found' });
    }

    return res.status(200).json({ ok: true, transaction });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const getAllPaymentTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentTransaction.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: transactions,
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

const updatePaymentTransaction = async (req, res) => {
  try {
    const { reference } = req.params;
    const { status, metadata } = req.body;

    if (!reference) {
      return res.status(400).json({ ok: false, message: 'Transaction reference is required' });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return res.status(404).json({ ok: false, message: 'Transaction not found' });
    }

    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { reference },
      data: {
        ...(status && { status }),
        ...(metadata && { metadata }),
      },
    });

    return res.status(200).json({
      ok: true,
      message: 'Payment transaction updated successfully',
      transaction: updatedTransaction,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};
 
export {
  createPaymentTransaction,
  getPaymentTransactionsByUserId,
  getPaymentTransactionsByPaymentId,
  getPaymentTransactionByReference,
  getAllPaymentTransactions,
  updatePaymentTransaction,
  generateTransactionReference,
};
