import { prisma } from "../config/db.js";
import {
  createPaymentSchema,
  updatePaymentScheduleSchema,
  verifyPaymentSchema,
  makePaymentSchema,
} from '../validator/paymentValidator.js';
import { customAlphabet } from 'nanoid';
import { initiateTransfer, createRecipient } from '../service/paystack.js';
import { generateTransactionReference } from './paymentTransactionController.js';

const paymentReferenceSuffix = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

const generatePaymentReference = () => {
  return `PAY-REF|${new Date().toISOString()}-${paymentReferenceSuffix()}`;
};

const getWalletBankDetails = (wallet) => {
  const bank = wallet?.bank || {};

  return {
    accountNumber: wallet?.accountNo || null,
    accountName: wallet?.accountName || null,
    bankName: bank?.name || null,
    bankCode: bank?.code || null,
  };
};

const generateReceipt = ({
  reference,
  paymentRecord,
  grossAmount,
  fee,
  netAmount,
  mainAmount,
  agentAmount,
  technologyAmount,
  operationAmount,
  senderWallet,
  mainWallet,
  agentWallet,
}) => {
  const sender = getWalletBankDetails(senderWallet);

  return {
    reference,
    paymentReference: paymentRecord.reference,
    paymentId: paymentRecord.id,
    date: new Date().toISOString(),
    grossAmount,
    fee,
    netAmount,
    sender,
    recipients: {
      admin: getWalletBankDetails(mainWallet),
      agent: getWalletBankDetails(agentWallet),
    },
    breakdown: {
      main: mainAmount,
      agent: agentAmount,
      technology: technologyAmount,
      operation: operationAmount,
    },
  };
};

const normalizeSessions = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  return [String(value)].filter(Boolean);
};

const getNextDueDate = (dueDate, frequency) => {
  const nextDueDate = new Date(dueDate || new Date());
  const normalizedFrequency = String(frequency || 'MONTHLY').toUpperCase();

  if (normalizedFrequency === 'YEARLY') {
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
  } else if (normalizedFrequency === 'QUARTERLY') {
    nextDueDate.setMonth(nextDueDate.getMonth() + 3);
  } else {
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  }

  return nextDueDate;
};

const createPaymentRecord = async (data, client = prisma) => {
  return client.payment.create({
    data: {
      reference: data.reference || generatePaymentReference(),
      userId: data.userId,
      frequency: data.frequency || 'MONTHLY',
      sessions: normalizeSessions(data.sessions),
      debt: Number(data.debt ?? 0),
      due: data.due ? new Date(data.due) : new Date(),
      amount: Number(data.amount),
      payment: String(data.payment),
      status: data.status || 'PENDING',
      isVerify: Boolean(data.isVerify),
    },
  });
};

const createRecurringPaymentForPayment = async (payment, client = prisma) => {
  const nextDueDate = getNextDueDate(payment.due, payment.frequency);
  const existingNextPayment = await client.payment.findFirst({
    where: {
      userId: payment.userId,
      payment: payment.payment,
      due: nextDueDate,
    },
    select: { id: true },
  });

  if (existingNextPayment) {
    return { created: false, payment: null };
  }

  const nextPayment = await client.payment.create({
    data: {
      reference: generatePaymentReference(),
      userId: payment.userId,
      frequency: payment.frequency,
      sessions: [],
      debt: Number(payment.debt ?? 0),
      due: nextDueDate,
      amount: Number(payment.amount),
      payment: payment.payment,
      status: 'PENDING',
      isVerify: false,
    },
  });

  return { created: true, payment: nextPayment };
};

