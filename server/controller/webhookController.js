import crypto from "crypto";
import { recordWebhookTransaction } from "./transactionController.js";
import { prisma } from "../config/db.js";

/**
 * Handle Nomba webhook events.
 * Expected payload example (truncated):
 * {
 *  "event_type": "payment_success",
 *  "requestId": "...",
 *  "data": { transaction: { aliasAccountReference: "122320250916PM", transactionAmount: 120, ... }, ... }
 * }
 */
const nombaWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (!event || typeof event !== 'object') {
      return res.status(400).json({ ok: false, message: 'Invalid payload' });
    }

    const type = String(event.event_type || '').trim();
    if (!type || type !== 'payment_success') {
      return res.status(200).json({ ok: true, message: 'Ignored event' });
    }

    const txn = event.data?.transaction || {};
    const aliasRef = txn?.aliasAccountReference || txn?.aliasAccountNumber || null;
    const amount = Number(txn?.transactionAmount ?? 0);
    const requestId = event.requestId || txn?.transactionId || null;

    if (!aliasRef) {
      return res.status(400).json({ ok: false, message: 'Missing aliasAccountReference' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: 'Invalid transaction amount' });
    }

    // Try to find wallet by common fields: accountNo, identification, accountName
    const wallet = await prisma.wallet.findFirst({
      where: {
        OR: [
          { accountNo: aliasRef },
          { identification: aliasRef },
          { accountName: aliasRef },
        ],
      },
    });

    if (!wallet) {
      // As fallback, check bank json for a matching alias reference
      const allWallets = await prisma.wallet.findMany({ select: { id: true, userId: true, accountNo: true, bank: true, balance: true } });
      let foundWallet = null;
      for (const w of allWallets) {
        try {
          const bank = w.bank || {};
          if (typeof bank === 'object') {
            // check common properties
            if (String(bank.aliasAccountReference || bank.reference || bank.alias || '').toLowerCase() === String(aliasRef).toLowerCase()) {
              foundWallet = w;
              break;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      if (foundWallet) {
        wallet = foundWallet;
      }
    }

    if (!wallet) {
      // Could not find a wallet to credit; record transaction and return
      await prisma.transaction.create({
        data: {
          reference: requestId || txn?.transactionId || 'nomba-' + Date.now(),
          event: 'nomba.payment_success',
          status: 'PENDING',
          amount,
          currency: 'NGN',
          channel: txn?.type || null,
          gatewayResponse: JSON.stringify(txn || {}),
          customerEmail: event.data?.customer?.email || null,
          paymentReference: null,
          userId: event.data?.merchant?.userId || null,
          metadata: event,
          rawPayload: event,
        },
      }).catch(() => null);

      return res.status(200).json({ ok: false, message: 'No matching wallet found' });
    }

    // Update wallet balance atomically
    const newBalance = Number(wallet.balance ?? 0) + Number(amount);

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        reference: requestId || txn?.transactionId || `nomba-${Date.now()}`,
        event: 'nomba.payment_success',
        status: 'SUCCESS',
        amount,
        currency: 'NGN',
        channel: txn?.type || null,
        gatewayResponse: JSON.stringify(txn || {}),
        customerEmail: event.data?.customer?.accountNumber || null,
        paymentReference: null,
        userId: wallet.userId || event.data?.merchant?.userId || null,
        metadata: event,
        rawPayload: event,
      },
    }).catch(() => null);

    // Notify the owner
    if (wallet.userId) {
      await prisma.notification.create({
        data: {
          userId: wallet.userId,
          title: 'Wallet Credited',
          description: `Your wallet (${wallet.accountNo || wallet.id}) was credited with ${amount}. New balance: ${newBalance}.`,
          type: 'SUCCESS',
          date: new Date(),
        },
      }).catch(() => null);
    }

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
