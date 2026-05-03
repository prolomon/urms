const { createMemberSchema, updateMemberSchema, loginSchema } = require('./memberValidator');
const { createNotificationSchema } = require('./notificationValidator');
const { createPaymentSchema } = require('./paymentValidator');
const { paymentDistributionSchema } = require('./paymentDistributionValidator');

module.exports = {
  createMemberSchema,
  updateMemberSchema,
  loginSchema,
  createNotificationSchema,
  createPaymentSchema,
  paymentDistributionSchema,
};
