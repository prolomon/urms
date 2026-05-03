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

const resolveWebhookStatus = (eventName) => {
  switch (eventName) {
    case "charge.success":
    case "transfer.success":
      return "SUCCESS";
    case "transfer.failed":
    case "charge.failed":
      return "FAILED";
    case "refund.processed":
      return "REFUNDED";
    default:
      return "PENDING";
  }
};

const resolveWebhookReference = (payload) => {
  return (
    payload?.data?.reference ||
    payload?.data?.trxref ||
    payload?.data?.transaction_reference ||
    payload?.data?.id?.toString() ||
    null
  );
};

const resolveWebhookAmount = (payload) => {
  const rawAmount = normalizeAmount(payload?.data?.amount);

  if (rawAmount === null) {
    return 0;
  }

  return rawAmount > 0 ? rawAmount / 100 : rawAmount;
};

const resolveWebhookUserId = async (payload, payment) => {
  if (payment?.userId) {
    return payment.userId;
  }

  const metadataUserId = payload?.data?.metadata?.userId || payload?.data?.metadata?.uid || null;
  if (metadataUserId) {
    return String(metadataUserId);
  }

  const customerCode = payload?.data?.customer?.customer_code || payload?.data?.customer_code || null;
  if (!customerCode) {
    return null;
  }

  const member = await prisma.member.findFirst({
    where: { paystackCustomerCode: customerCode },
    select: { uid: true },
  });

  if (member?.uid) {
    return member.uid;
  }

  const admin = await prisma.admin.findFirst({
    where: { paystackCustomerCode: customerCode },
    select: { uid: true },
  });

  if (admin?.uid) {
    return admin.uid;
  }

  const agent = await prisma.agent.findFirst({
    where: { paystackCustomerCode: customerCode },
    select: { uid: true },
  });

  return agent?.uid || null;
};

const recordWebhookTransaction = async (payload) => {
  const eventName = String(payload?.event || "").trim();
  const reference = resolveWebhookReference(payload);

  if (!eventName || !reference) {
    return {
      ok: false,
      message: "Webhook payload is missing event or reference",
    };
  }

  const payment = await prisma.payment.findUnique({
    where: { reference },
  });

  const userId = await resolveWebhookUserId(payload, payment);
  const status = resolveWebhookStatus(eventName);
  const amount = resolveWebhookAmount(payload);

  const transaction = await prisma.transaction.upsert({
    where: {
      reference_event: {
        reference,
        event: eventName,
      },
    },
    create: {
      reference,
      event: eventName,
      status,
      amount,
      currency: payload?.data?.currency || "NGN",
      channel: payload?.data?.channel || null,
      gatewayResponse: payload?.data?.gateway_response || payload?.data?.message || null,
      customerEmail: payload?.data?.customer?.email || payload?.data?.customer_email || null,
      paymentReference: payment?.reference || null,
      userId,
      metadata: payload?.data?.metadata || null,
      rawPayload: payload,
    },
    update: {
      status,
      amount,
      currency: payload?.data?.currency || "NGN",
      channel: payload?.data?.channel || null,
      gatewayResponse: payload?.data?.gateway_response || payload?.data?.message || null,
      customerEmail: payload?.data?.customer?.email || payload?.data?.customer_email || null,
      paymentReference: payment?.reference || null,
      userId,
      metadata: payload?.data?.metadata || null,
      rawPayload: payload,
    },
  });

  if (payment && payment.status !== status) {
    await prisma.payment.update({
      where: { reference },
      data: {
        status,
        isVerify: status === "SUCCESS" ? true : payment.isVerify,
      },
    });
  }

  if (userId) {
    const title = status === "FAILED" ? "Payment Failed" : status === "REFUNDED" ? "Payment Refunded" : "Payment Updated";
    const description =
      status === "FAILED"
        ? `Your payment with reference ${reference} failed.`
        : status === "REFUNDED"
          ? `Your payment with reference ${reference} was refunded.`
          : `A webhook update was received for payment reference ${reference}.`;

    await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        type: status === "FAILED" ? "FAILED" : "SUCCESS",
        date: new Date(),
      },
    }).catch(() => null);
  }

  return {
    ok: true,
    transaction,
  };
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

    const payment = value.paymentReference
      ? await prisma.payment.findUnique({ where: { reference: value.paymentReference } })
      : null;

    if (value.paymentReference && !payment) {
      return res.status(404).json({
        ok: false,
        message: "Payment reference not found",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        reference: value.reference,
        event: value.event,
        status: value.status,
        amount: value.amount,
        currency: value.currency || "NGN",
        channel: value.channel || null,
        gatewayResponse: value.gatewayResponse || null,
        customerEmail: value.customerEmail || null,
        paymentReference: payment?.reference || null,
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
        include: {
          member: {
            select: { uid: true, fullname: true, email: true },
          },
          payment: {
            select: { reference: true, amount: true, status: true, userId: true },
          },
        },
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

    const transactions = await prisma.transaction.findMany({
      where: { customerEmail: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ ok: true, transactions });
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
        member: {
          select: { uid: true, fullname: true, email: true },
        },
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
      where: { id },
      include: {
        member: {
          select: { uid: true, fullname: true, email: true },
        },
        payment: {
          select: { reference: true, amount: true, status: true, userId: true },
        },
      },
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
  recordWebhookTransaction,
};1