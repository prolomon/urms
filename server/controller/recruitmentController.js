import { prisma } from "../config/db.js";
import {
  createRecruitmentSchema,
  deleteRecruitmentSchema,
} from "../validator/recruitmentValidator.js";
import { sendEmail } from "../service/mail.js";
import {
  recruitmentApplicationSuccessful,
  recruitmentApplicationAgeNotQualified,
} from "../service/templates.js";

const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

const createRecruitment = async (req, res) => {
  try {
    const { error, value } = createRecruitmentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const age = calculateAge(value.dob);
    const isWithinAgeLimit = age >= 18 && age <= 40;
    const emailTemplate = isWithinAgeLimit
      ? await recruitmentApplicationSuccessful(value.fullname)
      : await recruitmentApplicationAgeNotQualified(value.fullname);

    if (!isWithinAgeLimit) {
      void sendEmail(
        value.email,
        "KRMS Recruitment Application Received",
        emailTemplate,
      ).catch((emailErr) => {
        console.error(
          "Recruitment application confirmation email failed:",
          emailErr?.message || emailErr,
        );
      });

      return res.status(200).json({
        ok: true,
        message: "Recruitment submitted successfully",
        saved: false,
        data: value,
      });
    }

    const recruitment = await prisma.recruitment.create({
      data: value,
    });

    void sendEmail(
      value.email,
      "KRMS Recruitment Application Received",
      emailTemplate,
    ).catch((emailErr) => {
      console.error(
        "Recruitment application confirmation email failed:",
        emailErr?.message || emailErr,
      );
    });

    return res.status(201).json({
      ok: true,
      message: "Recruitment created successfully",
      recruitment,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getRecruitments = async (req, res) => {
  try {
    const recruitments = await prisma.recruitment.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      ok: true,
      data: recruitments,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getRecruitmentById = async (req, res) => {
  try {
    const { error, value } = deleteRecruitmentSchema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const recruitment = await prisma.recruitment.findUnique({
      where: { id: value.id },
    });

    if (!recruitment) {
      return res.status(404).json({
        ok: false,
        message: "Recruitment not found",
      });
    }

    return res.status(200).json({
      ok: true,
      data: recruitment,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const deleteRecruitment = async (req, res) => {
  try {
    const { error, value } = deleteRecruitmentSchema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const existingRecruitment = await prisma.recruitment.findUnique({
      where: { id: value.id },
    });

    if (!existingRecruitment) {
      return res.status(404).json({
        ok: false,
        message: "Recruitment not found",
      });
    }

    await prisma.recruitment.delete({
      where: { id: value.id },
    });

    return res.status(200).json({
      ok: true,
      message: "Recruitment deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

export {
  createRecruitment,
  getRecruitments,
  getRecruitmentById,
  deleteRecruitment,
};
