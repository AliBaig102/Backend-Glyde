import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Database configuration and connection management
 */

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private getConfig(): DatabaseConfig {
    const uri =
      process.env['NODE_ENV'] === 'test'
        ? process.env['MONGODB_TEST_URI'] ||
          'mongodb://localhost:27017/glyde-backend-test'
        : process.env['MONGODB_URI'] ||
          'mongodb://localhost:27017/glyde-backend';

    const options: mongoose.ConnectOptions = {
      // Connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    return { uri, options };
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const { uri, options } = this.getConfig();

      // Set up connection event listeners
      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', error => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        logger.warn('MongoDB disconnected');
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      // Connect to MongoDB
      await mongoose.connect(uri, options);
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return (
      states[mongoose.connection.readyState as keyof typeof states] || 'unknown'
    );
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Convenience function for backward compatibility
export const connectDatabase = () => databaseManager.connect();
export const disconnectDatabase = () => databaseManager.disconnect();

// Export mongoose for direct access if needed
export { mongoose };

// Export connection status checker
export const isDatabaseConnected = () => databaseManager.isConnectionActive();
