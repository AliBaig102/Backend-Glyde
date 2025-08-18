import { Router } from 'express';
import { TestController } from '@/controllers/index';
import { validate } from '@/middleware/validation';
import {
  createTestSchema,
  deleteTestSchema,
  getAllTestsSchema,
  getTestByIdSchema,
  updateTestSchema,
} from '@/validations/test.validation';

const router = Router();

/**
 * @route   GET /api/v1/tests
 * @desc    Get all test records with pagination and search
 * @access  Public (can be changed to protected later)
 * @query   page, limit, search, sortBy, sortOrder
 */
router.get('/', validate(getAllTestsSchema), TestController.getAllTests);

/**
 * @route   GET /api/v1/tests/:id
 * @desc    Get a single test record by ID
 * @access  Public (can be changed to protected later)
 * @param   id - MongoDB ObjectId
 */
router.get('/:id', validate(getTestByIdSchema), TestController.getTestById);

/**
 * @route   POST /api/v1/tests
 * @desc    Create a new test record
 * @access  Public (can be changed to protected later)
 * @body    firstName, lastName
 */
router.post('/', validate(createTestSchema), TestController.createTest);

/**
 * @route   PUT /api/v1/tests/:id
 * @desc    Update a test record by ID
 * @access  Public (can be changed to protected later)
 * @param   id - MongoDB ObjectId
 * @body    firstName?, lastName? (at least one required)
 */
router.put('/:id', validate(updateTestSchema), TestController.updateTest);

/**
 * @route   DELETE /api/v1/tests/:id
 * @desc    Delete a test record by ID
 * @access  Public (can be changed to protected later)
 * @param   id - MongoDB ObjectId
 */
router.delete('/:id', validate(deleteTestSchema), TestController.deleteTest);

export default router;
