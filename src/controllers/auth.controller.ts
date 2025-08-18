import { Request, Response } from 'express';
import { logger, ResponseUtil } from '@/utils';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
    //   const { email, phone, password } = req.body;
    } catch (error) {
      logger.error('Signup failed', error);

      return ResponseUtil.error(res, 'Signup failed');
    }
  }
}
