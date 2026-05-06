import express from "express";
import { paystackWebhook, nombaWebhook } from "../controller/webhookController.js";

const router = express.Router();

router.post("/paystack", paystackWebhook);
router.post("/nomba", nombaWebhook);

export { router as webhookRouter };
