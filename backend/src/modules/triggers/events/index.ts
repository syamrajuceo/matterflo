/**
 * Event Bus System
 * 
 * This module provides:
 * - EventBus: Redis Streams wrapper for publishing and consuming events
 * - EventPublisher: Convenience functions for publishing specific event types
 * - TriggerEventConsumer: Long-running consumer that processes events and executes triggers
 * - Event types: TypeScript interfaces for all event types
 */

export { EventBus } from './event.bus';
export { eventPublisher } from './event.publisher';
export { TriggerEventConsumer } from './event.consumer';
export * from './event.types';

