import { prisma } from "../config/db.js";
import { customAlphabet } from "nanoid";
import {
  createCompanySchema,
  updateCompanySchema,
} from "../validator/companyValidator.js";

const generateCompanyUidSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10,
);

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
  secureToken: true,
  accountCode: true,
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
      const candidateUid = `URMSC-${generateCompanyUidSuffix()}`;
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
        phone: value.phone,
        email: value.email,
        avatar: value.avatar,
        status: value.status ?? true,
        center: value.center,
        role: value.role || "COMPANY",
        secureToken: value.secureToken,
        accountCode: value.accountCode,
        location: value.location,
      },
      select: companySafeSelect,
    });

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

    return res.status(204).send();
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export { createCompany, getCompanies, getCompany, updateCompany, deleteCompany };