const createPayment = async (req, res) => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const payment = await createPaymentRecord(value);

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

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ ok: false, message: 'Payment id is required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
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
    const { error, value } = verifyPaymentSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    if (!id) {
      return res.status(400).json({ ok: false, message: 'Payment reference is required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { reference: id },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: 'Payment not found' });
    }

    const incomingSessions = normalizeSessions(value.session ?? value.sessions);
    const updatedSessions = Array.from(new Set([...(payment.sessions || []), ...incomingSessions]));
    const amountPaid = Number(value.amountPaid ?? payment.amount);
    const currentDebt = Number(payment.debt ?? 0);

    let remainingPayment = Math.max(amountPaid, 0);
    let updatedDebt = currentDebt;

    if (updatedDebt > 0) {
      if (remainingPayment >= updatedDebt) {
        remainingPayment -= updatedDebt;
        updatedDebt = 0;
      } else {
        updatedDebt -= remainingPayment;
        remainingPayment = 0;
      }
    }

    const outstandingForCurrentCycle = Math.max(Number(payment.amount) - remainingPayment, 0);
    updatedDebt += outstandingForCurrentCycle;
    const fullyPaid = updatedDebt <= 0;

    const updatedPayment = await prisma.payment.update({
      where: { reference: id },
      data: {
        isVerify: true,
        debt: updatedDebt,
        status: fullyPaid ? 'SUCCESS' : 'PENDING',
        sessions: updatedSessions,
      },
      include: { member: true },
    });

    if (updatedPayment.userId) {
      await prisma.notification.create({
        data: {
          userId: updatedPayment.userId,
          title: fullyPaid ? 'Payment Verified' : 'Payment Partially Verified',
          description: fullyPaid
            ? `Your payment of ${amountPaid} has been verified successfully.`
            : `Your payment of ${amountPaid} has been verified. Remaining debt: ${updatedDebt}.`,
          type: fullyPaid ? 'SUCCESS' : 'PENDING',
          date: new Date(),
        },
      });
    }

    return res.status(200).json({
      ok: true,
      message: fullyPaid ? 'Payment verified successfully' : 'Payment verified with remaining debt',
      payment: updatedPayment,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const updatePaymentSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePaymentScheduleSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    if (!id) {
      return res.status(400).json({ ok: false, message: 'Payment id is required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: 'Payment not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        frequency: value.frequency,
        amount: value.amount,
        due: value.due,
      },
    });

    return res.status(200).json({
      ok: true,
      message: 'Payment schedule updated successfully',
      payment: updatedPayment,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const makePayment = async (req, res) => {
  try {
    const { error, value } = makePaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const { amount, center, company } = value;
    const { userId, paymentId } = req.params;

    const [paymentRecord, main, mainWallet, agentWallet, senderWallet] = await Promise.all([
      prisma.payment.findFirst({
        where: { payment: paymentId },
        select: {
          id: true,
          reference: true,
          userId: true,
          frequency: true,
          sessions: true,
          debt: true,
          due: true,
          amount: true,
          payment: true,
          status: true,
          isVerify: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.admin.findFirst({
        where: { uid: center },
        select: {
          id: true,
          uid: true,
          center: true,
          email: true,
          password: true,
          avatar: true,
          role: true,
          paymentConfig: true,
          createdAt: true,
          updatedAt: true,
          location: true,
          state: true,
          address: true,
          lga: true,
          country: true,
          status: true,
          phone: true,
          adminName: true,
          adminEmail: true,
          adminLocation: true,
          adminPhone: true,
        },
      }),
      prisma.wallet.findFirst({
        where: { userId: company, role: 'ADMIN' },
        select: {
          id: true,
          userId: true,
          status: true,
          role: true,
          accountHolderId: true,
          createdAt: true,
          updatedAt: true,
          balance: true,
          accountNo: true,
          accountName: true,
          currency: true,
          bank: true,
          identification: true,
          verify: true,
        },
      }),
      prisma.wallet.findFirst({
        where: { userId: company, role: 'AGENT' },
        select: {
          id: true,
          userId: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          balance: true,
          accountNo: true,
          accountHolderId: true,
          accountName: true,
          currency: true,
          bank: true,
          identification: true,
          verify: true,
        },
      }),
      prisma.wallet.findFirst({
        where: {
          userId,
          role: 'USER',
        },
        select: {
          id: true,
          userId: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          balance: true,
          accountNo: true,
          accountName: true,
          currency: true,
          accountHolderId: true,
          bank: true,
          identification: true,
          verify: true,
        },
      }),
    ]);

    if (!paymentRecord) {
      return res.status(404).json({ ok: false, message: 'Payment record not found' });
    }

    if (!main) {
      return res.status(500).json({ ok: false, message: 'Main admin not found' });
    }

    if (!main.paymentConfig) {
      return res.status(500).json({ ok: false, message: 'Payment configuration is incomplete' });
    }

    // Parse payment config for split percentages
    const paymentConfig = main.paymentConfig || { main: 40, agent: 20, operation: 25, technology: 15 };
    const grossAmount = Number(amount);
    const feePercentage = 0.05; // 5% fee
    const fee = grossAmount * feePercentage;
    const totalAmount = grossAmount - fee;
    const receiptReference = generateTransactionReference();

    if (senderWallet && Number(senderWallet.balance) < grossAmount) {
      return res.status(400).json({ ok: false, message: 'Insufficient balance in sender wallet' });
    }

    // Calculate split amounts
    const mainShare = Number(paymentConfig.main ?? 0);
    const agentShare = Number(paymentConfig.agent ?? 0);
    const technologyShare = Number(paymentConfig.technology ?? 0);
    const operationShare = Number(paymentConfig.operation ?? 0);

    const mainAmount = (totalAmount * mainShare) / 100;
    const agentAmount = (totalAmount * agentShare) / 100;
    const technologyAmount = (totalAmount * technologyShare) / 100;
    const operationAmount = (totalAmount * operationShare) / 100;
    const senderDetails = getWalletBankDetails(senderWallet);
    const receipt = generateReceipt({
      reference: receiptReference,
      paymentRecord,
      grossAmount,
      fee,
      netAmount: totalAmount,
      mainAmount,
      agentAmount,
      technologyAmount,
      operationAmount,
      senderWallet,
      mainWallet,
      agentWallet,
    });

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          debt: paymentRecord.amount - totalAmount,
          status: 'SUCCESS',
        },
      });

      if (mainWallet) {
        await tx.wallet.update({
          where: { id: mainWallet.id },
          data: {
            balance: {
              increment: mainAmount + operationAmount,
            },
          },
        });
      }

      if (agentWallet) {
        await tx.wallet.update({
          where: { id: agentWallet.id },
          data: {
            balance: {
              increment: agentAmount + technologyAmount,
            },
          },
        });
      }

      if (senderWallet) {
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: {
            balance: {
              decrement: grossAmount,
            },
          },
        });
      }

      if (main) {
        await tx.admin.update({
          where: { id: main.id },
          data: {
            ledger: {
              increment: mainAmount,
            },
          },
        });
      }

      await Promise.all([
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-ADMIN`,
            merchantTxRef: main.uid,
            event: 'payment.admin.credit',
            status: 'SUCCESS',
            amount: mainAmount + operationAmount,
            currency: 'NGN',
            channel: 'wallet',
            gatewayResponse: 'Admin wallet credited',
            customerEmail: main.adminEmail || main.email || null,
            paymentId: paymentRecord.id,
            userId: main.uid,
            metadata: {
              receipt,
              role: 'ADMIN',
              transactionType: 'CREDIT',
              creditedAmount: mainAmount + operationAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-AGENT`,
            merchantTxRef: company,
            event: 'payment.agent.credit',
            status: 'SUCCESS',
            amount: agentAmount + technologyAmount,
            currency: 'NGN',
            channel: 'wallet',
            gatewayResponse: 'Agent wallet credited',
            customerEmail: agentWallet?.accountName || null,
            paymentId: paymentRecord.id,
            userId: company,
            metadata: {
              receipt,
              role: 'AGENT',
              transactionType: 'CREDIT',
              creditedAmount: agentAmount + technologyAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-SENDER`,
            merchantTxRef: userId,
            event: 'payment.sender.debit',
            status: 'SUCCESS',
            amount: grossAmount,
            currency: 'NGN',
            channel: 'wallet',
            gatewayResponse: 'Sender wallet debited',
            customerEmail: senderWallet?.accountName || null,
            paymentId: paymentRecord.id,
            userId: senderWallet?.userId || userId,
            metadata: {
              receipt,
              role: 'SENDER',
              transactionType: 'DEBIT',
              debitedAmount: grossAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
      ]);

      return updatedPayment;
    });

    return res.status(201).json({
      ok: true,
      message: 'Payment initiated, split and transfers initialized successfully',
      data: {
        payment,
        amountBreakdown: {
          grossAmount,
          fee,
          netAmount: totalAmount,
        },
        split: {
          mainWallet: mainAmount + operationAmount,
          agentWallet: agentAmount + technologyAmount,
          breakdown: {
            main: mainAmount,
            agent: agentAmount,
            technology: technologyAmount,
            operation: operationAmount,
          },
        },
        receipt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: err?.message || 'Server error',
    });
  }
};
export {
  createPayment,
  getPaymentsByUserId,
  getPaymentByReference,
  getPaymentById,
  getAllPayments,
  verifyPayment,
  updatePaymentSchedule,
  makePayment,
  createPaymentRecord,
  createRecurringPaymentForPayment,
  generatePaymentReference,
  getNextDueDate,
};