import z from 'zod';

export const signupValidation = z.object({
  body: z.object({
    firstName: z
      .string({ message: 'First name is required' })
      .min(1, 'First name is required'),
    lastName: z
      .string({ message: 'Last name is required' })
      .min(1, 'Last name is required'),
    email: z
      .string({ message: 'Email is required' })
      .email('Invalid email address'),
    phone: z
      .string({ message: 'Phone number is required' })
      .regex(
        /^\+[1-9]\d{10,14}$/,
        'Phone number must be in E.164 format (e.g. +1234567890)'
      ),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
  }),
});
export const loginValidation = z.object({
  body: z.object({
    email: z
      .string({ message: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
  }),
});
export const verifyEmailValidation = z.object({
  body: z.object({
    email: z
      .string({ message: 'Email is required' })
      .email('Invalid email address'),
    otp: z
      .string({ message: 'OTP is required' })
      .min(6, 'OTP must be 6 characters long'),
  }),
});
