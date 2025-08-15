import { Socket, Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import Test from '@/models/Test.model';
import { logger } from '@/utils/logger';
import { websocketTestEventSchema } from '@/validations/test.validation';

/**
 * WebSocket Service for Test operations
 * Handles real-time CRUD operations via Socket.IO
 */
export class WebSocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected via WebSocket`, {
        socketId: socket.id,
        clientIP: socket.handshake.address,
      });

      // Join test room for real-time updates
      socket.join('tests');

      // Handle test-related events
      socket.on('test:create', data => this.handleCreateTest(socket, data));
      socket.on('test:update', data => this.handleUpdateTest(socket, data));
      socket.on('test:delete', data => this.handleDeleteTest(socket, data));
      socket.on('test:get', data => this.handleGetTest(socket, data));
      socket.on('test:getAll', data => this.handleGetAllTests(socket, data));

      // Handle disconnection
      socket.on('disconnect', reason => {
        logger.info(`Client disconnected from WebSocket`, {
          socketId: socket.id,
          reason,
        });
      });

      // Handle errors
      socket.on('error', error => {
        logger.error(`WebSocket error`, {
          socketId: socket.id,
          error: error.message,
          stack: error.stack,
        });
      });
    });
  }

  /**
   * Handle create test via WebSocket
   */
  private async handleCreateTest(socket: Socket, data: any): Promise<void> {
    try {
      // Validate input
      const validation = websocketTestEventSchema.safeParse({
        event: 'test:create',
        data,
      });

      if (!validation.success) {
        socket.emit('test:error', {
          event: 'test:create',
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.issues,
        });
        return;
      }

      const { firstName, lastName } = data;

      if (!firstName || !lastName) {
        socket.emit('test:error', {
          event: 'test:create',
          error: 'MISSING_FIELDS',
          message: 'firstName and lastName are required',
        });
        return;
      }

      // Check for duplicate
      const existingTest = await Test.findOne({ firstName, lastName });
      if (existingTest) {
        socket.emit('test:error', {
          event: 'test:create',
          error: 'DUPLICATE_RECORD',
          message: 'A test record with this name already exists',
        });
        return;
      }

      // Create new test
      const newTest = new Test({ firstName, lastName });
      const savedTest = await newTest.save();

      // Emit success to sender
      socket.emit('test:created', {
        success: true,
        data: savedTest,
        message: 'Test record created successfully',
      });

      // Broadcast to all clients in tests room
      socket.to('tests').emit('test:new', {
        data: savedTest,
        message: 'New test record created',
      });

      logger.info(`Test record created via WebSocket`, {
        testId: savedTest._id,
        firstName,
        lastName,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error(`Error creating test via WebSocket`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        data,
      });

      socket.emit('test:error', {
        event: 'test:create',
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create test record',
      });
    }
  }

  /**
   * Handle update test via WebSocket
   */
  private async handleUpdateTest(socket: Socket, data: any): Promise<void> {
    try {
      const { id, ...updateData } = data;

      if (!id) {
        socket.emit('test:error', {
          event: 'test:update',
          error: 'MISSING_ID',
          message: 'Test ID is required',
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        socket.emit('test:error', {
          event: 'test:update',
          error: 'INVALID_ID',
          message: 'Invalid test ID format',
        });
        return;
      }

      // Check if test exists
      const existingTest = await Test.findById(id);
      if (!existingTest) {
        socket.emit('test:error', {
          event: 'test:update',
          error: 'NOT_FOUND',
          message: 'Test record not found',
        });
        return;
      }

      // Update test
      const updatedTest = await Test.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Emit success to sender
      socket.emit('test:updated', {
        success: true,
        data: updatedTest,
        message: 'Test record updated successfully',
      });

      // Broadcast to all clients in tests room
      socket.to('tests').emit('test:changed', {
        data: updatedTest,
        message: 'Test record updated',
      });

      logger.info(`Test record updated via WebSocket`, {
        testId: id,
        updateData,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error(`Error updating test via WebSocket`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        data,
      });

      socket.emit('test:error', {
        event: 'test:update',
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update test record',
      });
    }
  }

  /**
   * Handle delete test via WebSocket
   */
  private async handleDeleteTest(socket: Socket, data: any): Promise<void> {
    try {
      const { id } = data;

      if (!id) {
        socket.emit('test:error', {
          event: 'test:delete',
          error: 'MISSING_ID',
          message: 'Test ID is required',
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        socket.emit('test:error', {
          event: 'test:delete',
          error: 'INVALID_ID',
          message: 'Invalid test ID format',
        });
        return;
      }

      // Delete test
      const deletedTest = await Test.findByIdAndDelete(id);
      if (!deletedTest) {
        socket.emit('test:error', {
          event: 'test:delete',
          error: 'NOT_FOUND',
          message: 'Test record not found',
        });
        return;
      }

      // Emit success to sender
      socket.emit('test:deleted', {
        success: true,
        data: { id },
        message: 'Test record deleted successfully',
      });

      // Broadcast to all clients in tests room
      socket.to('tests').emit('test:removed', {
        data: { id },
        message: 'Test record deleted',
      });

      logger.info(`Test record deleted via WebSocket`, {
        testId: id,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error(`Error deleting test via WebSocket`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        data,
      });

      socket.emit('test:error', {
        event: 'test:delete',
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete test record',
      });
    }
  }

  /**
   * Handle get single test via WebSocket
   */
  private async handleGetTest(socket: Socket, data: any): Promise<void> {
    try {
      const { id } = data;

      if (!id) {
        socket.emit('test:error', {
          event: 'test:get',
          error: 'MISSING_ID',
          message: 'Test ID is required',
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        socket.emit('test:error', {
          event: 'test:get',
          error: 'INVALID_ID',
          message: 'Invalid test ID format',
        });
        return;
      }

      const test = await Test.findById(id);
      if (!test) {
        socket.emit('test:error', {
          event: 'test:get',
          error: 'NOT_FOUND',
          message: 'Test record not found',
        });
        return;
      }

      socket.emit('test:data', {
        success: true,
        data: test,
        message: 'Test record retrieved successfully',
      });

      logger.info(`Test record retrieved via WebSocket`, {
        testId: id,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error(`Error retrieving test via WebSocket`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        data,
      });

      socket.emit('test:error', {
        event: 'test:get',
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve test record',
      });
    }
  }

  /**
   * Handle get all tests via WebSocket
   */
  private async handleGetAllTests(socket: Socket, data: any): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = data || {};

      // Build search query
      const searchQuery: any = {};
      if (search) {
        searchQuery.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Execute queries
      const [tests, totalCount] = await Promise.all([
        Test.find(searchQuery).sort(sortOptions).skip(skip).limit(limit).lean(),
        Test.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      socket.emit('test:list', {
        success: true,
        data: tests,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
        message: 'Test records retrieved successfully',
      });

      logger.info(`Test records retrieved via WebSocket`, {
        count: tests.length,
        page,
        limit,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error(`Error retrieving tests via WebSocket`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id,
        data,
      });

      socket.emit('test:error', {
        event: 'test:getAll',
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve test records',
      });
    }
  }

  /**
   * Broadcast test update to all connected clients
   */
  public broadcastTestUpdate(event: string, data: any): void {
    this.io.to('tests').emit(event, data);
  }
}
