import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Redis configuration and connection management
 */

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  keyPrefix?: string;
  [key: string]: any; // Allow additional properties for ioredis compatibility
}

class RedisManager {
  private static instance: RedisManager;
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public async connect(): Promise<void> {
    try {
      const config = this.getRedisConfig();

      // Main Redis client
      this.client = new Redis(config);

      // Subscriber client for pub/sub
      const subscriberConfig = { ...config };
      delete subscriberConfig.keyPrefix;
      this.subscriber = new Redis(subscriberConfig);

      // Publisher client for pub/sub
      const publisherConfig = { ...config };
      delete publisherConfig.keyPrefix;
      this.publisher = new Redis(publisherConfig);

      this.setupEventHandlers();

      // Test connection
      await this.client.ping();

      this.isConnected = true;
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }

      if (this.subscriber) {
        await this.subscriber.quit();
        this.subscriber = null;
      }

      if (this.publisher) {
        await this.publisher.quit();
        this.publisher = null;
      }

      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Redis disconnection error:', error);
      throw error;
    }
  }

  public getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  public getSubscriber(): Redis {
    if (!this.subscriber || !this.isConnected) {
      throw new Error('Redis subscriber not connected');
    }
    return this.subscriber;
  }

  public getPublisher(): Redis {
    if (!this.publisher || !this.isConnected) {
      throw new Error('Redis publisher not connected');
    }
    return this.publisher;
  }

  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  // Cache operations
  public async set(
    key: string,
    value: any,
    ttl?: number
  ): Promise<string | null> {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        return await client.setex(key, ttl, serializedValue);
      } else {
        return await client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<any> {
    try {
      const client = this.getClient();
      const value = await client.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  public async exists(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<number> {
    try {
      const client = this.getClient();
      return await client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error:', error);
      throw error;
    }
  }

  // Hash operations
  public async hset(key: string, field: string, value: any): Promise<number> {
    try {
      const client = this.getClient();
      return await client.hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis HSET error:', error);
      throw error;
    }
  }

  public async hget(key: string, field: string): Promise<any> {
    try {
      const client = this.getClient();
      const value = await client.hget(key, field);

      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error('Redis HGET error:', error);
      throw error;
    }
  }

  public async hdel(key: string, field: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.hdel(key, field);
    } catch (error) {
      logger.error('Redis HDEL error:', error);
      throw error;
    }
  }

  // Pub/Sub operations
  public async publish(channel: string, message: any): Promise<number> {
    try {
      const publisher = this.getPublisher();
      return await publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error('Redis PUBLISH error:', error);
      throw error;
    }
  }

  public async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    try {
      const subscriber = this.getSubscriber();

      subscriber.on('message', (receivedChannel: string, message: string) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            logger.error('Error parsing Redis message:', error);
            callback(message); // Fallback to raw message
          }
        }
      });

      await subscriber.subscribe(channel);
      logger.info(`Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      logger.error('Redis SUBSCRIBE error:', error);
      throw error;
    }
  }

  public async unsubscribe(channel: string): Promise<void> {
    try {
      const subscriber = this.getSubscriber();
      await subscriber.unsubscribe(channel);
      logger.info(`Unsubscribed from Redis channel: ${channel}`);
    } catch (error) {
      logger.error('Redis UNSUBSCRIBE error:', error);
      throw error;
    }
  }

  // Session operations
  public async setSession(
    sessionId: string,
    sessionData: any,
    ttl: number = 86400 // 24 hours default
  ): Promise<string | null> {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, ttl);
  }

  public async getSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  public async deleteSession(sessionId: string): Promise<number> {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  // Rate limiting operations
  public async incrementRateLimit(
    key: string,
    windowSize: number,
    limit: number
  ): Promise<{ count: number; ttl: number; allowed: boolean }> {
    try {
      const client = this.getClient();
      const current = await client.incr(key);

      if (current === 1) {
        await client.expire(key, windowSize);
      }

      const ttl = await client.ttl(key);

      return {
        count: current,
        ttl,
        allowed: current <= limit,
      };
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      throw error;
    }
  }

  private getRedisConfig(): RedisConfig {
    const config: RedisConfig = {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
      db: parseInt(process.env['REDIS_DB'] || '0', 10),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'glyde:',
    };

    if (process.env['REDIS_PASSWORD']) {
      config.password = process.env['REDIS_PASSWORD'];
    }

    return config;
  }

  private setupEventHandlers(): void {
    if (this.client) {
      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (error: any) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });
    }
  }
}

// Export singleton instance
export const redisManager = RedisManager.getInstance();

// Convenience functions
export const connectRedis = () => redisManager.connect();
export const disconnectRedis = () => redisManager.disconnect();
export const getRedisClient = () => redisManager.getClient();
export const getRedisSubscriber = () => redisManager.getSubscriber();
export const getRedisPublisher = () => redisManager.getPublisher();

// Export Redis instance for direct use
export { Redis };
