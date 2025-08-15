import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export default async function globalSetup() {
  console.log('Setting up test environment...');

  // Start in-memory MongoDB instance for testing
  const mongod = new MongoMemoryServer({
    instance: {
      port: 27017,
      dbName: 'test-db',
    },
  });

  await mongod.start();
  const uri = mongod.getUri();

  // Store the URI and instance for global teardown
  (global as any).__MONGOD__ = mongod;
  process.env['MONGODB_URI'] = uri;
  process.env['MONGODB_TEST_URI'] = uri;

  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['JWT_SECRET'] = 'test-jwt-secret';
  process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret';
  process.env['JWT_EXPIRES_IN'] = '1h';
  process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
  process.env['BCRYPT_SALT_ROUNDS'] = '10';
  process.env['PORT'] = '3001';
  process.env['CORS_ORIGIN'] = 'http://localhost:3000';
  process.env['RATE_LIMIT_WINDOW_MS'] = '900000';
  process.env['RATE_LIMIT_MAX_REQUESTS'] = '100';
  process.env['SESSION_SECRET'] = 'test-session-secret';
  process.env['CLOUDINARY_CLOUD_NAME'] = 'test-cloud';
  process.env['CLOUDINARY_API_KEY'] = 'test-api-key';
  process.env['CLOUDINARY_API_SECRET'] = 'test-api-secret';
  process.env['EMAIL_HOST'] = 'smtp.test.com';
  process.env['EMAIL_PORT'] = '587';
  process.env['EMAIL_USER'] = 'test@example.com';
  process.env['EMAIL_PASS'] = 'test-password';
  process.env['REDIS_URL'] = 'redis://localhost:6379';
  process.env['LOG_LEVEL'] = 'error';
  process.env['LOG_FILE'] = 'false';

  console.log('Test environment setup completed.');
}