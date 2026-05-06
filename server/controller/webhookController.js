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
    const requestId = event.requestId || txn?.transactionId || null;
    const merchantUserId = merchant?.userId || null;
    const walletId = merchant?.walletId || null;

    console.log('Webhook data:', { aliasRef, amount, requestId, merchantUserId, walletId });

    if (!aliasRef && !merchantUserId && !walletId) {
      return res.status(400).json({ ok: false, message: 'Missing identifying information (aliasRef, merchantUserId, or walletId)' });
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
            { identification: aliasRef },
            { accountNo: aliasRef },
            { accountName: aliasRef },
          ],
        },
      });
      console.log('Strategy 1 (aliasAccountReference direct):', wallet ? 'Found' : 'Not found');
    }

    // Strategy 2: Find wallet by merchantUserId
    if (!wallet && merchantUserId) {
      wallet = await prisma.wallet.findFirst({
        where: { userId: merchantUserId },
        orderBy: { createdAt: 'desc' },
      });
      console.log('Strategy 2 (merchantUserId):', wallet ? 'Found' : 'Not found');
    }

    // Strategy 3: Find wallet by walletId (if provided)
    if (!wallet && walletId) {
      wallet = await prisma.wallet.findFirst({
        where: { accountHolderId: walletId },
      });
      console.log('Strategy 3 (walletId):', wallet ? 'Found' : 'Not found');
    }

    // Strategy 4: Check bank JSON for matching alias reference
    if (!wallet && aliasRef) {
      const allWallets = await prisma.wallet.findMany({
        select: { id: true, userId: true, accountNo: true, bank: true, balance: true },
      });
      for (const w of allWallets) {
        try {
          const bank = typeof w.bank === 'string' ? JSON.parse(w.bank) : (w.bank || {});
          if (typeof bank === 'object') {
            // Check common properties
            if (
              String(bank.aliasAccountReference || bank.reference || bank.alias || '').toLowerCase() ===
              String(aliasRef).toLowerCase()
            ) {
              wallet = w;
              console.log('Strategy 4 (bank JSON match):', 'Found');
              break;
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }

    if (!wallet) {
      console.log('No wallet found for payment, recording as PENDING');
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
          customerEmail: event.data?.customer?.accountNumber || null,
          paymentReference: aliasRef,
          userId: merchantUserId,
          metadata: event,
          rawPayload: event,
        },
      }).catch(() => null);

      return res.status(200).json({ ok: false, message: 'No matching wallet found', data: { aliasRef, merchantUserId } });
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
        reference: requestId || txn?.transactionId || `nomba-${Date.now()}`,
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

    // Notify the owner
    if (wallet.userId) {
      await prisma.notification.create({
        data: {
          userId: wallet.userId,
          title: 'Wallet Credited',
          description: `Your wallet (${wallet.accountNo || wallet.id}) was credited with ₦${amount}. New balance: ₦${newBalance}.`,
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
