import { prisma } from "../config/db.js";
import argon2 from "argon2";

import {
  createMemberSchema,
  updateMemberSchema,
  loginSchema,
  createSecurityTokenSchema,
  changeSecurityTokenSchema,
  verifySecurityCodeSchema,
  billingFrequencySchema,
  pricingActionSchema,
  changeMemberAgentSchema,
  changeMemberCompanySchema,
} from "../validator/memberValidator.js";
import { createPaymentRecord, generatePaymentReference } from "./paymentController.js";
import { customAlphabet } from "nanoid";
import { sendEmail } from "../service/mail.js";
import { createCustomer, createAccount } from "../service/paystack.js";
import {
  loginAlert,
  accountCreation,
  walletCreation,
  resetCode,
  resetSuccessful,
} from "../service/templates.js";

const joseImport = () => import("jose");
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "3d";

const generateAuthToken = async (payload) => {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const { SignJWT } = await joseImport();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(jwtExpiresIn)
    .sign(new TextEncoder().encode(jwtSecret));
};

const memberSafeSelect = {
  id: true,
  uid: true,
  fullname: true,
  businessName: true,
  center: true,
  email: true,
  phone: true,
  type: true,
  billingFrequency: true,
  location: true,
  category: true,
  avatar: true,
  status: true,
  role: true,
  agent: true,
  createdAt: true,
  updatedAt: true,
  pricing: true,
  company: true,
  notifications: true,
  payments: true
};

const looksLikeJwt = (value) => typeof value === "string" && value.split(".").length === 3;

const resolveTargetMemberUid = (req) => {
  if (looksLikeJwt(req.params?.id)) {
    return req.userId || req.auth?.uid || null;
  }

  return req.params?.id || null;
};

const generateMemberUidSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10,
);

const random6Digit = () => {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
};

const findActivePricingForMember = async (pricingIds = []) => {
  for (const pricingId of pricingIds) {
    const pricing = await prisma.pricing.findUnique({
      where: { id: pricingId },
      select: { id: true, price: true, status: true },
    });

    if (pricing?.status) {
      return pricing;
    }
  }

  return null;
};

