import express from "express";
import { 
  createPricing, 
  getAllPricing, 
  getPricing, 
  updatePricing, 
  deletePricing,
  toggleStatus
} from '../controller/pricingController.js';
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['admin']), createPricing);
router.get('/:id/all', getAllPricing);
router.get('/:id', getPricing);
router.put('/:id/toggle-status', authMiddleware, roleMiddleware(['admin']), toggleStatus);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), updatePricing);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deletePricing);

export {router as pricingRouter};
