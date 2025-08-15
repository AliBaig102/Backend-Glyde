import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Test, { ITest } from '@/models/Test.model';
import { logger } from '@/utils/logger';
import { ResponseUtil } from '@/utils/response';
import { getAllTestsSchema } from '@/validations/test.validation';

/**
 * Test Controller
 * Handles all CRUD operations for Test model
 */
export class TestController {
  /**
   * Create a new test record
   * @route POST /api/v1/tests
   */
  public static async createTest(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName } = req.body;

      // Check if a test with the same firstName and lastName already exists
      const existingTest = await Test.findOne({ firstName, lastName });
      if (existingTest) {
        res.status(409).json({
          success: false,
          message: 'A test record with this name already exists',
          error: 'DUPLICATE_RECORD',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      // Create new test record
      const newTest = new Test({ firstName, lastName });
      const savedTest = await newTest.save();

      logger.info(`Test record created successfully`, {
        testId: savedTest._id,
        firstName,
        lastName,
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(201).json({
        success: true,
        message: 'Test record created successfully',
        data: savedTest,
        requestId: req.headers['x-request-id'] as string,
      });
    } catch (error) {
      logger.error('Error creating test record', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        requestId: req.headers['x-request-id'] as string,
      });

      ResponseUtil.internalError(res, 'Failed to create test record');
      return;
    }
  }

  /**
   * Get all test records with pagination and search
   * @route GET /api/v1/tests
   */
  public static async getAllTests(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Parse and validate query parameters
      const queryData = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 10,
        search: (req.query['search'] as string) || undefined,
        sortBy: (req.query['sortBy'] as string) || 'createdAt',
        sortOrder: (req.query['sortOrder'] as string) || 'desc',
      };

      const queryValidation = getAllTestsSchema.safeParse({
        query: queryData,
      });
      if (!queryValidation.success) {
        logger.warn('Invalid query parameters for getAllTests', {
          requestId,
          errors: queryValidation.error.issues,
        });

        const validationErrors = queryValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        ResponseUtil.badRequest(
          res,
          'Invalid query parameters',
          validationErrors
        );
        return;
      }

      const { page, limit, search, sortBy, sortOrder } =
        queryValidation.data.query;

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

      // Execute queries in parallel
      const [tests, totalCount] = await Promise.all([
        Test.find(searchQuery).sort(sortOptions).skip(skip).limit(limit).lean(),
        Test.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info(`Retrieved ${tests.length} test records`, {
        page,
        limit,
        totalCount,
        search,
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(200).json({
        success: true,
        message: 'Test records retrieved successfully',
        data: tests as ITest[],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
        requestId: req.headers['x-request-id'] as string,
      });
    } catch (error) {
      logger.error('Error retrieving test records', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test records',
        error: 'INTERNAL_SERVER_ERROR',
        requestId: req.headers['x-request-id'] as string,
      });
    }
  }

  /**
   * Get a single test record by ID
   * @route GET /api/v1/tests/:id
   */
  public static async getTestById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'];

      // Validate ObjectId format
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid test ID format',
          error: 'INVALID_ID_FORMAT',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      const test = await Test.findById(id);
      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test record not found',
          error: 'NOT_FOUND',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      logger.info(`Test record retrieved successfully`, {
        testId: id,
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(200).json({
        success: true,
        message: 'Test record retrieved successfully',
        data: test,
        requestId: req.headers['x-request-id'] as string,
      });
    } catch (error) {
      logger.error('Error retrieving test record', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        testId: req.params['id'],
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test record',
        error: 'INTERNAL_SERVER_ERROR',
        requestId: req.headers['x-request-id'] as string,
      });
    }
  }

  /**
   * Update a test record by ID
   * @route PUT /api/v1/tests/:id
   */
  public static async updateTest(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'];
      const updateData = req.body;

      // Validate ObjectId format
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid test ID format',
          error: 'INVALID_ID_FORMAT',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      // Check if test exists
      const existingTest = await Test.findById(id);
      if (!existingTest) {
        res.status(404).json({
          success: false,
          message: 'Test record not found',
          error: 'NOT_FOUND',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      // Check for duplicate name if firstName or lastName is being updated
      if (updateData.firstName || updateData.lastName) {
        const firstName = updateData.firstName || existingTest.firstName;
        const lastName = updateData.lastName || existingTest.lastName;

        const duplicateTest = await Test.findOne({
          firstName,
          lastName,
          _id: { $ne: id },
        });

        if (duplicateTest) {
          res.status(409).json({
            success: false,
            message: 'A test record with this name already exists',
            error: 'DUPLICATE_RECORD',
            requestId: req.headers['x-request-id'] as string,
          });
          return;
        }
      }

      // Update the test record
      const updatedTest = await Test.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      logger.info(`Test record updated successfully`, {
        testId: id,
        updateData,
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(200).json({
        success: true,
        message: 'Test record updated successfully',
        data: updatedTest!,
        requestId: req.headers['x-request-id'] as string,
      });
    } catch (error) {
      logger.error('Error updating test record', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        testId: req.params['id'],
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update test record',
        error: 'INTERNAL_SERVER_ERROR',
        requestId: req.headers['x-request-id'] as string,
      });
    }
  }

  /**
   * Delete a test record by ID
   * @route DELETE /api/v1/tests/:id
   */
  public static async deleteTest(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'];

      // Validate ObjectId format
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid test ID format',
          error: 'INVALID_ID_FORMAT',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      const deletedTest = await Test.findByIdAndDelete(id);
      if (!deletedTest) {
        res.status(404).json({
          success: false,
          message: 'Test record not found',
          error: 'NOT_FOUND',
          requestId: req.headers['x-request-id'] as string,
        });
        return;
      }

      logger.info(`Test record deleted successfully`, {
        testId: id,
        deletedTest: {
          firstName: deletedTest.firstName,
          lastName: deletedTest.lastName,
        },
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(200).json({
        success: true,
        message: 'Test record deleted successfully',
        data: null,
        requestId: req.headers['x-request-id'] as string,
      });
    } catch (error) {
      logger.error('Error deleting test record', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        testId: req.params['id'],
        requestId: req.headers['x-request-id'] as string,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete test record',
        error: 'INTERNAL_SERVER_ERROR',
        requestId: req.headers['x-request-id'] as string,
      });
    }
  }
}
