import { Router } from 'express';
import { AuthController } from '@/controllers/index';
import { validate } from '@/middleware/validation';
import { signupValidation } from '@/validations/auth.validation';

const router = Router();

/**
 * @route   POST /api/v1/auth/user-signup
 * @desc    Sign up a new user
 * @access  Public
 * @body    firstName, lastName, email, password
 */

router.post('/user-signup', validate(signupValidation), AuthController.signup);
/**
 * @route   POST /api/v1/auth/user-login
 * @desc    Login a user
 * @access  Public
 * @body    email, password
 */
// router.post('/user-login', validate(loginValidation), AuthController.login);


export default router;
