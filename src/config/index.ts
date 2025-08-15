// Configuration barrel export
// Export all configuration modules from this file for easy importing

// Database configuration
export * from './database';

// Authentication and security
export * from './jwt';
export * from './passport';

// External services
export * from './cloudinary';
export * from './redis';
export * from './email';

// Environment configuration
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env['PORT'] || '3000', 10),
    host: process.env['HOST'] || 'localhost',
    nodeEnv: process.env['NODE_ENV'] || 'development',
  },

  // Database configuration
  database: {
    uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/glyde-dev',
    testUri:
      process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/glyde-test',
  },

  // CORS configuration
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: process.env['CORS_CREDENTIALS'] === 'true',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
    allowedMimeTypes: process.env['ALLOWED_MIME_TYPES']?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
  },

  // Security configuration
  security: {
    bcryptSaltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12', 10),
    passwordMinLength: parseInt(process.env['PASSWORD_MIN_LENGTH'] || '8', 10),
    maxLoginAttempts: parseInt(process.env['MAX_LOGIN_ATTEMPTS'] || '5', 10),
    lockoutDuration: parseInt(process.env['LOCKOUT_DURATION'] || '900000', 10), // 15 minutes
  },

  // Session configuration
  session: {
    secret: process.env['SESSION_SECRET'] || 'your-session-secret',
    maxAge: parseInt(process.env['SESSION_MAX_AGE'] || '86400000', 10), // 24 hours
    secure: process.env['SESSION_SECURE'] === 'true',
    httpOnly: process.env['SESSION_HTTP_ONLY'] !== 'false',
  },

  // WebSocket configuration
  websocket: {
    cors: {
      origin: process.env['WEBSOCKET_CORS_ORIGIN'] || 'http://localhost:3000',
      credentials: process.env['WEBSOCKET_CORS_CREDENTIALS'] === 'true',
    },
  },

  // Logging configuration
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    dir: process.env['LOG_DIR'] || 'logs',
    toFile: process.env['LOG_TO_FILE'] === 'true',
    maxFiles: parseInt(process.env['LOG_MAX_FILES'] || '5', 10),
    maxSize: process.env['LOG_MAX_SIZE'] || '10m',
  },

  // Application URLs
  urls: {
    frontend: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    backend: process.env['BACKEND_URL'] || 'http://localhost:3000',
    api: process.env['API_URL'] || 'http://localhost:3000/api',
  },

  // API Keys (for external services)
  apiKeys: {
    openai: process.env['OPENAI_API_KEY'],
    stripe: process.env['STRIPE_SECRET_KEY'],
    sendgrid: process.env['SENDGRID_API_KEY'],
  },
};

// Validate required environment variables
export const validateConfig = (): void => {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};
