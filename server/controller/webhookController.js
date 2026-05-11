import crypto from "crypto";
// import { recordWebhookTransaction } from "./transactionController.js";
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
    const senderDetails = event.data?.customer || {};
    const customerEmail = event.data?.customer?.email || null;
    const transactionReference = txn?.transactionId || `nomba-${Date.now()}`;

    if (!aliasRef) {
      return res.status(400).json({ ok: false, message: 'Missing identifying information (aliasRef)' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: 'Invalid transaction amount' });
    }

    let wallet = null;
    let user = null;

    if (aliasRef) {
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
          reference: transactionReference,
          merchantTxRef: merchantUserId,
          event: 'nomba.payment_success',
          status: 'PENDING',
          amount,
          currency: 'NGN',
          channel: 'wallet',
          gatewayResponse: 'Wallet credit pending',
          customerEmail,
          paymentId: null,
          userId: merchantUserId,
          metadata: {
            requestId: event.requestId || null,
            role: 'MERCHANT',
            transactionType: 'CREDIT',
            creditedAmount: amount,
            senderAccountNumber: senderDetails.accountNumber || null,
            senderBankName: senderDetails.bankName || null,
            senderBankCode: senderDetails.bankCode || null,
            senderName: senderDetails.senderName || null,
            aliasAccountNumber: txn?.aliasAccountNumber || null,
            aliasAccountName: txn?.aliasAccountName || null,
            aliasAccountReference: aliasRef,
            aliasAccountType: txn?.aliasAccountType || null,
            sessionId: txn?.sessionId || null,
            transactionId: txn?.transactionId || null,
            transactionTypeName: txn?.type || null,
            narration: txn?.narration || null,
            time: txn?.time || null,
            originatingFrom: txn?.originatingFrom || null,
            merchant,
            transaction: txn,
            status: 'PENDING',
          },
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
      data: { balance: merchant.walletBalance || newBalance },
    });

    console.log('Wallet updated. New balance:', newBalance);

    // Record transaction
    const transact = await prisma.transaction.create({
      data: {
        reference: transactionReference,
        merchantTxRef: wallet.userId,
        event: 'nomba.payment.credit',
        status: 'SUCCESS',
        amount,
        currency: 'NGN',
        channel: 'wallet',
        gatewayResponse: 'Wallet credited',
        customerEmail,
        paymentId: null,
        userId: wallet.userId,
        metadata: {
          requestId: event.requestId || null,
          role: 'MERCHANT',
          transactionType: 'CREDIT',
          creditedAmount: amount,
          senderAccountNumber: senderDetails.accountNumber || null,
          senderBankName: senderDetails.bankName || null,
          senderBankCode: senderDetails.bankCode || null,
          senderName: senderDetails.senderName || null,
          aliasAccountNumber: txn?.aliasAccountNumber || null,
          aliasAccountName: txn?.aliasAccountName || null,
          aliasAccountReference: aliasRef,
          aliasAccountType: txn?.aliasAccountType || null,
          sessionId: txn?.sessionId || null,
          transactionId: txn?.transactionId || null,
          transactionTypeName: txn?.type || null,
          narration: txn?.narration || null,
          time: txn?.time || null,
          originatingFrom: txn?.originatingFrom || null,
          merchant,
          transaction: txn,
          status: 'SUCCESS',
        },
        rawPayload: event,
      },
    })

    console.log('Transaction recorded with ID:', transact);

    return res.status(200).json({ ok: true, message: 'Wallet credited', wallet: { id: updatedWallet.id, balance: updatedWallet.balance } });
  } catch (err) {
    console.error('Nomba webhook error:', err?.message || err);
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const paystackWebhook = async (req, res) => {
};

export { paystackWebhook, nombaWebhook };
