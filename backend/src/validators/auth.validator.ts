import { z } from 'zod';
import { validatePasswordStrength } from '../utils/password';

const passwordStrengthSchema = z.string().refine((val) => {
  const result = validatePasswordStrength(val);
  return result.isValid;
}, {
  message: 'Password must be at least 8 characters, include uppercase, lowercase, a digit, and a special character.',
});

export const registerValidator = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional()),
    password: passwordStrengthSchema,
    roleName: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'AGRICULTURE_OFFICER', 'FARMER'])
    ).default('FARMER'),
  }),
});

export const loginValidator = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordValidator = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordValidator = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordStrengthSchema,
  }),
});

export const changePasswordValidator = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordStrengthSchema,
  }),
});
