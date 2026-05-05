import { prisma } from "../config/db.js";
import argon2 from "argon2";
import { TextEncoder } from "util";
import { createAdminSchema, createSecurityTokenSchema, changeSecurityTokenSchema, changePasswordSchema, loginAdminSchema, verifySecurityCodeSchema, updateAdminSchema,updateAdminStatusSchema } from "../validator/adminValidator.js";
import { customAlphabet } from "nanoid";

const joseImport = () => import("jose");
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "3d";
import { sendEmail } from "../service/mail.js";
import { createCustomer, createAccount } from "../service/paystack.js";

import { verifyProtocol } from "../service/mail.js";
import { accountCreation, walletCreation, resetSuccessful, resetCode, loginAlert } from "../service/templates.js";

const random6Digit = () => {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
};

const generateAdminUidSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10, 
);

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

const looksLikeJwt = (value) =>
  typeof value === "string" && value.split(".").length === 3;

const resolveTargetAdminUid = (req) => {
  if (looksLikeJwt(req.params?.uid)) {
    return req.userId || req.auth?.uid || null;
  }

  return req.params?.uid || null;
};

const createAdmin = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createAdminSchema.validate(req.body, {
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

    const existing = await prisma.admin.findUnique({
      where: { email: value.email },
      select: { id: true },
    });

    if (existing)
      return res
        .status(409)
        .json({ ok: false, message: "Email already exists" });

    const hashedPassword = await argon2.hash(value.phone);

    let genUid;

    const existUid = await prisma.admin.findUnique({
      where: { uid: `URMSAD-${generateAdminUidSuffix()}` },
    });

    if (existUid) {
      genUid = `URMSAD-${generateAdminUidSuffix()}`;
    }

    const admin = await prisma.admin.create({
      data: {
        center: value.center,
        email: value.email,
        password: hashedPassword,
        avatar: value.avatar,
        paymentConfig: {
          main: 40,
          agent: 20,
          technology: 15,
          operation: 25,
        },
        uid: genUid || `URMSAD-${generateAdminUidSuffix()}`,
        location: {
          longitude: value.location?.longitude || 0,
          latitude: value.location?.latitude || 0,
          accuracy: value.location?.accuracy || 0,
        },
        state: value.state,
        address: value.address,
        lga: value.lga,
        country: "nigeria",
        phone: value.phone,
        adminName: value.adminName,
        adminEmail: value.adminEmail,
        adminPhone: value.adminPhone,
        adminLocation: value.adminLocation,
      },
    });

    if (!admin) {
      return res
        .status(500)
        .json({ ok: false, message: "Failed to create admin" });
    }

    void sendEmail(
      admin.email,
      "Welcome to URMS Admin Panel",
      await accountCreation(
        admin.adminName || admin.center,
        admin.email,
        admin.phone,
      ),
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

    return res.status(201).json({
      ok: true,
      message: "Admin created successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        skip,
        take: limit,
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
          paystackCustomerId: true,
          paystackCustomerCode: true,
        },
      }),
      prisma.admin.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: admins,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getAdmin = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { uid: req.params.uid },
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
        paystackCustomerId: true,
        paystackCustomerCode: true,
      },
    });
    if (!admin)
      return res.status(404).json({ ok: false, message: "Admin not found" });
    res.status(200).json({ ok: true, admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getAdminById = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.params.id },
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
        paystackCustomerId: true,
        paystackCustomerCode: true,
      },
    });
    if (!admin)
      return res.status(404).json({ ok: false, message: "Admin not found" });
    res.status(200).json({ ok: true, admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateAdmin = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateAdminSchema.validate(req.body, {
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

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid admin uid in request path",
      });
    }

    const admin = await prisma.admin.update({
      where: { uid: targetUid },
      data: value,
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
        paystackCustomerId: true,
        paystackCustomerCode: true,
      },
    });

    if (!admin)
      return res.status(404).json({ ok: false, message: "Admin not found" });

    const { password, ...adminWithoutPassword } = admin;

    res.status(200).json({
      ok: true,
      message: "Admin updated successfully",
      admin: adminWithoutPassword,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid admin uid in request path",
      });
    }

    const admin = await prisma.admin.delete({ where: { uid: targetUid } });
    if (!admin)
      return res.status(404).json({ ok: false, message: "Admin not found" });
    res.status(204).send();
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { error, value } = loginAdminSchema.validate(req.body, {
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

    await verifyProtocol();

    const { email, password } = value;
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
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
        paystackCustomerId: true,
        paystackCustomerCode: true,
      },
    });

    if (!admin) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await argon2.verify(admin.password, password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    // Return admin data
    const { password: pwd, ...adminWithoutPassword } = admin;
    const token = await generateAuthToken({
      uid: admin.uid,
      role: admin.role,
      type: "admin",
    });

    void sendEmail(
      admin.email,
      "Login Alert from URMS",
      await loginAlert(
        admin.adminName || admin.center || "Admin",
        new Date().toLocaleString(),
        ip,
      ),
    ).catch((emailErr) => {
      console.error(
        "Admin login alert email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      admin: adminWithoutPassword,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid admin uid in request path",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { uid: targetUid },
      select: {
        uid: true,
        email: true,
        center: true,
        adminName: true,
        adminEmail: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    const code = random6Digit();
    const hashedPassword = await argon2.hash(code);
    await prisma.admin.update({
      where: { uid: targetUid },
      data: { password: hashedPassword },
    });

    void sendEmail(
      admin.email,
      "Password Reset",
      await resetCode(
        admin.adminName || admin.center || admin.email?.split("@")[0] || "Admin",
        code,
      )
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


    return res.status(200).json({
      ok: true,
      message: "Password updated successfully, Check your mail for the more Information",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body, {
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

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid admin uid in request path",
      });
    }

    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const admin = await prisma.admin.findUnique({
      where: { uid: targetUid },
      select: { uid: true, password: true },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    const isPasswordValid = await argon2.verify(
      admin.password,
      value.currentPassword,
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        ok: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await argon2.hash(value.newPassword);
    await prisma.admin.update({
      where: { uid: targetUid },
      data: { password: hashedPassword },
    });

    void sendEmail(
      admin.email,
      "Password Changed Successfully",
      await resetSuccessful(
        admin.adminName || admin.center || "Admin",
        ip,
        new Date().toLocaleString(),
        "password",
      ),
    ).catch((emailErr) => {
      console.error(
        "Admin password change email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const createSecurityToken = async (req, res) => {
  try {
    const { error, value } = createSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid admin uid in request path" });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { uid: targetUid },
      select: { uid: true },
    });

    if (!existingAdmin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    const hashedSecurityToken = await argon2.hash(value.securityToken);
    await prisma.admin.update({
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

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid admin uid in request path" });
    }

    const admin = await prisma.admin.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true, email: true, adminName: true },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    if (!admin.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }
    const code = random6Digit();
    const hashedSecurityToken = await argon2.hash(code);

    await prisma.admin.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    void sendEmail(
      admin.email || admin.adminEmail,
      "Security Token Reset",
      await resetCode(
        admin.adminName || admin.email?.split("@")[0] || "Admin",
        code
      ),
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

    return res
      .status(200)
      .json({ ok: true, message: "Your security token has been reset, You can check your mail for more information" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const changeSecurityToken = async (req, res) => {
  try {
    const { error, value } = changeSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid admin uid in request path",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true, email: true, adminName: true, center: true },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    if (!admin.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const isTokenValid = await argon2.verify(
      admin.secureToken,
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
    await prisma.admin.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    void sendEmail(
      admin.email,
      "Security Token Changed Successfully",
      await resetSuccessful(
        admin.adminName || admin.center || "Admin",
        ip,
        new Date().toLocaleString(),
        "security",
      ),
    ).catch((emailErr) => {
      console.error(
        "Admin security token change email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res.status(200).json({
      ok: true,
      message: "Security token changed successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const verifySecurityCode = async (req, res) => {
  try {
    const { error, value } = verifySecurityCodeSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const targetUid = resolveTargetAdminUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid admin uid in request path" });
    }

    const admin = await prisma.admin.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    if (!admin.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const isValid = await argon2.verify(admin.secureToken, value.securityCode);

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

const updatePaymentConfig = async (req, res) => {
  try {
    const uid = resolveTargetAdminUid(req);
    const { paymentConfig } = req.body;

    if (!uid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid admin uid in request path",
      });
    }

    // Validate paymentConfig exists
    if (!paymentConfig || typeof paymentConfig !== "object") {
      return res.status(400).json({
        ok: false,
        message: "paymentConfig must be an object",
      });
    }

    // Validate all required fields are numbers
    const { amac, agent, technology, operation } = paymentConfig;

    if (
      typeof amac !== "number" ||
      typeof agent !== "number" ||
      typeof technology !== "number" ||
      typeof operation !== "number"
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "All payment config values (amac, agent, technology, operation) must be numbers",
      });
    }

    // Validate that all percentages total 100
    const total = amac + agent + technology + operation;
    if (total !== 100) {
      return res.status(400).json({
        ok: false,
        message: `Payment config percentages must total 100. Current total: ${total}`,
      });
    }

    // Update admin payment config
    const updatedAdmin = await prisma.admin.update({
      where: { uid },
      data: { paymentConfig },
      select: {
        id: true,
        uid: true,
        center: true,
        email: true,
        avatar: true,
        role: true,
        state: true,
        address: true,
        lga: true,
        country: true,
        paymentConfig: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!updatedAdmin)
      return res.status(404).json({ ok: false, message: "Admin not found" });

    res.status(200).json({
      ok: true,
      message: "Payment config updated successfully",
      admin: updatedAdmin,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateAdminStatus = async (req, res) => {
  try {
    const { error, value } = updateAdminStatusSchema.validate(req.body, {
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

    const existingAdmin = await prisma.admin.findUnique({
      where: { uid: req.params.uid },
      select: { id: true },
    });

    if (!existingAdmin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    const admin = await prisma.admin.update({
      where: { uid: req.params.uid },
      data: { status: value.status },
      select: {
        id: true,
        uid: true,
        center: true,
        email: true,
        avatar: true,
        role: true,
        state: true,
        address: true,
        lga: true,
        country: true,
        paymentConfig: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      ok: true,
      message: `Admin status updated to ${value.status ? "active" : "inactive"}`,
      admin,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};



export {
  createAdmin,
  getAllAdmins,
  getAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  forgotPassword,
  changePassword,
  createSecurityToken,
  forgotSecurityToken,
  changeSecurityToken,
  verifySecurityCode,
  updatePaymentConfig,
  updateAdminStatus,
};
