import { prisma } from "../config/db.js";
import { TextEncoder } from "util";

const joseImport = () => import("jose");
const jwtSecret = process.env.JWT_SECRET;

const decodeTokenIfJwt = async (token) => {
  if (!jwtSecret || token.split(".").length !== 3) {
    return null;
  }

  try {
    const { jwtVerify } = await joseImport();
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret),
    );

    if (!payload?.uid || typeof payload.uid !== "string") {
      return null;
    }

    return payload;
  } catch (_) {
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Bearer token is required." });
    }

    const token = authHeader.slice(7).trim(); // Remove 'Bearer ' prefix
    const jwtPayload = await decodeTokenIfJwt(token);
    const userUid = jwtPayload?.uid || token;

    // Try to find member by uid extracted from token
    let user = await prisma.member.findUnique({
      where: { uid: userUid },
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
      },
    });
    let userType = "member";

    // If not found as member, try to find as agent
    if (!user) {
      user = await prisma.agent.findUnique({
        where: { uid: userUid },
        select: {
          id: true,
          uid: true,
          fullname: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      userType = "agent";
    }

    // If not found as agent, try to find as admin
    if (!user) {
      user = await prisma.admin.findUnique({
        where: { uid: userUid },
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
        },
      });
      userType = "admin";
    }

    if (!user) {
      user = await prisma.company.findUnique({
        where: { uid: userUid },
        select: {
          id: true,
          uid: true,
          name: true,
          phone: true,
          email: true,
          avatar: true,
          status: true,
          center: true,
          role: true,
          location: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      userType = "company";
    }

    if (!user) {
      console.log(user)
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }

    req.userId = user.uid;
    req.auth = jwtPayload || null;
    req.userType = userType;
    req.user = user;

    // For backward compatibility
    if (userType === "member") {
      req.member = user;
    } else if (userType === "agent") {
      req.agent = user;
    } else {
      req.admin = user;
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error during authentication." });
  }
};

export { authMiddleware };
