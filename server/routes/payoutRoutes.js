import express from "express";
import {
  createPayout,
  getAllPayouts,
  getPayoutById,
  getPayoutByUser,
  updatePayout,
  updatePayoutStatus,
} from "../controller/payoutController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin", "agent"]), createPayout);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllPayouts);
router.get("/:id", authMiddleware, roleMiddleware(["admin", "user", "agent"]), getPayoutById);
router.get("/user/:userId", authMiddleware, roleMiddleware(["admin", "user", "agent"]), getPayoutByUser);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "agent"]), updatePayout);
router.patch("/:id/status", authMiddleware, roleMiddleware(["admin"]), updatePayoutStatus);

export { router as payoutRouter };