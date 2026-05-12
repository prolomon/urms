import express from 'express';
const router = express.Router();
import { checkDatabaseConnection } from '../middleware/dbHealthCheck.js';
import { adminRouter } from './adminRoutes.js';
import { paymentRouter } from './paymentRoutes.js';
import { notificationRouter } from './notificationRoutes.js';
import { paymentDistributionRouter } from './paymentDistributionRoutes.js';
import { pricingRouter } from './pricingRoutes.js';
import { memberRouter } from './memberRoutes.js';
import { agentRouter } from './agentRoutes.js';
import { companyRouter } from './companyRoutes.js';
import { staffRouter } from './staffRoutes.js';
import { uploadRouter } from './uploadRoutes.js';
import { walletRouter } from './walletRoutes.js';
import { webhookRouter } from './webhookRoutes.js';
import { recruitmentRouter } from './recruitmentRoutes.js';
import { transactionRouter } from './transactionRoutes.js';
import paymentTransactionRoutes from './paymentTransactionRoutes.js';

// Apply database health check to all API routes
router.use(checkDatabaseConnection);

// This file will export all routes
router.use('/upload', uploadRouter);
router.use('/member', memberRouter);
router.use('/agent', agentRouter);
router.use('/company', companyRouter);
router.use('/staff', staffRouter);
router.use('/admin', adminRouter);
router.use('/notification', notificationRouter);
router.use('/payment', paymentRouter);
router.use('/payment-distribution', paymentDistributionRouter);
router.use('/payment-transaction', paymentTransactionRoutes);
router.use('/pricing', pricingRouter);
router.use('/wallet', walletRouter);
router.use('/transaction', transactionRouter);
router.use('/webhook', webhookRouter);
router.use('/recruitment', recruitmentRouter);

export  {router as apiRouter};
  