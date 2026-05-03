import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Prisma 7 may default to the "client" engine in some setups, which requires adapters.
// This API uses direct PostgreSQL connections, so force the binary engine.
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

let prisma;
let prismaPool;
let isConnected = false;

const initializePrisma = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    
    if (!prisma) {
      const { PrismaClient } = await import("@prisma/client");
      prismaPool = new Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaPg(prismaPool);
      prisma = new PrismaClient({
        adapter,
        log: ['error', 'warn'],
      });
      console.log('Prisma Client initialized successfully');
    }
    
    return prisma;
  } catch (err) {
    console.error('Failed to initialize Prisma Client:', err);
    throw err;
  }
};

const connectPrisma = async () => {
  try {
    if (!prisma) {
      await initializePrisma();
    }
    
    if (!isConnected) {
      await prisma.$connect();
      isConnected = true;
      console.log('Prisma Client connected to database');
    }
    
    return prisma;
  } catch (err) {
    console.error('Failed to connect Prisma Client:', err);
    isConnected = false;
    throw err;
  }
};

const disconnectPrisma = async () => {
  try {
    if (prisma && isConnected) {
      await prisma.$disconnect();
      if (prismaPool) {
        await prismaPool.end();
        prismaPool = undefined;
      }
      isConnected = false;
      console.log('Prisma Client disconnected');
    }
  } catch (err) {
    console.error('Error disconnecting Prisma Client:', err);
  }
};

// Initialize immediately
connectPrisma().catch(err => {
  console.error('Critical error initializing Prisma:', err.message);
  console.log('Server will start but database operations may fail until connection is established');
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await disconnectPrisma();
});

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});

export { prisma, connectPrisma, disconnectPrisma };