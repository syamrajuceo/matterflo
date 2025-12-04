import { RedisClientType } from 'redis';
import { getRedisClient } from '../../../common/config/redis.config';
import { EVENT_CHANNELS, CONSUMER_GROUP } from './event.types';

/**
 * Event Bus - Redis Streams wrapper
 * Singleton pattern for managing event streams
 */
export class EventBus {
  private static instance: EventBus;
  private client: RedisClientType | null = null;
  private consumerGroupsCreated: Set<string> = new Set();
  private isClosed: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static async getInstance(): Promise<EventBus> {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
      EventBus.instance.client = await getRedisClient();
    }
    return EventBus.instance;
  }

  /**
   * Publish event to stream
   */
  async publish(channel: string, eventType: string, data: Record<string, any>): Promise<string> {
    if (!this.client) {
      this.client = await getRedisClient();
    }

    try {
      const messageId = await this.client.xAdd(channel, '*', {
        type: eventType,
        timestamp: new Date().toISOString(),
        data: JSON.stringify(data),
      });

      console.log(`📤 Published event ${eventType} to ${channel} (ID: ${messageId})`);
      return messageId;
    } catch (error) {
      console.error(`❌ Failed to publish event to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to stream and process messages
   */
  async subscribe(
    channel: string,
    handler: (messageId: string, eventType: string, data: Record<string, any>) => Promise<void>,
    consumerName: string = 'default-consumer'
  ): Promise<void> {
    if (!this.client) {
      this.client = await getRedisClient();
    }

    // Ensure consumer group exists
    await this.createConsumerGroup(channel, CONSUMER_GROUP);

    console.log(`👂 Subscribing to ${channel} as ${consumerName}...`);

    // Process messages in a loop
    while (!this.isClosed) {
      try {
        // Read messages from stream (blocking read, wait up to 5 seconds)
        const streams = await this.client.xReadGroup(
          CONSUMER_GROUP,
          consumerName,
          {
            key: channel,
            id: '>', // Read new messages
          },
          {
            COUNT: 10, // Read up to 10 messages at a time
            BLOCK: 5000, // Block for 5 seconds if no messages
          }
        );

        if (streams && streams.length > 0) {
          for (const stream of streams) {
            if (stream.messages && stream.messages.length > 0) {
              for (const message of stream.messages) {
                try {
                  const eventType = message.message.type as string;
                  const data = JSON.parse(message.message.data as string);

                  // Process message
                  await handler(message.id, eventType, data);

                  // ACK the message
                  await this.client.xAck(channel, CONSUMER_GROUP, message.id);
                  console.log(`✅ Processed and ACKed message ${message.id} from ${channel}`);
                } catch (error) {
                  console.error(`❌ Error processing message ${message.id}:`, error);
                  // Don't ACK failed messages - they'll be retried
                  // TODO: Implement retry logic and dead letter queue
                }
              }
            }
          }
        }
      } catch (error: any) {
        // Break loop if client is closed
        if (this.isClosed || error.message?.includes('ClientClosedError') || error.message?.includes('The client is closed')) {
          console.log(`🛑 Stopping subscription to ${channel} (client closed)`);
          break;
        }

        // Handle NOGROUP error (consumer group doesn't exist)
        if (error.message?.includes('NOGROUP')) {
          console.log(`Creating consumer group for ${channel}...`);
          await this.createConsumerGroup(channel, CONSUMER_GROUP);
          continue;
        }

        console.error(`❌ Error reading from ${channel}:`, error);
        // Wait before retrying (only if not closed)
        if (!this.isClosed) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  /**
   * Create consumer group for a stream
   */
  async createConsumerGroup(channel: string, groupName: string): Promise<void> {
    if (!this.client) {
      this.client = await getRedisClient();
    }

    const key = `${channel}:${groupName}`;
    if (this.consumerGroupsCreated.has(key)) {
      return;
    }

    try {
      await this.client.xGroupCreate(channel, groupName, '0', {
        MKSTREAM: true, // Create stream if it doesn't exist
      });
      this.consumerGroupsCreated.add(key);
      console.log(`✅ Created consumer group ${groupName} for ${channel}`);
    } catch (error: any) {
      // Ignore BUSYGROUP error (group already exists)
      if (error.message?.includes('BUSYGROUP')) {
        this.consumerGroupsCreated.add(key);
        return;
      }
      throw error;
    }
  }

  /**
   * Get pending messages for a consumer
   */
  async getPendingMessages(
    channel: string,
    consumerName: string,
    count: number = 10
  ): Promise<Array<{ id: string; eventType: string; data: Record<string, any> }>> {
    if (!this.client) {
      this.client = await getRedisClient();
    }

    try {
      // xPending returns summary info about pending messages
      // For full recovery, we'd need to:
      // 1. Get pending message IDs using XPENDING with range
      // 2. Claim those messages using XCLAIM
      // 3. Read and process them
      // For now, return empty array - messages will be retried automatically
      // when consumer restarts and reads from stream
      console.log(`ℹ️  Pending message recovery not fully implemented yet`);
      return [];
    } catch (error) {
      console.error(`❌ Error getting pending messages:`, error);
      return [];
    }
  }

  /**
   * Close the event bus and stop processing
   * Note: This marks the bus as closed but doesn't close the Redis client
   * The Redis client should be closed separately via closeRedisClient()
   */
  async close(): Promise<void> {
    this.isClosed = true;
    // Don't close the client here - it might be shared
    // Just mark as closed so the subscription loop exits
  }

  /**
   * Add message to dead letter queue
   */
  async addToDeadLetterQueue(
    channel: string,
    messageId: string,
    eventType: string,
    data: Record<string, any>,
    error: string
  ): Promise<void> {
    if (!this.client) {
      this.client = await getRedisClient();
    }

    const dlqChannel = `${channel}:dlq`;

    try {
      await this.client.xAdd(dlqChannel, '*', {
        originalChannel: channel,
        originalMessageId: messageId,
        eventType,
        data: JSON.stringify(data),
        error,
        timestamp: new Date().toISOString(),
      });

      console.log(`💀 Added message ${messageId} to dead letter queue ${dlqChannel}`);
    } catch (error) {
      console.error(`❌ Failed to add to dead letter queue:`, error);
    }
  }
}

