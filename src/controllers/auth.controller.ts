import { Request, Response } from 'express';
import { logger, ResponseUtil } from '@/utils';
import User from '@/models/User.model';
import { emailManager, generateTokens } from '@/config';

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
        return ResponseUtil.error(res, 'User already exists', 400);
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
      const isEmailSent = await emailManager.sendEmailVerification(
        email,
        `${firstName} ${lastName}`,
        otp.code
      );
      if (!isEmailSent) {
        logger.error('Unable to send the verification email', {
          email,
        });
        return ResponseUtil.error(res, 'Email verification failed', 400);
      }
      logger.info('OTP sent to email', {
        email,
        otp: otp.code,
      });
      return ResponseUtil.success(res, { email }, 'OTP sent to email');
    } catch (error) {
      logger.error('Signup failed', error);

      return ResponseUtil.error(res, 'Signup failed');
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({
        email,
        status: 'NEED_EMAIL_VERIFICATION',
      });
      if (!user) {
        logger.error('User not found', {
          email,
        });
        return ResponseUtil.error(res, 'User not found', 400);
      }
      const isOTPValid = user.isOTPValid(otp);
      if (!isOTPValid) {
        logger.error('Invalid OTP', {
          email,
        });
        return ResponseUtil.error(res, 'Invalid OTP', 400);
      }
      user.status = 'ACTIVE';
      await user.save();
      // send welcome email
      const isEmailSent = await emailManager.sendWelcomeEmail(
        email,
        `${user.firstName} ${user.lastName}`
      );
      if (!isEmailSent) {
        logger.error('Unable to send the welcome email', {
          email,
        });
        return ResponseUtil.error(res, 'Welcome email failed', 400);
      }
      const { accessToken, refreshToken } = generateTokens({
        userId: user._id.toString(),
        role: user.role,
      });
      logger.info('Email verified', {
        email,
        accessToken,
        refreshToken,
      });
      return ResponseUtil.success(
        res,
        { user, accessToken, refreshToken },
        'Email verification successful! Welcome to Glyde'
      );
    } catch (error) {
      logger.error('Email verification failed', error);
      return ResponseUtil.error(res, 'Email verification failed');
    }
  }
}
