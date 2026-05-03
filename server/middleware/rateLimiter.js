import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 3 requests per hour
  message: {
    error: 'Too many login attempts, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export {
  loginLimiter,
};
