import crypto from "crypto";
import { recordWebhookTransaction } from "./transactionController.js";
import { prisma } from "../config/db.js";

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
    const merchantUserId = merchant?.userId || null;
    const walletId = merchant?.walletId || null;

    if (!aliasRef) {
      return res.status(400).json({ ok: false, message: 'Missing identifying information (aliasRef)' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: 'Invalid transaction amount' });
    }

    let wallet = null;

    if (walletId) {
      wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
      });
      console.log('Strategy 1 (merchant.walletId):', wallet ? 'Found' : 'Not found');
    }

    if (!wallet && merchantUserId) {
      wallet = await prisma.wallet.findFirst({
        where: { userId: txn?.aliasAccountReference },
      });
      console.log('Strategy 2 (merchant.userId):', wallet ? 'Found' : 'Not found');
    }

    if (!wallet && aliasRef) {
      wallet = await prisma.wallet.findFirst({
        where: {      
          OR: [
            { accountNo: txn?.aliasAccountNumber },
            { accountName: txn?.aliasAccountName },
            { identification: aliasRef },
            { bank: { path: ['id'], equals: txn?.aliasAccountReference } },
          ],
        },
      });
      console.log('Strategy 3 (alias/reference fallback):', wallet ? 'Found' : 'Not found');
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
