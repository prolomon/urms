import { prisma } from "../config/db.js";
import {
  createWalletSchema,
  updateWalletBalanceSchema,
  validateWalletOwnershipSchema,
  createTransferRecipientSchema,
  initiateTransferSchema,
  resolveBankAccountSchema,
} from "../validator/walletValidator.js";
import {
  createAccount,
  validateCustomerOwnership,
  createRecipient,
  initiateTransfer,
  resolveBankAccount,
} from "../service/paystack.js";

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

    const { customerCode, id, accountType } = value;

    if (!id) {
      return res.status(400).json({ ok: false, message: "id is required" });
    }

    let ownerCustomerCode = null;

    if (accountType === "member") {
      const member = await prisma.member.findUnique({
        where: { uid: id },
        select: { uid: true, paystackCustomerCode: true },
      });
      if (!member) {
        return res.status(404).json({ ok: false, message: "Member not found" });
      }
      ownerCustomerCode = member.paystackCustomerCode || null;
    }

    if (accountType === "admin") {
      const admin = await prisma.admin.findUnique({
        where: { uid: id },
        select: { uid: true, paystackCustomerCode: true },
      });
      if (!admin) {
        return res.status(404).json({ ok: false, message: "Admin not found" });
      }
      ownerCustomerCode = admin.paystackCustomerCode || null;
    }

    if (accountType === "agent") {
      const agent = await prisma.agent.findUnique({
        where: { uid: id },
        select: { uid: true, paystackCustomerCode: true },
      });
      if (!agent) {
        return res.status(404).json({ ok: false, message: "Agent not found" });
      }
      ownerCustomerCode = agent.paystackCustomerCode || null;
    }

    const resolvedCustomerCode = ownerCustomerCode || customerCode;
    if (!resolvedCustomerCode) {
      return res.status(400).json({
        ok: false,
        message: "Paystack customer code is required for wallet creation",
      });
    }

    const existingWallet = await prisma.wallet.findFirst({
      where:
        accountType === "member"
          ? { memberId: id }
          : accountType === "admin"
            ? { adminId: id }
            : { agentId: id },
    });

    if (existingWallet) {
      return res.status(409).json({
        ok: false,
        message: "Wallet already exists for this owner",
      });
    }

    const acc = await createAccount(resolvedCustomerCode);

    if (!acc?.status) {
      return res.status(502).json({
        ok: false,
        message: acc?.message || "Failed to create Wallet",
      });
    }

    const accountNo = acc?.data?.account_number;
    if (!accountNo) {
      return res.status(502).json({
        ok: false,
        message: "Paystack did not return an account number",
      });
    }

    const existingByAccountNo = await prisma.wallet.findUnique({
      where: { accountNo },
    });

    if (existingByAccountNo) {
      const belongsToCurrentOwner =
        (accountType === "member" && existingByAccountNo.memberId === id) ||
        (accountType === "admin" && existingByAccountNo.adminId === id) ||
        (accountType === "agent" && existingByAccountNo.agentId === id);

      if (belongsToCurrentOwner) {
        return res.status(200).json({
          ok: true,
          message: "Wallet already exists for this owner",
          wallet: existingByAccountNo,
        });
      }

      return res.status(409).json({
        ok: false,
        message:
          "Generated account number already exists. Please retry wallet creation.",
      });
    }

    let wallet;
    try {
      wallet = await prisma.wallet.create({
        data: {
          memberId: accountType === "member" ? id : null,
          adminId: accountType === "admin" ? id : null,
          agentId: accountType === "agent" ? id : null,
          accountNo,
          bank: {
            name: acc?.data?.bank.name,
            id: acc?.data?.bank.id,
            code: acc?.data?.bank.code,
          },
          balance: 0.0,
          status: acc?.data?.active ? true : false,
          accountName: acc?.data?.account_name,
          currency: acc?.data?.currency,
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

const getWalletByMemberId = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res
        .status(400)
        .json({ ok: false, message: "memberId is required", isExist: false });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { memberId },
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

const getWalletByAgentId = async (req, res) => {
  try {
    const agentId = req.params?.agentId?.trim();

    if (!agentId) {
      return res
        .status(400)
        .json({ ok: false, message: "agentId is required", isExist: false });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { agentId },
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

const getWalletByAdminId = async (req, res) => {
  try {
    const adminId = req.params?.adminId?.trim();

    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "adminId is required", isExist: false });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { adminId },
    });

    if (!wallet) {
      return res
        .status(404)
        .json({ ok: false, message: "Wallet not found", isExist: false });
    }

    return res.status(200).json({ ok: true, wallet, isExist: true });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllWallets = async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: { uid: true, fullname: true, email: true },
        },
        admin: {
          select: { uid: true, adminName: true, email: true },
        },
      },
    });

    return res.status(200).json({ ok: true, wallets });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const updateWalletBalanceByAdminId = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { error, value } = updateWalletBalanceSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!adminId) {
      return res
        .status(400)
        .json({ ok: false, message: "adminId is required" });
    }

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { amount, operation } = value;

    const wallet = await prisma.wallet.findFirst({ where: { adminId } });
    if (!wallet) {
      return res.status(404).json({ ok: false, message: "Wallet not found" });
    }

    const nextBalance =
      operation === "credit"
        ? wallet.balance + amount
        : wallet.balance - amount;
    if (nextBalance < 0) {
      return res
        .status(400)
        .json({ ok: false, message: "Insufficient wallet balance" });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: nextBalance },
    });

    return res.status(200).json({
      ok: true,
      message: `Wallet ${operation} operation successful`,
      wallet: updatedWallet,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const validateWalletOwnership = async (req, res) => {
  try {
    const { error, value } = validateWalletOwnershipSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const {id} = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Wallet id is required" });
    }

    const { bvn, customerCode, type } = value;

    const result = await validateCustomerOwnership(
      customerCode,
      bvn,
      type
    );

    if (!result?.status) {
      return res.status(502).json({
        ok: false,
        message: result?.message || "Failed to validate wallet ownership",
        data: result?.data || null,
      });
    }

    const wallet = await prisma.wallet.findUnique({ where: { id } });

    if (!wallet) {
      return res.status(404).json({ ok: false, message: "Wallet not found" });
    }

   const res = await prisma.wallet.update({
      where: { id },
      data: {
        verify: true,
        identification: type,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Customer identification attached successfully",
      data: result?.data || null,
      wallet: res,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const createTransferRecipientController = async (req, res) => {
  try {
    const { error, value } = createTransferRecipientSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { name, accountNumber, bankCode, currency } = value;

    const result = await createRecipient(
      name,
      accountNumber,
      bankCode,
      currency,
    );

    if (!result?.status) {
      return res.status(502).json({
        ok: false,
        message: result?.message || "Failed to create transfer recipient",
        data: result?.data || null,
      });
    }

    return res.status(201).json({
      ok: true,
      message: "Transfer recipient created successfully",
      data: result?.data || null,
    });
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

    const { amount, recipientCode, reason } = value;

    const result = await initiateTransfer(amount, recipientCode, reason);

    if (!result?.status) {
      return res.status(502).json({
        ok: false,
        message: result?.message || "Failed to initiate transfer",
        data: result?.data || null,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Transfer initiated successfully",
      data: result?.data || null,
    });
  } catch (err) {
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

export {
  createWallet,
  getWalletByMemberId,
  getWalletByAdminId,
  getWalletByAgentId,
  getAllWallets,
  updateWalletBalanceByAdminId,
  validateWalletOwnership,
  createTransferRecipientController,
  initiateTransferController,
  resolveBankAccountController,
};
