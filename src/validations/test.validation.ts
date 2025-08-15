import { commonSchemas } from '@/middleware/validation';
import { z } from 'zod';

// Base Test schema for common fields
const baseTestSchema = {
  firstName: z
    .string({ message: 'First name must be a string' })
    .min(2, 'First name must be at least 2 characters long')
    .max(50, 'First name cannot exceed 50 characters')
    .trim()
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),

  lastName: z
    .string({ message: 'Last name must be a string' })
    .min(2, 'Last name must be at least 2 characters long')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim()
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
};

// Schema for creating a new test record
export const createTestSchema = z.object({
  body: z.object(baseTestSchema),
});

// Schema for updating a test record (partial update)
export const updateTestSchema = z.object({
  params: z.object({
    id: z
      .string({ message: 'Test ID must be a string' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format'),
  }),
  body: z
    .object({
      firstName: baseTestSchema.firstName.optional(),
      lastName: baseTestSchema.lastName.optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message:
        'At least one field (firstName or lastName) must be provided for update',
    }),
});

// Schema for getting a single test record by ID
export const getTestByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ message: 'Test ID must be a string' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format'),
  }),
});

// Schema for deleting a test record
export const deleteTestSchema = z.object({
  params: z.object({
    id: commonSchemas.objectId,
  }),
});
// Schema for getting all tests with optional query parameters
export const getAllTestsSchema = z.object({
  query: z.object({
    page: z
      .union([z.string(), z.number()])
      .optional()
      .transform(val => {
        if (val === undefined) return 1;
        return typeof val === 'string' ? parseInt(val, 10) : val;
      })
      .refine(val => val > 0, 'Page must be a positive number'),

    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform(val => {
        if (val === undefined) return 10;
        return typeof val === 'string' ? parseInt(val, 10) : val;
      })
      .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),

    search: z
      .string()
      .optional()
      .transform(val => val?.trim())
      .refine(
        val => !val || val.length >= 2,
        'Search term must be at least 2 characters'
      ),

    sortBy: z
      .enum(['firstName', 'lastName', 'createdAt', 'updatedAt'])
      .optional()
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// WebSocket event schemas
export const websocketTestEventSchema = z.object({
  event: z.enum([
    'test:create',
    'test:update',
    'test:delete',
    'test:get',
    'test:getAll',
  ]),
  data: z.any().optional(),
  id: z.string().optional(),
});

// Type exports for TypeScript
export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type GetTestByIdInput = z.infer<typeof getTestByIdSchema>;
export type DeleteTestInput = z.infer<typeof deleteTestSchema>;
export type GetAllTestsInput = z.infer<typeof getAllTestsSchema>;
export type WebSocketTestEvent = z.infer<typeof websocketTestEventSchema>;
