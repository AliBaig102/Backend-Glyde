# Glyde Backend

A robust Node.js TypeScript backend application built with Express.js, following MVC architecture and best practices.

## 🚀 Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated web framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Authentication**: JWT-based authentication with refresh tokens
- **OAuth**: Google, Facebook, and GitHub OAuth integration
- **File Upload**: Cloudinary integration for file storage
- **Real-time**: Socket.io for WebSocket connections
- **Caching**: Redis for caching and session management
- **Email**: Nodemailer for email services
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Testing**: Jest with comprehensive test setup
- **Linting**: ESLint and Prettier for code quality
- **Docker**: Containerization with Docker Compose
- **Logging**: Winston for structured logging

## 📁 Project Structure

```
glyde-backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts   # MongoDB configuration
│   │   ├── jwt.ts        # JWT configuration
│   │   ├── passport.ts   # Passport.js strategies
│   │   ├── cloudinary.ts # Cloudinary configuration
│   │   ├── redis.ts      # Redis configuration
│   │   ├── email.ts      # Email configuration
│   │   └── index.ts      # Main config exports
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   │   └── logger.ts    # Logging utility
│   ├── index.ts         # Application entry point
│   └── server.ts        # Express server setup
├── tests/               # Test files
│   ├── setup.ts         # Test setup configuration
│   ├── globalSetup.ts   # Global test setup
│   ├── globalTeardown.ts # Global test teardown
│   └── example.test.ts  # Example test file
├── scripts/             # Utility scripts
│   └── mongo-init.js    # MongoDB initialization
├── logs/                # Log files (created at runtime)
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── .eslintrc.json      # ESLint configuration
├── .prettierrc         # Prettier configuration
├── .prettierignore     # Prettier ignore rules
├── tsconfig.json       # TypeScript configuration
├── jest.config.js      # Jest testing configuration
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
└── package.json        # Project dependencies and scripts
```

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Redis (optional, for caching)
- Docker (optional, for containerization)

## ⚡ Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd glyde-backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Add your MongoDB URI, JWT secrets, API keys, etc.
```

### 3. Development

```bash
# Start development server
npm run dev

# The server will start on http://localhost:3000
```

## 🐳 Docker Setup

### Development with Docker Compose

```bash
# Start all services (app, MongoDB, Redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### With Admin Tools

```bash
# Start with MongoDB Express and Redis Commander
docker-compose --profile admin up -d

# Access admin tools:
# MongoDB Express: http://localhost:8081
# Redis Commander: http://localhost:8082
```

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run build:watch      # Build with watch mode

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking
npm run check            # Run all checks (type, lint, format)

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ci          # Run tests for CI/CD

# Database
npm run db:migrate       # Run database migrations (to be implemented)
npm run db:seed          # Seed database (to be implemented)

# Utilities
npm run clean            # Clean build directory
npm run logs:clear       # Clear log files

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available environment variables. Key configurations:

- `NODE_ENV`: Environment (development/production/test)
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `REDIS_URL`: Redis connection URL
- `CLOUDINARY_*`: Cloudinary configuration
- `EMAIL_*`: Email service configuration
- `GOOGLE_*`, `FACEBOOK_*`, `GITHUB_*`: OAuth configurations

### Database

The application uses MongoDB with Mongoose ODM. Connection is managed in `src/config/database.ts`.

### Authentication

JWT-based authentication with refresh tokens. OAuth strategies for Google, Facebook, and GitHub are configured in `src/config/passport.ts`.

### File Upload

Cloudinary integration for file storage and image processing. Configuration in `src/config/cloudinary.ts`.

### Caching

Redis integration for caching and session management. Configuration in `src/config/redis.ts`.

## 🧪 Testing

The project uses Jest for testing with the following setup:

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test API endpoints and database operations
- **In-Memory Database**: MongoDB Memory Server for isolated testing
- **Mocked Services**: External services are mocked for testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Logging

Winston is used for structured logging with different levels:

- **Error**: Error messages and stack traces
- **Warn**: Warning messages
- **Info**: General information
- **Debug**: Debug information (development only)
- **HTTP**: HTTP request/response logs

Logs are written to both console and files (in production).

## 🔒 Security

Security measures implemented:

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Request validation and sanitization
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt for password hashing
- **Environment Variables**: Sensitive data in environment variables

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Production

```bash
# Build production image
docker build -t glyde-backend .

# Run production container
docker run -p 3000:3000 --env-file .env glyde-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you have any questions or need help, please:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🗺️ Roadmap

- [ ] Implement user management features
- [ ] Add API documentation with Swagger
- [ ] Implement database migrations
- [ ] Add monitoring and health checks
- [ ] Implement CI/CD pipeline
- [ ] Add more comprehensive tests
- [ ] Performance optimization
- [ ] API versioning

---

**Happy Coding! 🎉**