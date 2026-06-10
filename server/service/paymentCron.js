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
      // Find payments where createdAt + 30 days has passed (due for next cycle)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const duePayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            lte: thirtyDaysAgo,
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

        // Find the latest payment for the member (by due date)
        const latestPayment = await prisma.payment.findFirst({
          where: { userId: member.uid },
          orderBy: { due: 'desc' },
          select: { id: true, due: true },
        });

        // If they have a future/upcoming payment (not yet due) => skip
        if (latestPayment && new Date(latestPayment.due) > new Date()) {
          continue; // already has an upcoming payment
        }

        // If the gap between now and the latest due date is more than 1 day, skip seeding
        // (only seed when the most recent due date is within the last 24 hours or missing)
        if (latestPayment) {
          const diffMs = Date.now() - new Date(latestPayment.due).getTime();
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (diffMs > oneDayMs) {
            // gap is greater than one day, do not auto-seed
            continue;
          }
        }

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