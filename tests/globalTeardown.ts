import mongoose from 'mongoose';

export default async function globalTeardown() {
  console.log('Tearing down test environment...');

  // Close mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  // Stop the in-memory MongoDB instance
  const mongod = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }

  // Clean up any other global resources
  delete (global as any).__MONGOD__;

  console.log('Test environment teardown completed.');
}