import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/auth.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new AuthController();

router.post('/register', validate(registerValidator), asyncHandler(controller.register));
router.post('/login', validate(loginValidator), asyncHandler(controller.login));
router.post('/logout', asyncHandler(controller.logout));
router.post('/refresh-token', asyncHandler(controller.refreshToken));
router.post('/forgot-password', validate(forgotPasswordValidator), asyncHandler(controller.forgotPassword));
router.post('/reset-password', validate(resetPasswordValidator), asyncHandler(controller.resetPassword));

// Authenticated routes
router.post('/change-password', authenticate, validate(changePasswordValidator), asyncHandler(controller.changePassword));
router.get('/me', authenticate, asyncHandler(controller.me));

export default router;
