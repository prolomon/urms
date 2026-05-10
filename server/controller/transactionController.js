import { prisma } from "../config/db.js";
import { createTransactionSchema } from "../validator/transactionValidator.js";

const validationErrorResponse = (res, error) => {
  const errors = error.details.map((detail) => detail.message);
  return res.status(400).json({
    ok: false,
    message: errors[0],
    errors,
  });
};

const normalizeAmount = (amount) => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
};

const createTransaction = async (req, res) => {
  try {
    const { error, value } = createTransactionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const payment = value.paymentId
      ? await prisma.payment.findUnique({ where: { id: value.paymentId } })
      : null;

    if (value.paymentId && !payment) {
      return res.status(404).json({
        ok: false,
        message: "Payment not found",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        reference: value.reference,
        merchantTxRef: value.merchantTxRef || value.userId || payment?.userId || null,
        event: value.event,
        status: value.status,
        amount: value.amount,
        currency: value.currency || "NGN",
        channel: value.channel || null,
        gatewayResponse: value.gatewayResponse || null,
        customerEmail: value.customerEmail || null,
        paymentId: value.paymentId || payment?.id || null,
        userId: value.userId || payment?.userId || null,
        metadata: value.metadata || null,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Transaction created successfully",
      transaction,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        ok: false,
        message: "Transaction already exists for this reference and event",
      });
    }

    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count(),
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
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransactionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const email = String(req.query.email || "").trim();

    const sort = (String(req.query.sort || 'desc').toLowerCase() === 'asc') ? 'asc' : 'desc';
    const eventFilter = req.query.event ? String(req.query.event).trim() : null;

    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

    const where = {
      AND: [
        {
          OR: [
            { userId },
            { merchantTxRef: userId },
            ...(email ? [{ customerEmail: email }] : []),
          ],
        },
      ],
    };

    if (eventFilter) {
      where.AND.push({ event: eventFilter });
    }

    if (fromDate || toDate) {
      const range = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) range.gte = fromDate;
      if (toDate && !Number.isNaN(toDate.getTime())) range.lte = toDate;
      if (Object.keys(range).length) {
        where.AND.push({ createdAt: range });
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sort },
      }),
      prisma.transaction.count({ where }),
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
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransactionsByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ ok: false, message: "Reference is required" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { reference },
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          select: { reference: true, amount: true, status: true, userId: true },
        },
      },
    });

    return res.status(200).json({ ok: true, transactions });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ ok: false, message: "Transaction ID is required" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return res.status(404).json({ ok: false, message: "Transaction not found" });
    }

    return res.status(200).json({ ok: true, transaction });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};
 
export {
  createTransaction,
  getAllTransactions,
  getTransactionsByUserId,
  getTransactionsByReference,
  getTransactionById,
};1