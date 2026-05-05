import express from 'express';
import { 
  createAgent, 
  getAllAgents, 
  getAgentList,
  getAgent, 
  getAgentById, 
  updateAgent, 
  deleteAgent, 
  loginAgent,
  forgotPassword,
  createSecurityToken,
  forgotSecurityToken,
  changeSecurityToken,
  verifySecurityCode,
  getAllAgentsByCenter,
  getAllAgentsByCompany,
} from '../controller/agentController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin', "company"]), createAgent);
router.post('/login', loginAgent);
router.put('/:uid/forgot-password', authMiddleware, roleMiddleware(['admin', 'agent']), forgotPassword);
router.post('/:uid/security-token', authMiddleware, roleMiddleware(['admin', 'agent']), createSecurityToken);
router.post('/:uid/forgot-security-token', authMiddleware, roleMiddleware(['admin', 'agent']), forgotSecurityToken);
router.post('/:uid/change-security-token', authMiddleware, roleMiddleware(['admin', 'agent']), changeSecurityToken);
router.post('/:uid/verify-security-token', authMiddleware, roleMiddleware(['admin', 'agent']), verifySecurityCode);
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllAgents);
router.get('/center/:id', authMiddleware, roleMiddleware(['admin']), getAllAgentsByCenter);
router.get('/company/:company', authMiddleware, roleMiddleware(['admin']), getAllAgentsByCompany);
router.get('/list', getAgentList);
router.get('/id/:id', authMiddleware, roleMiddleware(['admin', "agent"]), getAgentById);
router.get('/one/:uid', authMiddleware, roleMiddleware(['admin', "agent"]), getAgent);
router.put('/:uid', authMiddleware, roleMiddleware(['admin', "agent"]), updateAgent);
router.delete('/:uid', authMiddleware, roleMiddleware(['admin']), deleteAgent);

export {router as agentRouter};
