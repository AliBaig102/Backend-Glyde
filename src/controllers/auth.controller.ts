import { Request, Response } from 'express';
import { logger, ResponseUtil } from '@/utils';
import User from '@/models/User.model';
import { emailManager } from '@/config';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
      const userAlreadyExists = await User.findOne({
        $or: [{ email }, { phone }],
      });
      if (userAlreadyExists) {
        logger.error('User already exists', {
          email,
          phone,
        });
        return ResponseUtil.error(res, 'User already exists',400);
      }
      const user = new User({
        firstName,
        lastName,
        email,
        phone,
        password,
        signupMethod: 'EMAIL',
        status: 'NEED_EMAIL_VERIFICATION',
      });
      const otp = user.generateOTP();
      await user.save();
      // send otp to email
      const isEmailSent = await emailManager.sendEmailVerification(email,`${firstName} ${lastName}`, otp.code);
      if (!isEmailSent) {
        logger.error('Unable to send the verification email', {
          email,
        });
        return ResponseUtil.error(res, 'Email verification failed',400);
      }
      logger.info('OTP sent to email', {
        email,
        otp: otp.code,
      });
      return ResponseUtil.success(res, 'OTP sent to email');
    } catch (error) {
      logger.error('Signup failed', error);

      return ResponseUtil.error(res, 'Signup failed');
    }
  }
}
