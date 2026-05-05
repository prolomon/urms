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

router.post("/", authMiddleware, roleMiddleware(["admin"]), createWallet);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllWallets);
router.get("/:userId/:role", authMiddleware, roleMiddleware(["user", "admin"]), getWalletById);
router.get("/banks", authMiddleware, roleMiddleware(["admin"]), getBanksList);
router.post("/transfer/initiate", authMiddleware, roleMiddleware(["admin"]), initiateTransferController);
router.post("/resolve-bank-account", authMiddleware, roleMiddleware(["admin"]), resolveBankAccountController);
router.post("/transactions", authMiddleware, roleMiddleware(["admin", "user"]), getTransaction);
router.post("/transfer/verify", authMiddleware, roleMiddleware(["admin", "user"]), verifyTransfer);

export { router as walletRouter };
