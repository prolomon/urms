import { prisma } from "../config/db.js";
import {
  createPayoutSchema,
  updatePayoutSchema,
  updatePayoutStatusSchema,
} from "../validator/payoutValidator.js";

const validationErrorResponse = (res, error) => {
  const errors = error.details.map((detail) => detail.message);
  return res.status(400).json({
    ok: false,
    message: errors[0],
    errors,
  });
};

const createPayout = async (req, res) => {
  try {
    const { error, value } = createPayoutSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { userId, bankName, accountNumber, bankCode, accountName } = value;

    const payout = await prisma.payout.create({
      data: {
        userId,
        bankName,
        accountNumber,
        bankCode,
        accountName,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Payout created successfully",
      payout,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllPayouts = async (req, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ ok: true, payouts });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPayoutById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Payout ID is required" });
    }

    const payout = await prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      return res
        .status(404)
        .json({ ok: false, message: "Payout not found" });
    }

    return res.status(200).json({ ok: true, payout });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPayoutByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, message: "User ID is required" });
    }

    const payout = await prisma.payout.findFirst({
      where: { userId },
    });

    if (!payout) {
      return res
        .status(404)
        .json({ ok: false, message: "Payout not found" });
    }

    return res.status(200).json({ ok: true, payout, message: "Payout retrieved successfully" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const updatePayout = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Payout ID is required" });
    }

    const { error, value } = updatePayoutSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const existingPayout = await prisma.payout.findUnique({
      where: { id },
    });

    if (!existingPayout) {
      return res
        .status(404)
        .json({ ok: false, message: "Payout not found" });
    }

    const payout = await prisma.payout.update({
      where: { id },
      data: value,
    });

    return res.status(200).json({
      ok: true,
      message: "Payout updated successfully",
      payout,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Payout ID is required" });
    }

    const { error, value } = updatePayoutStatusSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const { status } = value;

    const existingPayout = await prisma.payout.findUnique({
      where: { id },
    });

    if (!existingPayout) {
      return res
        .status(404)
        .json({ ok: false, message: "Payout not found" });
    }

    const payout = await prisma.payout.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      ok: true,
      message: "Payout status updated successfully",
      payout,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

export {
  createPayout,
  getAllPayouts,
  getPayoutById,
  getPayoutByUser,
  updatePayout,
  updatePayoutStatus,
};