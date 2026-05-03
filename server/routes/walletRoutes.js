import express from "express";
import {
  createWallet,
  getWalletByMemberId,
  getWalletByAdminId,
  getAllWallets,
  updateWalletBalanceByAdminId,
  validateWalletOwnership,
  createTransferRecipientController,
  initiateTransferController,
  resolveBankAccountController,
  getWalletByAgentId
} from "../controller/walletController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), createWallet);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllWallets);
router.get("/member/:memberId", authMiddleware, roleMiddleware(["user", "admin"]), getWalletByMemberId);
router.get("/admin/:adminId", authMiddleware, roleMiddleware(["admin"]), getWalletByAdminId);
router.get("/agent/:agentId", authMiddleware, roleMiddleware(["admin"]), getWalletByAgentId);
router.put("/admin/:adminId/balance", authMiddleware, roleMiddleware(["admin"]), updateWalletBalanceByAdminId);
router.post("/:id/validate-ownership/", authMiddleware, roleMiddleware(["admin"]), validateWalletOwnership);
router.post("/transfer/recipient", authMiddleware, roleMiddleware(["admin"]), createTransferRecipientController);
router.post("/transfer/initiate", authMiddleware, roleMiddleware(["admin"]), initiateTransferController);
router.post("/resolve-bank-account", authMiddleware, roleMiddleware(["admin"]), resolveBankAccountController);

export { router as walletRouter };
