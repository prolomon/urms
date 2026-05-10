import { prisma } from "../config/db.js";
import {
  createWalletSchema,
  initiateTransferSchema,
  resolveBankAccountSchema,
  getTransactionSchema,
  verifyTransferSchema,
} from "../validator/walletValidator.js";
import {
  createAccount,
  initiateTransfer,
  resolveBankAccount,
  getBanks,
  getTransactions
} from "../service/wallet.js";

const validationErrorResponse = (res, error) => {
  const errors = error.details.map((detail) => detail.message);
  return res.status(400).json({
    ok: false,
    message: errors[0],
    errors,
  });
};

const createWallet = async (req, res) => {
  try {
    const { error, value } = createWalletSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return validationErrorResponse(res, error);
    }

    const { name, bvn, role, id } = value;

    if (!name || !bvn || !role || !id) {
      return res.status(400).json({ ok: false, message: "All fields are required" });
    }

    const existingWallet = await prisma.wallet.findFirst({
      where: { userId: id }
    });

    if (existingWallet) {
      return res.status(409).json({
        ok: false,
        message: "Wallet already exists for this owner",
      });
    }

    const acc = await createAccount(name, bvn, id);

    if (!acc?.status) {
      return res.status(502).json({
        ok: false,
        message: acc?.message || "Failed to create Wallet",
      });
    }

    let wallet;
    try {
      wallet = await prisma.wallet.create({
        data: {
          userId: id,
          accountNo: acc?.data?.bankAccountNumber,
          role: role,
          bank: {
            name: acc?.data?.bankName,
            id: acc?.data?.accountRef || id,
            code: 110028,
          },
          balance: 0.0,
          status: acc?.data?.expired,
          accountName: acc?.data?.bankAccountName,
          currency: acc?.data?.currency,
          accountHolderId: acc?.data?.accountHolderId,
        },
      });

    } catch (createErr) {
      if (createErr?.code === "P2002") {
        return res.status(409).json({
          ok: false,
          message:
            "Wallet account number already exists. Please retry wallet creation.",
        });
      }
      throw createErr;
    }

    return res
      .status(201)
      .json({ ok: true, message: "Wallet created successfully", wallet });

  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getWalletById = async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (!userId || !role) {
      return res
        .status(400)
        .json({ ok: false, message: "userId, role is required", isExist: false });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId, role },
    });

    if (!wallet) {
      return res
        .status(404)
        .json({ ok: false, message: "Wallet not found", isExist: false });
    }

    return res.status(200).json({ ok: true, wallet, isExist: true });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllWallets = async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ ok: true, wallets });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getBanksList = async (req, res) => {
  try {
    const result = await getBanks();

    return res.status(200).json({ ok: true, banks: result });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const initiateTransferController = async (req, res) => {
  try {
    const { error, value } = initiateTransferSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { amount, accountNumber, accountName, bankCode, senderName, narration } = value;

    // Use authenticated user's UID as merchant transaction reference
    const merchantTxRef = req.userId;

    const result = await initiateTransfer(amount, accountNumber, accountName, bankCode, merchantTxRef, senderName, narration);

    if (!result?.status) {
      return res.status(502).json({
        ok: false,
        message: result?.message || "Failed to initiate transfer",
        data: result?.data || null,
      });
    }

    try {
      const txnRef = (result?.data && (result.data.reference || result.data.transferCode || result.data.id)) || `${merchantTxRef}-${Date.now()}`;
      const txnStatus = (result?.data && (String(result.data.status || '').toUpperCase() === 'SUCCESS' || result?.status)) ? 'SUCCESS' : 'PENDING';
      const senderBank = req.user?.wallet?.bank || req.user?.bank || null;

      await prisma.transaction.create({
        data: {
          reference: String(txnRef),
          merchantTxRef,
          event: 'transfer.initiated',
          status: txnStatus,
          amount: Number(amount),
          currency: result?.data?.currency || 'NGN',
          channel: 'bank',
          gatewayResponse: result?.message || null,
          customerEmail: req.user?.email || null,
          paymentId: null,
          userId: merchantTxRef,
          metadata: {
            accountNumber,
            accountName,
            bankCode,
            senderAccountNumber: senderBank?.accountNo || null,
            senderBankName: senderBank?.name || null,
            senderBankCode: senderBank?.code || null,
            senderName: req.user?.fullname || req.user?.name || senderName || null,
            bankName: result?.data?.bankName || null,
            merchantTxRef,
            raw: result?.data || null,
          },
        },
      });
    } catch (txErr) {
      console.error('Failed to record transfer transaction:', txErr?.message || txErr);
    }

    return res.status(200).json({
      ok: true,
      message: "Transfer initiated successfully",
      data: result?.data || null,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const resolveBankAccountController = async (req, res) => {
  try {
    const { error, value } = resolveBankAccountSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { accountNumber, bankCode } = value;
    const result = await resolveBankAccount(accountNumber, bankCode);

    if (!result?.status) {
      return res.status(502).json({
        ok: false,
        message: result?.message || "Failed to resolve bank account",
        data: result?.data || null,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Bank account resolved successfully",
      data: result?.data || null,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransaction = async (req, res) => {
  try {
    const { error, value } = getTransactionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { accountNumber, fromDate, toDate } = value;

    const transactions = await getTransactions(accountNumber, fromDate, toDate);

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Transaction retrieved successfully",
      transactions,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const verifyTransfer = async (req, res) => {
  try {
    const { error, value } = verifyTransferSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { transactionId, reference } = value;

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          ...(transactionId ? [{ id: transactionId }] : []),
          ...(reference ? [{ reference }] : []),
        ],
      },
      include: {
        payment: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        ok: false,
        message: "Transfer not found",
      });
    }

    const isVerified = transaction.status === "SUCCESS";

    return res.status(200).json({
      ok: true,
      message: isVerified ? "Transfer verified successfully" : "Transfer verification pending",
      isVerified,
      transaction,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

export {
  createWallet,
  getWalletById,
  getAllWallets,
  getBanksList,
  initiateTransferController,
  resolveBankAccountController,
  getTransaction,
  verifyTransfer,
};
