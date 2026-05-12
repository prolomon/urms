import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByUserId,
  getTransactionsByReference,
} from '../controller/transactionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin']), createTransaction);
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllTransactions);
router.get('/user/:userId', authMiddleware, roleMiddleware(['user', 'admin']), getTransactionsByUserId);
router.get('/reference', authMiddleware, roleMiddleware(['user', 'admin']), getTransactionsByReference);
router.get('/:id', authMiddleware, roleMiddleware(['user', 'admin']), getTransactionById);

export { router as transactionRouter };