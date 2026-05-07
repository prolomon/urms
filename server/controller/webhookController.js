import crypto from "crypto";
import { recordWebhookTransaction } from "./transactionController.js";
import { prisma } from "../config/db.js";
import { sendEmail } from "../service/mail.js";

const nombaWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('Nomba webhook received:', JSON.stringify(event, null, 2));

    if (!event || typeof event !== 'object') {
      return res.status(400).json({ ok: false, message: 'Invalid payload' });
    }

    const type = String(event.event_type || '').trim();
    if (!type || type !== 'payment_success') {
      return res.status(200).json({ ok: true, message: 'Ignored event' });
    }

    const txn = event.data?.transaction || {};
    const merchant = event.data?.merchant || {};
    const aliasRef = txn?.aliasAccountReference || txn?.aliasAccountNumber || null;
    const amount = Number(txn?.transactionAmount ?? 0);


    void sendEmail(
      "taiwooyetade67@gmail.com",
      "Credited wallet",
      await accountCreation(
        "credit alert",
        "taiwooyetade67@gmail.com",
        "09046560486",
      ),
    )
      .then((result) => {
        if (!result?.ok) {
          console.error(
            "Welcome email failed:",
            result?.error || "Unknown email error",
          );
        }
      })
      .catch((error) => {
        console.error(
          "Unexpected email send failure:",
          error?.message || error,
        );
      });

    if (!aliasRef) {
      return res.status(400).json({ ok: false, message: 'Missing identifying information (aliasRef)' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: 'Invalid transaction amount' });
    }

    let wallet = null;

    // Strategy 1: Find wallet by aliasAccountReference (primary - stored in identification field or bank data)
    if (aliasRef) {
      wallet = await prisma.wallet.findFirst({
        where: {
          OR: [
            { accountNo: txn?.aliasAccountNumber },
            { accountName: txn?.aliasAccountName },
            { bank: { contains: { id: txn?.aliasAccountReference } } },
          ],
        },
      });
      console.log('Strategy 1 (aliasAccountReference direct):', wallet ? 'Found' : 'Not found');
    }

    if (!wallet) {
      console.log('No wallet found for payment, recording as PENDING');
      // Could not find a wallet to credit; record transaction and return
      await prisma.transaction.create({
        data: {
          reference: txn?.transactionId || 'nomba-' + Date.now(),
          event: 'nomba.payment_success',
          status: 'PENDING',
          amount,
          currency: 'NGN',
          channel: txn?.type || null,
          gatewayResponse: JSON.stringify(txn || {}),
          customerEmail: event.data?.customer?.accountNumber || null,
          paymentReference: aliasRef,
          userId: merchantUserId,
          metadata: event,
          rawPayload: event,
        },
      }).catch(() => null);

      return res.status(200).json({ ok: false, message: 'No matching wallet found', data: { aliasRef } });
    }

    console.log('Wallet found:', wallet.id, 'Current balance:', wallet.balance);

    // Update wallet balance atomically
    const newBalance = Number(wallet.balance ?? 0) + Number(amount);

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    console.log('Wallet updated. New balance:', newBalance);

    // Record transaction
    await prisma.transaction.create({
      data: {
        reference: txn?.transactionId || `nomba-${Date.now()}`,
        event: 'nomba.payment_success',
        status: 'SUCCESS',
        amount,
        currency: 'NGN',
        channel: txn?.type || null,
        gatewayResponse: JSON.stringify(txn || {}),
        customerEmail: event.data?.customer?.accountNumber || null,
        paymentReference: aliasRef,
        userId: wallet.userId,
        metadata: event,
        rawPayload: event,
      },
    }).catch(() => null);

    return res.status(200).json({ ok: true, message: 'Wallet credited', wallet: { id: updatedWallet.id, balance: updatedWallet.balance } });
  } catch (err) {
    console.error('Nomba webhook error:', err?.message || err);
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

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

export { paystackWebhook, nombaWebhook };
