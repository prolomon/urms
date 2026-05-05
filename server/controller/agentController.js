import { prisma } from "../config/db.js";
import argon2 from "argon2";
import { TextEncoder } from "util";
import {
  createAgentSchema,
  createSecurityTokenSchema,
  changeSecurityTokenSchema,
  updateAgentSchema,
  loginAgentSchema,
  verifySecurityCodeSchema,
} from "../validator/agentValidator.js";
import { customAlphabet } from "nanoid";
import { sendEmail } from "../service/mail.js";
import { createCustomer, createAccount } from "../service/paystack.js";
import {
  accountCreation,
  walletCreation,
  loginAlert,
  resetCode,
  resetSuccessful,
} from "../service/templates.js";

const generateAgentUidSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10,
);

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

const looksLikeJwt = (value) =>
  typeof value === "string" && value.split(".").length === 3;

const resolveTargetAgentUid = (req) => {
  if (looksLikeJwt(req.params?.uid)) {
    return req.userId || req.auth?.uid || null;
  }

  return req.params?.uid || null;
};

const random6Digit = () => {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
};

const createAgent = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createAgentSchema.validate(req.body, {
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

    const existing = await prisma.agent.findUnique({
      where: { email: value.email },
      select: { id: true },
    });

    if (existing)
      return res
        .status(409)
        .json({ ok: false, message: "Email already exists" });

    const hashedPassword = await argon2.hash(value.phone);

    let genUid;

    const existUid = await prisma.agent.findUnique({
      where: { uid: `AGT-${generateAgentUidSuffix()}` },
    });

    if (existUid) {
      genUid = `URMSAG-${generateAgentUidSuffix()}`;
    }

    const agent = await prisma.agent.create({
      data: {
        batchNo: value.batchNo,
        center: value.center,
        fullname: value.fullname,
        email: value.email,
        phone: value.phone,
        password: hashedPassword,
        location: value.location,
        gender: value.gender,
        role: value.role || "ADMIN",
        uid: genUid || `AGT-${generateAgentUidSuffix()}`,
        company: value.company,
      },
    });

    if (!agent)
      return res
        .status(500)
        .json({ ok: false, message: "Failed to create agent" });

    void sendEmail(
      agent.email,
      "Welcome to URMS Agent Panel",
      await accountCreation(agent.fullname, agent.email, agent.phone),
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

    const { password, ...agentWithoutPassword } = agent;
    return res.status(201).json({
      ok: true,
      message: "Agent created successfully",
      agent: agentWithoutPassword,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllAgents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          batchNo: true,
          center: true,
          gender: true,
          fullname: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
          uid: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.agent.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: agents,
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

const getAllAgentsByCenter = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const where = { center: String(req.params.id) };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          batchNo: true,
          center: true,
          gender: true,
          fullname: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
          uid: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.agent.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: agents,
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

const getAllAgentsByCompany = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const where = { company: String(req.params.company) };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          batchNo: true,
          center: true,
          company: true,
          gender: true, 
          fullname: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
          uid: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.agent.count({ where }),
    ]);

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    return res.status(200).json({
      ok: true,
      data: agents,
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

const getAgentList = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        batchNo: true,
        center: true,
        gender: true,
        fullname: true,
        email: true,
        phone: true,
        location: true,
        avatar: true,
        uid: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      ok: true,
      data: agents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getAgent = async (req, res) => {
  console.log("Fetching agent with uid:", req.params.uid);
  try {
    const agent = await prisma.agent.findUnique({
      where: { uid: String(req.params.uid) },
      select: {
        status: true,
        id: true,
        batchNo: true,
        center: true,
        gender: true,
        fullname: true,
        email: true,
        phone: true,
        location: true,
        avatar: true,
        uid: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!agent)
      return res.status(404).json({ ok: false, message: "Agent not found" });
    res.status(200).json({ ok: true, agent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getAgentById = async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: String(req.params.id) },
      select: {
        status: true,
        id: true,
        batchNo: true,
        center: true,
        gender: true,
        fullname: true,
        email: true,
        phone: true,
        location: true,
        avatar: true,
        uid: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!agent)
      return res.status(404).json({ ok: false, message: "Agent not found" });
    res.status(200).json({ ok: true, agent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateAgent = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateAgentSchema.validate(req.body, {
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

    const agent = await prisma.agent.update({
      where: { uid: String(req.params.uid) },
      data: value,
    });

    if (!agent)
      return res.status(404).json({ ok: false, message: "Agent not found" });
    const { password, ...agentWithoutPassword } = agent;
    res.status(200).json({
      ok: true,
      message: "Agent updated successfully",
      agent: agentWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteAgent = async (req, res) => {
  try {
    const agent = await prisma.agent.delete({ where: { uid: req.params.uid } });
    if (!agent)
      return res.status(404).json({ ok: false, message: "Agent not found" });
    res.status(200).json({ ok: true, message: "Agent deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
};

const loginAgent = async (req, res) => {
  try {
    const { error, value } = loginAgentSchema.validate(req.body, {
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

    const { email, password } = value;

    // Find agent by email
    const agent = await prisma.agent.findUnique({
      where: { email },
      select: {
        status: true,
        id: true,
        batchNo: true,
        center: true,
        gender: true,
        fullname: true,
        email: true,
        phone: true,
        password: true,
        location: true,
        avatar: true,
        uid: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        paystackCustomerId: true,
        paystackCustomerCode: true,
      },
    });

    if (!agent) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await argon2.verify(agent.password, password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid email or password" });
    }

    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Return agent data
    const { password: pwd, ...agentWithoutPassword } = agent;

    void sendEmail(
      agent.email,
      "Welcome to URMS Agent Panel",
      await loginAlert(agent.fullname, new Date().toLocaleString(), ip),
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
      message: "Login successful",
      agent: agentWithoutPassword,
      token: await generateAuthToken({
        uid: agent.uid,
        email: agent.email,
        role: agent.role,
      }),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const targetUid = resolveTargetAgentUid(req);
    if (!targetUid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid agent uid in request path",
      });
    }

    const agent = await prisma.agent.findUnique({
      where: { uid: targetUid },
      select: { uid: true, email: true, fullname: true },
    });

    if (!agent) {
      return res.status(404).json({ ok: false, message: "Agent not found" });
    }

    const code = random6Digit();
    const hashedPassword = await argon2.hash(code);
    await prisma.agent.update({
      where: { uid: targetUid },
      data: { password: hashedPassword },
    });

    void sendEmail(
      agent.email,
      "Password Reset",
      await resetCode(
        agent.fullname || agent.email.split("@")[0] || "Agent",
        code,
      ),
    ).catch((emailErr) => {
      console.error(
        "Agent password reset email failed:",
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

const createSecurityToken = async (req, res) => {
  try {
    const { error, value } = createSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const targetUid = resolveTargetAgentUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid agent uid in request path" });
    }

    const existingAgent = await prisma.agent.findUnique({
      where: { uid: targetUid },
      select: { uid: true },
    });

    if (!existingAgent) {
      return res.status(404).json({ ok: false, message: "Agent not found" });
    }

    const hashedSecurityToken = await argon2.hash(value.secureToken);
    await prisma.agent.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    return res
      .status(200)
      .json({ ok: true, message: "Security token created successfully" });
  } catch (err) {
    console.log(err);
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const forgotSecurityToken = async (req, res) => {
  try {
    const targetUid = resolveTargetAgentUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid agent uid in request path" });
    }

    const agent = await prisma.agent.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true, email: true, fullname: true },
    });

    if (!agent) {
      return res.status(404).json({ ok: false, message: "Agent not found" });
    }

    if (!agent.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const code = random6Digit();
    const hashedSecurityToken = await argon2.hash(code);
    await prisma.agent.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    void sendEmail(
      agent.email,
      "Security Token Reset",
      await resetCode(
        agent.fullname || agent.email.split("@")[0] || "Agent",
        code,
      ),
    ).catch((emailErr) => {
      console.error(
        "Agent security token reset email failed:",
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
    const { error, value } = changeSecurityTokenSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const targetUid = resolveTargetAgentUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid agent uid in request path" });
    }

    const agent = await prisma.agent.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true, email: true, fullname: true },
    });

    if (!agent) {
      return res.status(404).json({ ok: false, message: "Agent not found" });
    }

    if (!agent.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const isTokenValid = await argon2.verify(
      agent.secureToken,
      value.oldSecureToken,
    );

    if (!isTokenValid) {
      return res
        .status(400)
        .json({ ok: false, message: "Old security token is incorrect" });
    }

    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const hashedSecurityToken = await argon2.hash(value.newSecureToken);

    await prisma.agent.update({
      where: { uid: targetUid },
      data: { secureToken: hashedSecurityToken },
    });

    void sendEmail(
      agent.email,
      "Security Token Changed Successfully",
      await resetSuccessful(
        agent.fullname || "Agent",
        ip,
        new Date().toLocaleString(),
        "security",
      ),
    ).catch((emailErr) => {
      console.error(
        "Security token change email failed:",
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

const verifySecurityCode = async (req, res) => {
  try {
    const { error, value } = verifySecurityCodeSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ ok: false, message: errors[0], errors });
    }

    const targetUid = resolveTargetAgentUid(req);
    if (!targetUid) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid agent uid in request path" });
    }

    const agent = await prisma.agent.findUnique({
      where: { uid: targetUid },
      select: { uid: true, secureToken: true },
    });

    if (!agent) {
      return res.status(404).json({ ok: false, message: "Agent not found" });
    }

    if (!agent.secureToken) {
      return res
        .status(400)
        .json({ ok: false, message: "Security token is not set" });
    }

    const isValid = await argon2.verify(agent.secureToken, value.secureToken);

    return res.status(200).json({
      ok: true,
      message: isValid
        ? "Security code verified successfully"
        : "Incorrect security code",
      verified: isValid,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export {
  createAgent,
  getAllAgents,
  getAgentList,
  getAgent,
  getAgentById,
  updateAgent,
  deleteAgent,
  loginAgent,
  forgotPassword,
  createSecurityToken,
  forgotSecurityToken,
  changeSecurityToken,
  verifySecurityCode,
  getAllAgentsByCenter,
  getAllAgentsByCompany,
};
