import { prisma } from "../config/db.js";
import {
  createPaymentSchema,
  updatePaymentScheduleSchema,
  verifyPaymentSchema,
  makePaymentSchema,
} from '../validator/paymentValidator.js';
import { customAlphabet } from 'nanoid';
import { initiateTransfer, createRecipient } from '../service/paystack.js';

const paymentReferenceSuffix = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

const generatePaymentReference = () => {
  return `PAY-REF|${new Date().toISOString()}-${paymentReferenceSuffix()}`;
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

    const pricing = await prisma.pricing.findFirst({
      where: { id: paymentId },
      select: {
        status: true,
        id: true,
        title: true,
        price: true,
        category: true,
        type: true,
        benefit: true,
        center: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const main = await prisma.admin.findFirst({
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
    });

    const mainWallet = await prisma.wallet.findFirst({
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
        status: true,
        identification: true,
        verify: true,
      },
    });

    const agentWallet = await prisma.wallet.findFirst({
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
        status: true,
        identification: true,
        verify: true,
      },
    });

    const senderWallet = await prisma.wallet.findFirst({
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
        status: true,
        identification: true,
        verify: true,
      },
    });

    if (!main) {
      return res.status(500).json({ ok: false, message: 'Main admin not found' });
    }

    if (!main.paymentConfig) {
      return res.status(500).json({ ok: false, message: 'Payment configuration is incomplete' });
    }

    // Parse payment config for split percentages
    const paymentConfig = main.paymentConfig || { main: 40, agent: 20, operation: 25, technology: 15 };
    const totalAmount = Number(amount);

    // Calculate split amounts
    const mainAmount = (totalAmount * paymentConfig.main) / 100; // 40% → mainWallet
    const agentAmount = (totalAmount * paymentConfig.agent) / 100; // 20% → agentWallet
    const technologyAmount = (totalAmount * paymentConfig.technology) / 100; // 15% → agentWallet
    const operationAmount = (totalAmount * paymentConfig.operation) / 100; // 25% → mainWallet

    const paymentReference = generatePaymentReference();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        reference: paymentReference,
        userId,
        amount: totalAmount,
        status: 'PENDING',
        payment: 'direct',
      },
    });

    // Update mainWallet (receives main + operation percentages)
    if (mainWallet) {
      await prisma.wallet.update({
        where: { id: mainWallet.id },
        data: {
          balance: {
            increment: mainAmount + operationAmount,
          },
        },
      });
    }

    // Update agentWallet (receives agent + technology percentages)
    if (agentWallet) {
      await prisma.wallet.update({
        where: { id: agentWallet.id },
        data: {
          balance: {
            increment: agentAmount + technologyAmount,
          },
        },
      });
    }

    // Deduct from senderWallet
    if (senderWallet) {
      await prisma.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: {
            decrement: totalAmount,
          },
        },
      });
    }

    // Create transaction records for audit trail
    await prisma.transaction.create({
      data: {
        reference: paymentReference,
        event: 'payment.split.main',
        status: 'SUCCESS',
        amount: mainAmount + operationAmount,
        currency: 'NGN',
        channel: 'wallet',
        paymentReference,
        userId: mainWallet?.userId,
        metadata: { main: mainAmount, operation: operationAmount },
      },
    }).catch(() => null);

    await prisma.transaction.create({
      data: {
        reference: paymentReference,
        event: 'payment.split.agent',
        status: 'SUCCESS',
        amount: agentAmount + technologyAmount,
        currency: 'NGN',
        channel: 'wallet',
        paymentReference,
        userId: agentWallet?.userId,
        metadata: { agent: agentAmount, technology: technologyAmount },
      },
    }).catch(() => null);

    // Resolve bank details and initialize transfers
    const transfers = [];

    // Transfer to mainWallet
    if (mainWallet && mainWallet.accountNo && mainWallet.bank) {
      try {
        const bankData = typeof mainWallet.bank === 'string' ? JSON.parse(mainWallet.bank) : mainWallet.bank;
        const bankCode = bankData?.code || '';
        const mainTransferAmount = mainAmount + operationAmount;

        if (bankCode && mainWallet.accountNo && mainWallet.accountName) {
          // Create recipient for main wallet
          const recipientResponse = await createRecipient(
            mainWallet.accountName,
            mainWallet.accountNo,
            bankCode,
            'NGN'
          );

          if (recipientResponse?.status && recipientResponse?.data?.recipient_code) {
            // Initiate transfer to main wallet
            const transferResponse = await initiateTransfer(
              mainTransferAmount,
              recipientResponse.data.recipient_code,
              `Payment split to main wallet - ${paymentReference}`
            );

            transfers.push({
              recipient: 'mainWallet',
              amount: mainTransferAmount,
              status: transferResponse?.status ? 'INITIATED' : 'FAILED',
              reference: transferResponse?.data?.reference || null,
              message: transferResponse?.message || 'Transfer initiated',
            });

            // Record transfer transaction
            if (transferResponse?.status) {
              await prisma.transaction.create({
                data: {
                  reference: transferResponse?.data?.reference || paymentReference,
                  event: 'payment.transfer.main',
                  status: 'SUCCESS',
                  amount: mainTransferAmount,
                  currency: 'NGN',
                  channel: 'paystack',
                  paymentReference,
                  userId: mainWallet?.userId,
                  metadata: { 
                    recipient: mainWallet.accountNo,
                    bank: bankData?.name || 'Unknown',
                    transferRef: transferResponse?.data?.reference,
                  },
                },
              }).catch(() => null);
            }
          }
        }
      } catch (err) {
        console.error('Error processing main wallet transfer:', err?.message || err);
        transfers.push({
          recipient: 'mainWallet',
          amount: mainAmount + operationAmount,
          status: 'FAILED',
          message: err?.message || 'Failed to process transfer',
        });
      }
    }

    // Transfer to agentWallet
    if (agentWallet && agentWallet.accountNo && agentWallet.bank) {
      try {
        const bankData = typeof agentWallet.bank === 'string' ? JSON.parse(agentWallet.bank) : agentWallet.bank;
        const bankCode = bankData?.code || '';
        const agentTransferAmount = agentAmount + technologyAmount;

        if (bankCode && agentWallet.accountNo && agentWallet.accountName) {
          // Create recipient for agent wallet
          const recipientResponse = await createRecipient(
            agentWallet.accountName,
            agentWallet.accountNo,
            bankCode,
            'NGN'
          );

          if (recipientResponse?.status && recipientResponse?.data?.recipient_code) {
            // Initiate transfer to agent wallet
            const transferResponse = await initiateTransfer(
              agentTransferAmount,
              recipientResponse.data.recipient_code,
              `Payment split to agent wallet - ${paymentReference}`
            );

            transfers.push({
              recipient: 'agentWallet',
              amount: agentTransferAmount,
              status: transferResponse?.status ? 'INITIATED' : 'FAILED',
              reference: transferResponse?.data?.reference || null,
              message: transferResponse?.message || 'Transfer initiated',
            });

            // Record transfer transaction
            if (transferResponse?.status) {
              await prisma.transaction.create({
                data: {
                  reference: transferResponse?.data?.reference || paymentReference,
                  event: 'payment.transfer.agent',
                  status: 'SUCCESS',
                  amount: agentTransferAmount,
                  currency: 'NGN',
                  channel: 'paystack',
                  paymentReference,
                  userId: agentWallet?.userId,
                  metadata: { 
                    recipient: agentWallet.accountNo,
                    bank: bankData?.name || 'Unknown',
                    transferRef: transferResponse?.data?.reference,
                  },
                },
              }).catch(() => null);
            }
          }
        }
      } catch (err) {
        console.error('Error processing agent wallet transfer:', err?.message || err);
        transfers.push({
          recipient: 'agentWallet',
          amount: agentAmount + technologyAmount,
          status: 'FAILED',
          message: err?.message || 'Failed to process transfer',
        });
      }
    }

    return res.status(201).json({
      ok: true,
      message: 'Payment initiated, split and transfers initialized successfully',
      data: {
        payment,
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
        transfers,
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
  getAllPayments,
  verifyPayment,
  updatePaymentSchedule,
  makePayment,
  createPaymentRecord,
  createRecurringPaymentForPayment,
  generatePaymentReference,
  getNextDueDate,
};