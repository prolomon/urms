import express from "express";
import {
  createWallet,
  getWalletById,
  getAllWallets,
  initiateTransferController,
  resolveBankAccountController,
  getBanksList,
  getTransaction,
  verifyTransfer,
} from "../controller/walletController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin", "agent"]), createWallet);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllWallets);
router.get("/:userId/:role", authMiddleware, roleMiddleware(["user", "admin", "agent"]), getWalletById);
router.get("/banks", authMiddleware, roleMiddleware(["admin", "agent"]), getBanksList);
router.post("/transfer/initiate", authMiddleware, roleMiddleware(["admin", "agent"]), initiateTransferController);
router.post("/resolve-bank-account", authMiddleware, roleMiddleware(["admin", "agent"]), resolveBankAccountController);
router.post("/transactions", authMiddleware, roleMiddleware(["admin", "user", "agent"]), getTransaction);
router.post("/transfer/verify", authMiddleware, roleMiddleware(["admin", "user", "agent"]), verifyTransfer);

export { router as walletRouter };
  