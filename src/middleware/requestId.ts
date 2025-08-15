import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to generate and attach a unique request ID to each request
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate a unique request ID
  const reqId = uuidv4();

  // Store it in res.locals for access in other middleware and routes
  res.locals['requestId'] = reqId;

  // Also add it to the request headers for logging purposes
  req.headers['x-request-id'] = reqId;

  // Set response header so client can track the request
  res.setHeader('X-Request-ID', reqId);

  next();
};
