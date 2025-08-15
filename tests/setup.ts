import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
if (!process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = 'test';
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set default test timeout
jest.setTimeout(10000);

// Mock external services for testing
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

// Global test utilities
global.testUtils = {
  // Add common test utilities here
  createMockUser: () => ({
    _id: 'mock-user-id',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides,
  }),
  
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  },
};

// Extend Jest matchers if needed
expect.extend({
  // Add custom matchers here if needed
});