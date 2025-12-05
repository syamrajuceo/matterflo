import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Track connection status
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

/**
 * Connect to database with retry logic
 */
export async function connectDatabase(retries = 5, delayMs = 2000): Promise<void> {
  // If already connected, return immediately
  if (isConnected) {
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection attempt
  connectionPromise = (async () => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await prisma.$connect();
        isConnected = true;
        console.log('✅ Database connected successfully');
        connectionPromise = null;
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, errorMessage);
        
        if (attempt < retries) {
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          console.error('❌ Database connection failed after all retries');
          isConnected = false;
          connectionPromise = null;
          throw error;
        }
      }
    }
  })();

  return connectionPromise;
}

/**
 * Check if database is connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!isConnected) {
    return false;
  }

  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    // Connection lost, update status
    isConnected = false;
    return false;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  isConnected = false;
  connectionPromise = null;
  await prisma.$disconnect();
}

export { prisma };

