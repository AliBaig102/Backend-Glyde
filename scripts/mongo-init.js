// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Switch to the application database
db = db.getSiblingDB('glyde-dev');

// Create application user with read/write permissions
db.createUser({
  user: 'glyde-user',
  pwd: 'glyde-password',
  roles: [
    {
      role: 'readWrite',
      db: 'glyde-dev'
    }
  ]
});

// Create collections with basic indexes
print('Creating collections and indexes...');

// Users collection
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ 'profile.firstName': 1, 'profile.lastName': 1 });

// Sessions collection (for session storage)
db.createCollection('sessions');
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ session_id: 1 }, { unique: true });

// Refresh tokens collection
db.createCollection('refreshtokens');
db.refreshtokens.createIndex({ token: 1 }, { unique: true });
db.refreshtokens.createIndex({ userId: 1 });
db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Password reset tokens collection
db.createCollection('passwordresettokens');
db.passwordresettokens.createIndex({ token: 1 }, { unique: true });
db.passwordresettokens.createIndex({ userId: 1 });
db.passwordresettokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Email verification tokens collection
db.createCollection('emailverificationtokens');
db.emailverificationtokens.createIndex({ token: 1 }, { unique: true });
db.emailverificationtokens.createIndex({ userId: 1 });
db.emailverificationtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Files/uploads collection
db.createCollection('files');
db.files.createIndex({ userId: 1 });
db.files.createIndex({ filename: 1 });
db.files.createIndex({ uploadedAt: 1 });
db.files.createIndex({ 'metadata.type': 1 });

// Audit logs collection
db.createCollection('auditlogs');
db.auditlogs.createIndex({ userId: 1 });
db.auditlogs.createIndex({ action: 1 });
db.auditlogs.createIndex({ timestamp: 1 });
db.auditlogs.createIndex({ 'metadata.resource': 1 });

// API keys collection
db.createCollection('apikeys');
db.apikeys.createIndex({ key: 1 }, { unique: true });
db.apikeys.createIndex({ userId: 1 });
db.apikeys.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Rate limiting collection
db.createCollection('ratelimits');
db.ratelimits.createIndex({ identifier: 1 });
db.ratelimits.createIndex({ resetTime: 1 }, { expireAfterSeconds: 0 });

print('MongoDB initialization completed successfully!');
print('Database: glyde-dev');
print('User: glyde-user created with readWrite permissions');
print('Collections and indexes created successfully');