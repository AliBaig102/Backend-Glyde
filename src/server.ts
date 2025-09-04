import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');

// Import configurations (will be created later)
// import { connectDatabase } from '@/config/database';
// import { setupPassport } from '@/config/passport';

// Import routes (will be created later)
// import { authRoutes } from '@/routes/auth.routes';
// import { userRoutes } from '@/routes/user.routes';
// import { fileRoutes } from '@/routes/file.routes';

// Import middleware (will be created later)
// import { errorHandler } from '@/middleware/error.middleware';
// import { notFound } from '@/middleware/notFound.middleware';

// Import services
import { WebSocketService } from '@/services/websocket.service';
import { connectDatabase } from '@/config/database';
import { authRoutes, testRoutes } from '@/routes';
// import { connectDatabase } from './config';

console.log('✅ All imports loaded successfully');
console.log('✅ About to define Server class');

class Server {
  private app: express.Application;
  private httpServer: any;
  private io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env['PORT'] || '4000', 10);
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: process.env['SOCKET_CORS_ORIGIN']?.split(',') || [
          'http://localhost:3000',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env['CORS_ORIGIN']?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
      max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (process.env['NODE_ENV'] === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Static files
    this.app.use(
      '/uploads',
      express.static(path.join(__dirname, '../uploads'))
    );

    // Passport initialization (will be uncommented when passport config is ready)
    // this.app.use(passport.initialize());
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env['NODE_ENV'],
        version: process.env['API_VERSION'] || 'v1',
      });
    });

    // API routes (will be uncommented when routes are created)
    const apiVersion = process.env['API_VERSION'] || 'v1';
    // this.app.use(`/api/${apiVersion}/auth`, authRoutes);
    // this.app.use(`/api/${apiVersion}/users`, userRoutes);
    // this.app.use(`/api/${apiVersion}/files`, fileRoutes);
    this.app.use(`/api/${apiVersion}/tests`, testRoutes);
    this.app.use(`/api/${apiVersion}/auth`, authRoutes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Welcome to Glyde Backend API',
        version: apiVersion,
        documentation: `/api/${apiVersion}/docs`,
        health: '/health',
      });
    });
  }

  private initializeSocketIO(): void {
    // Initialize WebSocket service for Test operations
    new WebSocketService(this.io);

    // Keep existing basic handlers for general room management
    this.io.on('connection', socket => {
      console.log(`Client connected: ${socket.id}`);

      // Handle disconnection
      socket.on('disconnect', reason => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      // General room management handlers
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler (will be uncommented when middleware is created)
    // this.app.use(notFound);

    // Global error handler (will be uncommented when middleware is created)
    // this.app.use(errorHandler);

    // Temporary basic error handlers
    this.app.use('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.originalUrl,
      });
    });

    this.app.use((err: any, _req: express.Request, res: express.Response) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env['NODE_ENV'] === 'development' && {
          stack: err.stack,
        }),
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database (will be uncommented when database config is ready)
      await connectDatabase();
      console.log('✅ Database connected successfully');

      // Setup passport strategies (will be uncommented when passport config is ready)
      // setupPassport();
      console.log('✅ Passport strategies configured');

      // Start the server
      this.httpServer.listen(this.port, () => {
        console.log(`🚀 Server is running on port ${this.port}`);
        console.log(`📱 Environment: ${process.env['NODE_ENV']}`);
        console.log(`🌐 API Version: ${process.env['API_VERSION'] || 'v1'}`);
        console.log(`🔗 Health check: http://localhost:${this.port}/health`);
        console.log(`📡 Socket.IO server is ready`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Create and start the server
const server = new Server();
server.start();

// Export for testing
export default server;
