import express from "express";
import { paystackWebhook } from "../controller/webhookController.js";

const router = express.Router();

router.post("/paystack", paystackWebhook);

export { router as webhookRouter };
