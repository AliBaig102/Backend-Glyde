import { Request, Response } from 'express';
import Test from '@/models/Test.model';
import { ResponseUtil } from '@/utils/response';
import { DatabaseUtil } from '@/utils/database';

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
        ResponseUtil.conflict(
          res,
          'A test record with this name already exists'
        );
        return;
      }

      // Create new test record
      const newTest = new Test({ firstName, lastName });
      const savedTest = await newTest.save();

      ResponseUtil.created(
        res,
        { test: savedTest },
        'Test record created successfully'
      );
    } catch (error: any) {
      ResponseUtil.internalError(res, 'Failed to create test record', error);
    }
  }

  /**
   * Get all test records with pagination and search
   * @route GET /api/v1/tests
   */
  public static async getAllTests(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      await DatabaseUtil.Paginated(req, res, Test, {
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        searchFields: ['firstName', 'lastName'],
      });
    } catch (error: any) {
      ResponseUtil.internalError(res, 'Failed to retrieve test records', error);
    }
  }

  /**
   * Get a single test record by ID
   * @route GET /api/v1/tests/:id
   */
  public static async getTestById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'];

      const test = await Test.findById(id);
      if (!test) {
        ResponseUtil.notFound(res, 'Test record not found');
        return;
      }
      ResponseUtil.success(res, { test }, 'Test record retrieved successfully');
    } catch (error: any) {
      ResponseUtil.internalError(res, 'Failed to retrieve test record', error);
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

      // Check if test exists
      const existingTest = await Test.findById(id);
      if (!existingTest) {
        ResponseUtil.notFound(res, 'Test record not found');
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
          ResponseUtil.conflict(
            res,
            'A test record with this name already exists'
          );
          return;
        }
      }

      // Update the test record
      const updatedTest = await Test.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      ResponseUtil.success(
        res,
        { test: updatedTest },
        'Test record updated successfully'
      );
    } catch (error: any) {
      ResponseUtil.internalError(res, 'Failed to update test record', error);
    }
  }

  /**
   * Delete a test record by ID
   * @route DELETE /api/v1/tests/:id
   */
  public static async deleteTest(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'];

      const deletedTest = await Test.findByIdAndDelete(id);
      if (!deletedTest) {
        ResponseUtil.notFound(res, 'Test record not found');
        return;
      }
      ResponseUtil.success(res, null, 'Test record deleted successfully');
    } catch (error: any) {
      ResponseUtil.internalError(res, 'Failed to delete test record', error);
    }
  }
}
