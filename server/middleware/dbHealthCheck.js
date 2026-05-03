import { prisma, connectPrisma } from "../config/db.js";

const HEALTH_CHECK_SUCCESS_CACHE_MS = Math.max(
  1000,
  Number.parseInt(process.env.DB_HEALTH_CHECK_SUCCESS_CACHE_MS || '30000', 10) || 30000,
);

const HEALTH_CHECK_FAILURE_CACHE_MS = Math.max(
  500,
  Number.parseInt(process.env.DB_HEALTH_CHECK_FAILURE_CACHE_MS || '3000', 10) || 3000,
);

let lastHealthCheck = {
  checkedAt: 0,
  ok: false,
  errorMessage: null,
};

let healthCheckInFlight = null;

const runHealthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    lastHealthCheck = {
      checkedAt: Date.now(),
      ok: true,
      errorMessage: null,
    };
  } catch (err) {
    lastHealthCheck = {
      checkedAt: Date.now(),
      ok: false,
      errorMessage: err?.message || 'Unknown database error',
    };
    throw err;
  } finally {
    healthCheckInFlight = null;
  }
};

const checkDatabaseConnection = async (req, res, next) => {
  try {
    // Login routes already do a DB query; skip an extra health probe to reduce pool pressure.
    if (req.method === 'POST' && /\/(admin|member|agent)\/login\/?$/.test(req.path)) {
      return next();
    }

    if (!prisma) {
      console.warn('[DB Health Check] Prisma client is undefined, attempting lazy initialization');
      await connectPrisma();
    }

    if (!prisma) {
      console.error('[DB Health Check] Prisma client is still undefined after initialization attempt');
      return res.status(503).json({
        ok: false,
        message: 'Database service unavailable - Prisma client not initialized',
      });
    }

    const now = Date.now();
    const hasCachedResult = lastHealthCheck.checkedAt > 0;
    const cacheWindow = lastHealthCheck.ok ? HEALTH_CHECK_SUCCESS_CACHE_MS : HEALTH_CHECK_FAILURE_CACHE_MS;
    const isCacheFresh = hasCachedResult && (now - lastHealthCheck.checkedAt) < cacheWindow;

    if (isCacheFresh) {
      if (lastHealthCheck.ok) {
        return next();
      }

      return res.status(503).json({
        ok: false,
        message: 'Database service temporarily unavailable',
        error: process.env.NODE_ENV === 'development' ? lastHealthCheck.errorMessage : undefined,
      });
    }

    if (!healthCheckInFlight) {
      healthCheckInFlight = runHealthCheck();
    }

    await healthCheckInFlight;
    
    next();
  } catch (err) {
    console.error('[DB Health Check] Database connection failed:', err.message);
    return res.status(503).json({ 
      ok: false, 
      message: 'Database service temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export { checkDatabaseConnection };
