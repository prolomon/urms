import { prisma } from "../config/db.js";
import argon2 from "argon2";
import { customAlphabet } from "nanoid";
import {
  createStaffSchema,
  updateStaffSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validator/staffValidator.js";

const generateStaffUidSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10,
);

const random6Digit = () => {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
};

const staffSafeSelect = {
  id: true,
  uid: true,
  fullname: true,
  email: true,
  phone: true,
  gender: true,
  status: true,
  location: true,
  avatar: true,
  center: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const createStaff = async (req, res) => {
  try {
    const { error, value } = createStaffSchema.validate(req.body, {
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

    const existing = await prisma.staff.findUnique({
      where: { email: value.email },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already exists" });
    }

    let uid;
    let attempts = 0;

    while (!uid && attempts < 5) {
      const candidateUid = `STF-${generateStaffUidSuffix()}`;
      const existingStaffWithUid = await prisma.staff.findUnique({
        where: { uid: candidateUid },
        select: { id: true },
      });

      if (!existingStaffWithUid) {
        uid = candidateUid;
      }

      attempts += 1;
    }

    if (!uid) {
      return res.status(500).json({
        ok: false,
        message: "Failed to generate unique staff ID, please try again",
      });
    }

    const hashedPassword = await argon2.hash(value.password || value.fullname);

    const staff = await prisma.staff.create({
      data: {
        uid,
        fullname: value.fullname,
        email: value.email,
        phone: value.phone,
        gender: value.gender,
        status: value.status ?? true,
        password: hashedPassword,
        location: value.location,
        avatar: value.avatar,
        center: value.center,
        role: value.role || "STAFF",
      },
      select: staffSafeSelect,
    });

    return res.status(201).json({
      ok: true,
      message: "Staff created successfully",
      staff,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getStaffs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [staffs, total] = await Promise.all([
      prisma.staff.findMany({
        skip,
        take: limit,
        select: staffSafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.staff.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: staffs,
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

const getStaffsByCenter = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const where = { center: String(req.params.center) };

    const [staffs, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limit,
        select: staffSafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.staff.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: staffs,
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

const getStaff = async (req, res) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { uid: String(req.params.uid) },
      select: staffSafeSelect,
    });

    if (!staff) {
      return res.status(404).json({ ok: false, message: "Staff not found" });
    }

    return res.status(200).json({
      ok: true,
      message: "Staff retrieved successfully",
      staff,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { error, value } = updateStaffSchema.validate(req.body, {
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
      const existing = await prisma.staff.findFirst({
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

    const updateData = { ...value };
    if (value.password) {
      updateData.password = await argon2.hash(value.password);
    }

    const staff = await prisma.staff.update({
      where: { uid: String(req.params.uid) },
      data: updateData,
      select: staffSafeSelect,
    });

    return res.status(200).json({
      ok: true,
      message: "Staff updated successfully",
      staff,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Staff not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteStaff = async (req, res) => {
  try {
    await prisma.staff.delete({
      where: { uid: String(req.params.uid) },
    });

    return res.status(200).json({ ok: true, message: "Staff deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Staff not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const staffUid = String(req.params.uid);

    const staff = await prisma.staff.findUnique({
      where: { uid: staffUid },
      select: { uid: true, email: true, fullname: true },
    });

    if (!staff) {
      return res.status(404).json({ ok: false, message: "Staff not found" });
    }

    const code = random6Digit();
    const hashedPassword = await argon2.hash(code);

    await prisma.staff.update({
      where: { uid: staffUid },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      ok: true,
      message: "Password reset successfully. Temporary password sent to email",
      temporaryPassword: code,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Staff not found" });
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

    const staffUid = String(req.params.uid);

    const staff = await prisma.staff.findUnique({
      where: { uid: staffUid },
      select: { uid: true, password: true },
    });

    if (!staff) {
      return res.status(404).json({ ok: false, message: "Staff not found" });
    }

    const isPasswordValid = await argon2.verify(
      staff.password,
      value.currentPassword
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await argon2.hash(value.newPassword);

    await prisma.staff.update({
      where: { uid: staffUid },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Staff not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export { createStaff, getStaffs, getStaffsByCenter, getStaff, updateStaff, deleteStaff, resetPassword, changePassword }; 