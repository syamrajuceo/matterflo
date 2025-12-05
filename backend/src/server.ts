import app from './app';
import { connectDatabase, disconnectDatabase } from './common/config/database.config';
import { closeRedisClient, isRedisAvailable } from './common/config/redis.config';
import { TriggerEventConsumer } from './modules/triggers/events/event.consumer';

const PORT = process.env.PORT || 3000;

// Global consumer instance
let eventConsumer: TriggerEventConsumer | null = null;

// Start server
async function startServer() {
  try {
    // Connect to database (non-blocking for Swagger UI)
    connectDatabase().catch((dbError) => {
      console.warn('⚠️  Database connection failed. Swagger UI will still be available.');
      console.warn('   Please ensure PostgreSQL is running and DATABASE_URL is correct.');
      console.warn('   Error:', (dbError as Error).message);
    });

    // Check Redis availability and start event consumer
    const redisAvailable = await isRedisAvailable();
    if (redisAvailable) {
      console.log('✅ Redis available, starting event consumer...');
      eventConsumer = new TriggerEventConsumer();
      // Start consumer in background (non-blocking)
      eventConsumer.start().catch((error) => {
        console.error('❌ Failed to start event consumer:', error);
      });
    } else {
      console.warn('⚠️  Redis not available, event consumer will not start');
      console.warn('   Triggers will not be automatically executed');
      console.warn('   Set REDIS_URL in .env to enable event processing');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');

  // Stop event consumer
  if (eventConsumer) {
    await eventConsumer.stop();
  }

  // Close Redis connection
  await closeRedisClient();

  // Disconnect from database
  await disconnectDatabase();

  console.log('✅ Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();

