import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { createRecurringPaymentForPayment, createPaymentRecord } from '../controller/paymentController.js';

let paymentCronStarted = false;

export const startPaymentCron = () => {
  if (paymentCronStarted) {
    return;
  }

  paymentCronStarted = true;

  // Run hourly at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const duePayments = await prisma.payment.findMany({
        where: {
          due: {
            lte: new Date(),
          },
        },
      });

      for (const payment of duePayments) {
        await createRecurringPaymentForPayment(payment, prisma);
      }

      // Seed payments for members who have pricing but no upcoming payments
      const members = await prisma.member.findMany({
        where: { status: true },
        select: { uid: true, pricing: true, billingFrequency: true },
      });

      for (const member of members) {
        if (!member.pricing || member.pricing.length === 0) continue;

        const upcoming = await prisma.payment.findFirst({
          where: {
            userId: member.uid,
            due: { gte: new Date() },
          },
          select: { id: true },
        });

        if (upcoming) continue; // already has an upcoming payment

        // find first active pricing
        let selectedPricing = null;
        for (const pid of member.pricing || []) {
          const p = await prisma.pricing.findUnique({ where: { id: pid }, select: { id: true, price: true, status: true } });
          if (p?.status) {
            selectedPricing = p;
            break;
          }
        }

        if (!selectedPricing) continue;

        try {
          await createPaymentRecord({
            userId: member.uid,
            frequency: member.billingFrequency,
            sessions: [],
            debt: 0,
            due: new Date(),
            amount: Number(selectedPricing.price),
            payment: selectedPricing.id,
            status: 'PENDING',
            isVerify: false,
          }, prisma);
        } catch (err) {
          console.error('Failed to seed payment for member', member.uid, err?.message || err);
        }
      }
    } catch (error) {
      console.error('Payment cron error:', error?.message || error);
    }
  });
};