import express from 'express';
import {
  createPaymentTransaction,
  getPaymentTransactionsByUserId,
  getPaymentTransactionsByPaymentId,
  getPaymentTransactionByReference,
  getAllPaymentTransactions,
  updatePaymentTransaction,
} from '../controller/paymentTransactionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Create a new payment transaction
router.post('/', authMiddleware, roleMiddleware(['user', 'admin', 'company']), createPaymentTransaction);

// Get all payment transactions (admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllPaymentTransactions);

// Get payment transactions by user ID
router.get('/user/:userId', authMiddleware, roleMiddleware(['user', 'admin']), getPaymentTransactionsByUserId);

// Get payment transactions by payment ID
router.get('/payment/:paymentId', authMiddleware, roleMiddleware(['user', 'admin']), getPaymentTransactionsByPaymentId);

// Get a single payment transaction by reference
router.get('/reference/:reference', authMiddleware, roleMiddleware(['user', 'admin']), getPaymentTransactionByReference);

// Update a payment transaction
router.put('/:reference', authMiddleware, roleMiddleware(['admin']), updatePaymentTransaction);

export default router;
