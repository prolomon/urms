import { prisma } from "../config/db.js";
import { createPricingSchema, updatePricingSchema } from '../validator/pricingValidator.js';

const createPricing = async (req, res) => {
  try {
    const { error, value } = createPricingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        ok: false, 
        message: errors[0],
        errors: errors 
      });
    }

    const pricing = await prisma.pricing.create({
      data: {
        title: value.title,
        price: value.price,
        type: value.type,
        category: value.category,
        benefit: value.benefit,
        center: value.userId ?? null,
      },
    });

    res.status(201).json({ 
      ok: true, 
      message: 'Pricing created successfully', 
      pricing 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};
 
const getAllPricing = async (req, res) => {
  try {
    if (!prisma || !prisma.pricing) {
      return res.status(500).json({ ok: false, message: 'Database connection not available' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const type = req.query.type ? String(req.query.type) : null;
    const category = req.query.category ? String(req.query.category) : null;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where = req.query.center ? { center: String(req.params.center) } : {};
    if (type) {
      where.type = type;
    }
    if (category) {
      where.category = category;
    }

    const [pricing, total] = await Promise.all([
      prisma.pricing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pricing.count({ where }),
    ]);

    res.status(200).json({
      ok: true,
      data: pricing,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('Error in getAllPricing:', err);
    res.status(500).json({ ok: false, message: 'Server error retrieving pricing data' });
  }
};

const getPricing = async (req, res) => {
  try {
    const pricing = await prisma.pricing.findUnique({ 
      where: { id: req.params.id } 
    });
    
    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }
    
    res.status(200).json({ ok: true, pricing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const updatePricing = async (req, res) => {
  try {
    const { error, value } = updatePricingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        ok: false, 
        message: errors[0],
        errors: errors 
      });
    }

    const pricing = await prisma.pricing.update({
      where: { id: req.params.id },
      data: value,
    }); 

    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Pricing updated successfully', 
      pricing 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const deletePricing = async (req, res) => {
  try {
    const pricing = await prisma.pricing.delete({ 
      where: { id: req.params.id } 
    });

    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Pricing deleted successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const pricing = await prisma.pricing.findUnique({ 
      where: { id: req.params.id } 
    });
    
    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }

    const updatedPricing = await prisma.pricing.update({
      where: { id: req.params.id },
      data: { status: !pricing.status },
    });
    
    res.status(200).json({ ok: true, pricing, message: `Pricing status toggled to ${updatedPricing.status ? 'active' : 'inactive'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

export {
  createPricing,
  getAllPricing,
  getPricing,
  updatePricing,
  deletePricing,
  toggleStatus, 
};
