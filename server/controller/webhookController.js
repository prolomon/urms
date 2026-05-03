import crypto from "crypto";
import { recordWebhookTransaction } from "./transactionController.js";

const paystackWebhook = async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        ok: false,
        message: "PAYSTACK_SECRET_KEY is not configured",
      });
    }

    const signature = req.headers["x-paystack-signature"];
    if (!signature) {
      return res.status(401).json({ ok: false, message: "Missing Paystack signature" });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ ok: false, message: "Invalid webhook payload" });
    }

    const expectedSignature = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).json({ ok: false, message: "Invalid Paystack signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));

    const supportedEvents = new Set([
      "transfer.success",
      "transfer.failed",
      "charge.success",
      "charge.failed",
      "refund.processed",
    ]);

    if (!supportedEvents.has(event?.event)) {
      return res.status(200).json({ ok: true, message: "Webhook ignored" });
    }

    const result = await recordWebhookTransaction(event);
    if (!result?.ok) {
      return res.status(400).json({ ok: false, message: result?.message || "Unable to process webhook" });
    }

    return res.status(200).json({ ok: true, message: "Webhook processed" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

export { paystackWebhook };
