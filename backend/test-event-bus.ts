import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './src/common/config/database.config';
import { closeRedisClient } from './src/common/config/redis.config';
import { eventPublisher } from './src/modules/triggers/events/event.publisher';
import { TriggerEventConsumer } from './src/modules/triggers/events/event.consumer';
import { prisma } from './src/common/config/database.config';

// Load environment variables
dotenv.config();

/**
 * Test Event Bus System
 * 
 * This script tests the Event Bus by:
 * 1. Starting the event consumer
 * 2. Publishing a test event
 * 3. Waiting for processing
 * 4. Checking trigger execution logs in the database
 * 
 * Run: ts-node test-event-bus.ts
 * 
 * Prerequisites:
 * - Redis server running (default: redis://localhost:6379)
 * - Database connection configured
 * - At least one trigger created in the database
 */

async function test() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Event Bus Test Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected\n');

    // Check if there are any triggers in the database
    const triggerCount = await prisma.trigger.count({
      where: { isActive: true },
    });

    if (triggerCount === 0) {
      console.warn('⚠️  No active triggers found in database');
      console.warn('   Create a trigger first to test event processing');
      console.warn('   You can use the trigger API or create one manually\n');
    } else {
      console.log(`✅ Found ${triggerCount} active trigger(s) in database\n`);
    }

    // Start consumer
    console.log('🚀 Starting event consumer...');
    const consumer = new TriggerEventConsumer();
    
    // Start consumer in background (non-blocking)
    consumer.start().catch((error) => {
      console.error('❌ Consumer error:', error);
    });

    // Give consumer a moment to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('✅ Consumer started\n');

    // Publish event
    console.log('📤 Publishing test event...');
    const taskId = 'test_task_123';
    const messageId = await eventPublisher.publishTaskCompleted(taskId, {
      taskId,
      taskExecutionId: 'test_execution_456',
      executorId: 'test_user_789',
      submittedData: {
        amount: 15000,
        category: 'Travel',
        description: 'Test travel expense',
      },
    });
    console.log(`✅ Event published (Message ID: ${messageId})\n`);

    // Wait for processing
    console.log('⏳ Waiting for event processing (2 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('✅ Processing complete\n');

    // Check trigger execution logs
    console.log('📊 Checking trigger execution logs...\n');
    
    const executions = await prisma.triggerExecution.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' },
      include: {
        trigger: {
          select: {
            id: true,
            name: true,
            eventType: true,
          },
        },
      },
    });

    if (executions.length === 0) {
      console.log('ℹ️  No trigger executions found');
      console.log('   This could mean:');
      console.log('   - No triggers match the event type');
      console.log('   - Trigger conditions were not met');
      console.log('   - Consumer is still processing\n');
    } else {
      console.log(`✅ Found ${executions.length} execution(s):\n`);
      
      executions.forEach((execution, index) => {
        console.log(`   ${index + 1}. Trigger: ${execution.trigger.name}`);
        console.log(`      Event Type: ${execution.trigger.eventType}`);
        console.log(`      Status: ${execution.status}`);
        console.log(`      Conditions Met: ${execution.conditionsMet ? 'Yes' : 'No'}`);
        console.log(`      Execution Time: ${execution.executionTime}ms`);
        if (execution.errorMessage) {
          console.log(`      Error: ${execution.errorMessage}`);
        }
        console.log(`      Executed: ${execution.executedAt.toISOString()}`);
        console.log('');
      });
    }

    // Check for recent executions (last 5 seconds)
    const recentExecutions = executions.filter(
      (exec) => Date.now() - exec.executedAt.getTime() < 5000
    );

    if (recentExecutions.length > 0) {
      console.log('✅ Recent executions found - Event Bus is working!\n');
    } else {
      console.log('ℹ️  No recent executions found');
      console.log('   Wait a few more seconds and check again\n');
    }

    // Stop consumer
    console.log('🛑 Stopping consumer...');
    await consumer.stop();
    // Give consumer time to fully stop
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log('✅ Consumer stopped\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up...');
    await closeRedisClient();
    await disconnectDatabase();
    console.log('✅ Cleanup complete');
    process.exit(0);
  }
}

// Run test
test();

