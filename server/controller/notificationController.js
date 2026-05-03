import { prisma } from "../config/db.js";
import {createNotificationSchema }from '../validator/notificationValidator.js';

const createNotification = async (req, res) => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    if (req.userId && req.userId !== value.userId) {
      return res.status(403).json({ ok: false, message: 'Forbidden: cannot create notification for another user.' });
    }

    const notification = await prisma.notification.create({
      data: value,
    });

    return res.status(201).json({ ok: true, message: 'Notification created', notification });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

const getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(403).json({ ok: false, message: 'Forbidden: cannot view notifications for another user.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ ok: true, notifications });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' });
  }
};

export {
  createNotification,
  getNotificationsByUser,
};