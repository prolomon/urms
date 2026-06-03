import { prisma } from "../config/db.js";
import argon2 from "argon2";
import { TextEncoder } from "util";
import { customAlphabet } from "nanoid";
import {
  createCompanySchema,
  updateCompanySchema,
  resetPasswordSchema,
  changePasswordSchema,
  loginCompanySchema,
} from "../validator/companyValidator.js";
import { sendEmail } from "../service/mail.js";
import { verifyProtocol } from "../service/mail.js";
import { loginAlert } from "../service/templates.js";

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

const generateCompanyUidSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10,
);

const random6Digit = () => {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
};

const companySafeSelect = {
  id: true,
  uid: true,
  name: true,
  phone: true,
  email: true,
  avatar: true,
  status: true,
  center: true,
  role: true,
  category: true,
  location: true,
  createdAt: true,
  updatedAt: true,
};

const createCompany = async (req, res) => {
  try {
    const { error, value } = createCompanySchema.validate(req.body, {
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

    const existing = await prisma.company.findUnique({
      where: { email: value.email },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already exists" });
    }

    let uid;
    let attempts = 0;

    while (!uid && attempts < 5) {
      const candidateUid = `PRT-${generateCompanyUidSuffix()}`;
      const existingCompanyWithUid = await prisma.company.findUnique({
        where: { uid: candidateUid },
        select: { id: true },
      });

      if (!existingCompanyWithUid) {
        uid = candidateUid;
      }

      attempts += 1;
    }

    if (!uid) {
      return res.status(500).json({
        ok: false,
        message: "Failed to generate unique company ID, please try again",
      });
    }

    const company = await prisma.company.create({
      data: {
        uid,
        name: value.name,
        password: await argon2.hash(value.phone),
        phone: value.phone,
        email: value.email,
        avatar: value.avatar,
        status: value.status ?? true,
        center: value.center,
        role: value.role || "COMPANY",
        location: value.location,
        category: value.category,
      },
      select: companySafeSelect,
    });

    const wallet = await prisma.wallet.create({
      data: {
        userId: uid,
        accountNo: value.data?.accountNumber,
        role: "COMPANY",
        bank: {
          name: value.data?.bankName,
          id: uid,
          code: value.data?.bankCode,
        },
        balance: 0.0,
        status: true,
        accountName: value.data?.accountName,
        currency: "NGN",
        accountHolderId: uid,
      },
    });

    if (!wallet) {
      await prisma.company.delete({ where: { uid } });
      return res.status(500).json({
        ok: false,
        message: "Failed to create company wallet",
      });
    }

    return res.status(201).json({
      ok: true,
      message: "Company created successfully",
      company,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getCompanies = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        skip,
        take: limit,
        select: companySafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: companies,
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

const getCompaniesByCenter = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const where = { center: String(req.params.center) };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        select: companySafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: companies,
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

const getCompany = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { uid: String(req.params.uid) },
      select: companySafeSelect,
    });

    if (!company) {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    return res.status(200).json({
      ok: true,
      message: "Company retrieved successfully",
      company,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { error, value } = updateCompanySchema.validate(req.body, {
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

    if (value.email) {
      const existing = await prisma.company.findFirst({
        where: {
          email: value.email,
          NOT: { uid: String(req.params.uid) },
        },
        select: { id: true },
      });

      if (existing) {
        return res.status(409).json({ ok: false, message: "Email already exists" });
      }
    }

    const company = await prisma.company.update({
      where: { uid: String(req.params.uid) },
      data: value,
      select: companySafeSelect,
    });

    return res.status(200).json({
      ok: true,
      message: "Company updated successfully",
      company,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteCompany = async (req, res) => {
  try {
    await prisma.company.delete({
      where: { uid: String(req.params.uid) },
    });

    return res.status(200).json({ ok: true, message: "Company deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const companyUid = String(req.params.uid);

    const company = await prisma.company.findUnique({
      where: { uid: companyUid },
      select: { uid: true, email: true, name: true },
    });

    if (!company) {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    const code = random6Digit();
    const hashedPassword = await argon2.hash(code);

    await prisma.company.update({
      where: { uid: companyUid },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      ok: true,
      message: "Password reset successfully. Temporary password sent to email",
      temporaryPassword: code,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

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

    const companyUid = String(req.params.uid);

    const company = await prisma.company.findUnique({
      where: { uid: companyUid },
      select: { uid: true, password: true },
    });

    if (!company) {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    const isPasswordValid = await argon2.verify(
      company.password,
      value.currentPassword
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await argon2.hash(value.newPassword);

    await prisma.company.update({
      where: { uid: companyUid },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const loginCompany = async (req, res) => {
  try {
    const { error, value } = loginCompanySchema.validate(req.body, {
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
      req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress 

    const company = await prisma.company.findUnique({
      where: { email },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        password: true,
        avatar: true,
        role: true,
        phone: true,
        center: true,
        status: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await argon2.verify(company.password, password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    const { password: pwd, ...companyWithoutPassword } = company;
    const token = await generateAuthToken({
      uid: company.uid,
      role: company.role,
      type: "company",
    });

    void sendEmail(
      company.email,
      "Login Alert from URMS",
      await loginAlert(
        company.name || company.center || "Company",
        new Date().toLocaleString(),
        ip,
      ),
    ).catch((emailErr) => {
      console.error(
        "Company login alert email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      company: companyWithoutPassword,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export {
  createCompany,
  getCompanies,
  getCompaniesByCenter,
  loginCompany,
  getCompany,
  updateCompany,
  deleteCompany,
  resetPassword,
  changePassword,
};