const createMember = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createMemberSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors: errors,
      });
    }

    const existing = await prisma.member.findUnique({
      where: { email: value.email },
      select: { id: true },
    });

    if (existing)
      return res
        .status(409)
        .json({ ok: false, message: "Email already exists" });

    const hashedPassword = await argon2.hash(value.phone);

    // Generate unique UID with collision detection
    let genUid;
    let attempts = 0;
    const maxAttempts = 5;

    while (!genUid && attempts < maxAttempts) {
      const candidateUid = `MEB-${generateMemberUidSuffix()}`;
      const existingMemberWithUid = await prisma.member.findUnique({
        where: { uid: candidateUid },
        select: { id: true },
      });

      if (!existingMemberWithUid) {
        genUid = candidateUid;
      }
      attempts++;
    }

    if (!genUid) {
      return res.status(500).json({
        ok: false,
        message: "Failed to generate unique ID, please try again",
      });
    }

    const { member, initialPayment } = await prisma.$transaction(async (tx) => {
      const createdMember = await tx.member.create({
        data: {
          fullname: value.fullname,
          businessName: value.businessName,
          center: value.center,
          email: value.email,
          phone: value.phone,
          type: value.type || "BUSINESS",
          password: hashedPassword,
          location: value.location,
          avatar: value.avatar,
          agent: value.agent || null,
          company: value.company || null,
          uid: genUid,
          pricing: value.pricing || [],
          category: value.category || null,
        },
      });

      const selectedPricingIds = Array.isArray(value.pricing) ? value.pricing : [];
      const availablePricing = selectedPricingIds.length
        ? await tx.pricing.findMany({
          where: {
            id: { in: selectedPricingIds },
            status: true,
          },
          select: {
            id: true,
            price: true,
          },
        })
        : [];

      const pricingById = new Map(
        availablePricing.map((pricing) => [pricing.id, pricing]),
      );

      const createdPayments = [];

      for (const pricingId of selectedPricingIds) {
        const matchedPricing = pricingById.get(pricingId);

        if (!matchedPricing) {
          console.warn("Skipping unavailable pricing for new member:", pricingId);
          continue;
        }

        const createdPayment = await createPaymentRecord(
          {
            userId: createdMember.uid,
            frequency: createdMember.billingFrequency,
            sessions: [],
            debt: 0,
            due: new Date(),
            amount: Number(matchedPricing.price),
            payment: pricingId,
            status: "PENDING",
            isVerify: false,
            reference: generatePaymentReference(),
          },
          tx,
        );

        createdPayments.push(createdPayment);
      }

      return { member: createdMember, initialPayment: createdPayments };
    });

    if (!member) {
      return res
        .status(500)
        .json({ ok: false, message: "Failed to create member" });
    }

    void sendEmail(
      member.email,
      "Welcome to URMS Member Panel",
      await accountCreation(member.fullname, member.email, member.phone),
    )
      .then((result) => {
        if (!result?.ok) {
          console.error(
            "Welcome email failed:",
            result?.error || "Unknown email error",
          );
        }
      })
      .catch((error) => {
        console.error(
          "Unexpected email send failure:",
          error?.message || error,
        );
      });

    let welcomeNotification = null;

    try {
      welcomeNotification = await prisma.notification.create({
        data: {
          userId: member.uid,
          title: "Welcome to Arums",
          description:
            "Thanks for joining Arums. You can manage your profile and uploads anytime.",
          type: "WELCOME",
          date: new Date(),
        },
      });

    } catch (notificationError) {
      console.error(
        "Failed to create welcome notification:",
        notificationError.message || notificationError,
      );
      // Continue without notification - member was created successfully
    }

    const { password, ...memberWithoutPassword } = member;
    return res.status(201).json({
      ok: true,
      message: "Member created successfully",
      member: memberWithoutPassword,
      welcomeNotification,
      initialPayment,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: {
          center: id,
        },
        skip,
        take: limit,
        select: memberSafeSelect,
      }),
      prisma.member.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getMember = async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { uid: req.params.id },
      select: memberSafeSelect,
    });
    if (!member) return res.status(404).json({ error: "Member not found" });
    res
      .status(200)
      .json({
        data: member,
        ok: true,
        message: "Member retrieved successfully",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateMember = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateMemberSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors: errors,
      });
    }

    // Exclude pricing from update data if not provided
    const updateData = { ...value };
    if (!value.pricing) {
      delete updateData.pricing;
    }

    const member = await prisma.member.update({
      where: { uid: req.params.id },
      data: updateData,
    });

    if (!member)
      return res.status(404).json({ ok: false, message: "Member not found" });

    try {
      await prisma.notification.create({
        data: {
          userId: member.uid,
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
          type: "UPDATE",
          date: new Date(),
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to create update notification:",
        notificationError.message || notificationError,
      );
    }

    const { password, ...memberWithoutPassword } = member;
    res.status(200).json({
      ok: true,
      message: "Member updated successfully",
      member: memberWithoutPassword,
    });
  } catch (err) {
    console.error("Update member error:", err);
    res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const deleteMember = async (req, res) => {
  try {
    // Get member before deletion
    const memberToDelete = await prisma.member.findUnique({
      where: { uid: req.params.id },
      select: {
        id: true,
        uid: true,
        fullname: true,
        email: true,
      },
    });
    if (!memberToDelete)
      return res.status(404).json({ error: "Member not found" });

    // Delete related notifications first
    await prisma.notification.deleteMany({
      where: { userId: memberToDelete.id },
    });

    // Then delete the member
    const member = await prisma.member.delete({
      where: { uid: req.params.id },
    });
    res.status(200).json({ ok: true, message: "Member deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }
    const { email, password } = value;

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email },
      select: {
        id: true,
        uid: true,
        fullname: true,
        businessName: true,
        center: true,
        email: true,
        phone: true,
        type: true,
        billingFrequency: true,
        location: true,
        avatar: true,
        status: true,
        role: true,
        agent: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        category: true,
        pricing: true,
        company: true,
      },
    });

    if (!member) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await argon2.verify(member.password, password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    const ip = req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress

    // Return member data
    const { password: pwd, ...memberWithoutPassword } = member;

    void sendEmail(
      member.email,
      "Login Alert from URMS",
      await loginAlert(member.fullname, new Date().toLocaleString(), ip),
    )
      .then((result) => {
        if (!result?.ok) {
          console.error(
            "Login alert email failed:",
            result?.error || "Unknown email error",
          );
        }
      })
      .catch((error) => {
        console.error(
          "Unexpected email send failure:",
          error?.message || error,
        );
      });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      member: memberWithoutPassword,
      token: await generateAuthToken({
        uid: member.uid,
        email: member.email,
        role: member.role,
      }),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const member = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: {
        uid: true,
        email: true,
        fullname: true,
        businessName: true,
      },
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    const code = random6Digit();
    const hashedPassword = await argon2.hash(code);

    await prisma.member.update({
      where: { uid: targetUid },
      data: { password: hashedPassword },
    });

    void sendEmail(
      member.email,
      "Password Reset",
      await resetCode(member.fullname || member.businessName || "Member", code),
    ).catch((emailErr) => {
      console.error(
        "Member password reset email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res.status(200).json({
      ok: true,
      message:
        "Password reset successfully. Check your email for temporary login",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const { error, value } = resetPasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const existingMember = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: { uid: true },
    });

    if (!existingMember) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    const hashedPassword = await argon2.hash(value.currentPassword);
    await prisma.member.update({
      where: { uid: targetUid },
      data: { password: hashedPassword },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: targetUid,
          title: "Password Reset",
          description:
            "Your password has been reset to your current password successfully.",
          type: "SUCCESS",
          date: new Date(),
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to create password reset notification:",
        notificationError.message || notificationError,
      );
    }

    return res.status(200).json({
      ok: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const createSecurityToken = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const { error, value } = createSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const existingMember = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: { uid: true },
    });

    if (!existingMember) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    const hashedSecurityToken = await argon2.hash(value.securityToken);
    await prisma.member.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    return res
      .status(200)
      .json({ ok: true, message: "Security token created successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const forgotSecurityToken = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const member = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: {
        uid: true,
        secureToken: true,
        email: true,
        fullname: true,
        businessName: true,
      },
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    if (!member.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const code = random6Digit();
    const hashedSecurityToken = await argon2.hash(code);
    await prisma.member.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    void sendEmail(
      member.email,
      "Security Token Reset",
      await resetCode(member.fullname || member.businessName || "Member", code),
    ).catch((emailErr) => {
      console.error(
        "Member security token reset email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res
      .status(200)
      .json({
        ok: true,
        message:
          "Security token reset successfully. Check your email for temporary login",
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const changeSecurityToken = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const { error, value } = changeSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const member = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true, email: true, fullname: true },
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    if (!member.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const isTokenValid = await argon2.verify(
      member.secureToken,
      value.oldSecurityToken,
    );
    if (!isTokenValid) {
      return res
        .status(400)
        .json({ ok: false, message: "Old security token is incorrect" });
    }

    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const hashedSecurityToken = await argon2.hash(value.newSecurityToken);
    await prisma.member.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    void sendEmail(
      member.email,
      "Security Token Changed Successfully",
      await resetSuccessful(
        member.fullname || member.businessName || "Member",
        ip,
        new Date().toLocaleString(),
        "security",
      ),
    ).catch((emailErr) => {
      console.error(
        "Member security token change email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res
      .status(200)
      .json({ ok: true, message: "Security token changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const resetSecurityToken = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const { error, value } = resetSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const existingMember = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: { uid: true },
    });

    if (!existingMember) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    const hashedSecurityToken = await argon2.hash(value.currentSecurityToken);
    await prisma.member.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    return res
      .status(200)
      .json({ ok: true, message: "Security token reset successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const verifySecurityCode = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const { error, value } = verifySecurityCodeSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const member = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true },
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    if (!member.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const isValid = await argon2.verify(member.secureToken, value.securityCode);

    return res.status(200).json({
      ok: true,
      message: isValid
        ? "Security code verified successfully"
        : "Invalid security code",
      verified: isValid,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateBillingFrequency = async (req, res) => {
  try {
    const { error, value } = billingFrequencySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const freq = value.frequency?.toUpperCase();

    const member = await prisma.member.update({
      where: { uid: req.params.id },
      data: { billingFrequency: freq },
      select: memberSafeSelect,
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    try {
      await prisma.notification.create({
        data: {
          userId: member.uid,
          title: "Billing Frequency Updated",
          description: `Your billing frequency has been updated to ${freq}.`,
          type: "UPDATE",
          date: new Date(),
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to create billing update notification:",
        notificationError.message || notificationError,
      );
    }

    return res.status(200).json({
      ok: true,
      message: "Billing frequency updated successfully",
      member,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getMembersByAgentId = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res
        .status(400)
        .json({ ok: false, message: "Agent ID is required" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: { agent: agentId },
        skip,
        take: limit,
        select: {
          ...memberSafeSelect,
        },
      }),
      prisma.member.count({ where: { agent: agentId } }),
    ]);

    return res.status(200).json({
      ok: true,
      data: members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getMembersByPricingId = async (req, res) => {
  try {
    const { pricingId } = req.params;

    if (!pricingId) {
      return res
        .status(400)
        .json({ ok: false, message: "Pricing ID is required" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: { pricing: { has: pricingId } },
        skip,
        take: limit,
        select: {
          ...memberSafeSelect,
        },
      }),
      prisma.member.count({ where: { pricing: { has: pricingId } } }),
    ]);

    return res.status(200).json({
      ok: true,
      data: members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getMembersByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, message: "Company ID is required" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100, // Ensure this cap is active
    );
    const skip = (page - 1) * limit;
    const where = { company: companyId };

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateBalance = async (req, res) => {
  try {
    return res.status(400).json({
      ok: false,
      message:
        "Balance is no longer tracked on member records in the current schema.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateDueBalance = async (req, res) => {
  try {
    return res.status(400).json({
      ok: false,
      message:
        "Due balance is no longer tracked on member records in the current schema.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const pricingAction = async (req, res) => {
  try {
    const targetUid = resolveTargetMemberUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Member ID is required" });
    }

    const { error, value } = pricingActionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const member = await prisma.member.findUnique({
      where: { uid: targetUid },
      select: { uid: true, pricing: true },
    });

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    const incomingIds = value.ids
      .map((item) => String(item).trim())
      .filter(Boolean);
    const currentPricing = Array.isArray(member.pricing) ? member.pricing : [];
    let nextPricing = currentPricing;

    if (value.action === "upgrade") {
      nextPricing = Array.from(new Set([...currentPricing, ...incomingIds]));
    } else {
      const removeSet = new Set(incomingIds);
      nextPricing = currentPricing.filter((item) => !removeSet.has(item));
    }

    const updatedMember = await prisma.member.update({
      where: { uid: targetUid },
      data: { pricing: nextPricing },
      select: {
        uid: true,
        pricing: true,
      },
    });

    return res.status(200).json({
      ok: true,
      message:
        value.action === "upgrade"
          ? "Pricing IDs upgraded successfully"
          : "Pricing IDs downgraded successfully",
      member: updatedMember,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const changeMemberAgent = async (req, res) => {
  try {
    const { error, value } = changeMemberAgentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const [member, agent] = await Promise.all([
      prisma.member.findUnique({
        where: { uid: value.userId },
        select: { uid: true, fullname: true, agent: true },
      }),
      prisma.agent.findUnique({
        where: { uid: value.agentId },
        select: { uid: true, fullname: true },
      }),
    ]);

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    if (!agent) {
      return res.status(404).json({ ok: false, message: "Agent not found" });
    }

    const updatedMember = await prisma.member.update({
      where: { uid: value.userId },
      data: { agent: value.agentId },
      select: memberSafeSelect,
    });

    return res.status(200).json({
      ok: true,
      message: "Member agent updated successfully",
      member: updatedMember,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const changeMemberCompany = async (req, res) => {
  try {
    const { error, value } = changeMemberCompanySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const [member, company] = await Promise.all([
      prisma.member.findUnique({
        where: { uid: value.userId },
        select: { uid: true, fullname: true, company: true },
      }),
      prisma.company.findUnique({
        where: { uid: value.companyId },
        select: { uid: true, name: true },
      }),
    ]);

    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    if (!company) {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    const updatedMember = await prisma.member.update({
      where: { uid: value.userId },
      data: { company: value.companyId, agent: "" },
      select: memberSafeSelect,
    });

    return res.status(200).json({
      ok: true,
      message: "Member company updated successfully",
      member: updatedMember,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export {
  createMember,
  getMembers,
  getMember,
  getMembersByAgentId,
  updateMember,
  getMembersByPricingId,
  deleteMember,
  login,
  forgotPassword,
  resetPassword,
  createSecurityToken,
  forgotSecurityToken,
  changeSecurityToken,
  resetSecurityToken,
  verifySecurityCode,
  updateBillingFrequency,
  updateBalance,
  updateDueBalance,
  pricingAction,
  changeMemberAgent,
  changeMemberCompany,
  getMembersByCompanyId,
};
