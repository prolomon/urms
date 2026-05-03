import express from 'express';
const router = express.Router();
import {
  createMember,
  getMembers,
  getMember,
  getMembersByAgentId,
  updateMember, 
  deleteMember,
  login,
  forgotPassword, 
  createSecurityToken,
  forgotSecurityToken,
  changeSecurityToken,
  verifySecurityCode,
  updateBillingFrequency,
  updateBalance,
  updateDueBalance,
  pricingAction,
  changeMemberAgent,
  getMembersByPricingId
} from '../controller/memberController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

router.post('/login', loginLimiter, login);
router.post('/forgot-password/:id', authMiddleware, roleMiddleware(['user', 'admin']), forgotPassword);
router.post('/security-token/:id', authMiddleware, roleMiddleware(['user', 'admin']), createSecurityToken);
router.post('/forgot-security-token/:id', authMiddleware, roleMiddleware(['user', 'admin']), forgotSecurityToken);
router.post('/change-security-token/:id', authMiddleware, roleMiddleware(['user', 'admin']), changeSecurityToken);
router.post('/verify-security-code/:id', authMiddleware, roleMiddleware(['user', 'admin']), verifySecurityCode);
router.post('/', createMember);
router.get('/:id/center', authMiddleware, roleMiddleware(['user', "admin"]), getMembers);
router.get('/agent/:agentId', authMiddleware, roleMiddleware(['admin']), getMembersByAgentId);
router.put('/change-agent', authMiddleware, roleMiddleware(['admin']), changeMemberAgent);
router.get('/:id', authMiddleware, roleMiddleware(['user', "admin"]), getMember);
router.put('/:id', authMiddleware, roleMiddleware(['user', "admin"]), updateMember);
router.patch('/:id/billing-frequency', authMiddleware, roleMiddleware(['user', "admin"]), updateBillingFrequency);
router.put('/:id/pricing-action', authMiddleware, roleMiddleware(['admin']), pricingAction);
router.patch('/:id/balance', authMiddleware, roleMiddleware(['admin']), updateBalance);
router.patch('/:id/due-balance', authMiddleware, roleMiddleware(['admin']), updateDueBalance);
router.get('/pricing/:pricingId', authMiddleware, roleMiddleware(['admin']), getMembersByPricingId);
router.delete('/:id', authMiddleware, roleMiddleware(['user', "admin"]), deleteMember);

export {router as memberRouter};
