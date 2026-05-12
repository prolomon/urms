import express from 'express';
import { createPayment, getPaymentsByUserId, getPaymentByReference, getPaymentById, getAllPayments, verifyPayment, updatePaymentSchedule, makePayment } from '../controller/paymentController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['user', "admin"]), createPayment);

router.post('/make/:userId/:paymentId', authMiddleware, roleMiddleware(['user', "admin"]), makePayment);

router.get('/', authMiddleware, roleMiddleware(['admin']), getAllPayments);

router.get('/user/:userId', authMiddleware, roleMiddleware(['user', "admin"]), getPaymentsByUserId);

router.get('/reference/:reference', authMiddleware, roleMiddleware(['user', "admin"]), getPaymentByReference);

router.get('/:id', authMiddleware, roleMiddleware(['user', "admin"]), getPaymentById);

router.put('/verify/:id', authMiddleware, roleMiddleware(['admin']), verifyPayment);

router.put('/schedule/:id', authMiddleware, roleMiddleware(['admin']), updatePaymentSchedule);

export {router as paymentRouter};
  