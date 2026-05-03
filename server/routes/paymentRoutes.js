import express from 'express';
import { createPayment, getPaymentsByUserId, getPaymentByReference, getAllPayments, verifyPayment } from '../controller/paymentController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['user', "admin"]), createPayment);

router.get('/', authMiddleware, roleMiddleware(['admin']), getAllPayments);

router.get('/user/:userId', authMiddleware, roleMiddleware(['user', "admin"]), getPaymentsByUserId);

router.get('/reference/:reference', authMiddleware, roleMiddleware(['user', "admin"]), getPaymentByReference);

router.put('/verify/:id', authMiddleware, roleMiddleware(['admin']), verifyPayment);

export {router as paymentRouter};
 