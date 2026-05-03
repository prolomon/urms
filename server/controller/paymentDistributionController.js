import { prisma } from "../config/db.js";
import { paymentDistributionSchema } from '../validator/paymentDistributionValidator.js';

const calculatePaymentDistribution = async (req, res) => {
  try {

    console.log(req.body)
    // Validate the incoming percentage distribution
    const { error, value } = paymentDistributionSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const { main, agent, operation, technology, userId } = value;

    // Validate that percentages add up to 100
    const totalPercentage = main + agent + operation + technology;
    if (totalPercentage !== 100) {
      return res.status(400).json({
        ok: false,
        message: 'Percentages must add up to 100. Current total: ' + totalPercentage,
      });
    }

    // Get all payments from the database
    const allPayments = await prisma.payment.findMany({
      where: {
        center: userId,
      },
    }, {
      select: {
        amount: true,
      },
    });

    // Calculate distribution for each category
    let distribution = {
      main: 0,
      agent: 0,
      operation: 0,
      technology: 0,
    };

    // Divide each payment amount by the percentages and sum them up
    allPayments.forEach(payment => {
      distribution.main += (payment.amount * main) / 100;
      distribution.agent += (payment.amount * agent) / 100;
      distribution.operation += (payment.amount * operation) / 100;
      distribution.technology += (payment.amount * technology) / 100;
    });

    // Round to 2 decimal places
    distribution.main = Math.round(distribution.main * 100) / 100;
    distribution.agent = Math.round(distribution.agent * 100) / 100;
    distribution.operation = Math.round(distribution.operation * 100) / 100;
    distribution.technology = Math.round(distribution.technology * 100) / 100;

    return res.status(200).json({
      ok: true,
      message: 'Payment distribution calculated successfully',
      data: distribution,
      meta: {
        totalPaymentsProcessed: allPayments.length,
        percentageDistribution: {
          main,
          agent,
          operation,
          technology,
        },
        totalAmount: distribution.main + distribution.agent + distribution.operation + distribution.technology,
      },
    });
  } catch (err) {
    console.error('Calculate payment distribution error:', err);
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const getDistributionWithFilters = async (req, res) => {
  try {
    // Validate the incoming percentage distribution
    const { error, value } = paymentDistributionSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const { main, agent, operation, technology, userId } = value;
    const { status, startDate, endDate } = req.query;

    // Validate that percentages add up to 100
    const totalPercentage = main + agent + operation + technology;
    if (totalPercentage !== 100) {
      return res.status(400).json({
        ok: false,
        message: 'Percentages must add up to 100. Current total: ' + totalPercentage,
      });
    }

    // Build where clause
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Get filtered payments
    const filteredPayments = await prisma.payment.findMany({
      where: whereClause,
      select: {
        amount: true,
      },
    });

    // Calculate distribution for each category
    let distribution = {
      main: 0,
      agent: 0,
      operation: 0,
      technology: 0,
    };

    // Divide each payment amount by the percentages and sum them up
    filteredPayments.forEach(payment => {
      distribution.main += (payment.amount * main) / 100;
      distribution.agent += (payment.amount * agent) / 100;
      distribution.operation += (payment.amount * operation) / 100;
      distribution.technology += (payment.amount * technology) / 100;
    });

    // Round to 2 decimal places
    distribution.main = Math.round(distribution.main * 100) / 100;
    distribution.agent = Math.round(distribution.agent * 100) / 100;
    distribution.operation = Math.round(distribution.operation * 100) / 100;
    distribution.technology = Math.round(distribution.technology * 100) / 100;

    return res.status(200).json({
      ok: true,
      message: 'Filtered payment distribution calculated successfully',
      data: distribution,
      meta: {
        totalPaymentsProcessed: filteredPayments.length,
        percentageDistribution: {
          main,
          agent,
          operation,
          technology,
        },
        filters: {
          status: status || 'all',
          startDate: startDate || null,
          endDate: endDate || null,
        },
        totalAmount: distribution.main + distribution.agent + distribution.operation + distribution.technology,
      },
    });
  } catch (err) {
    console.error('Get filtered distribution error:', err);
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

export {
  calculatePaymentDistribution,
  getDistributionWithFilters,
};
