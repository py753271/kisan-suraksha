import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env.config';
import { HTTP_STATUS } from '../constants';
import { AuthenticationError } from '../utils/errors';

export class AuthController {
  private authService: AuthService;

  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.authService.register(req.body);
    sendSuccess(res, profile, undefined, 'User registered successfully', HTTP_STATUS.CREATED);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(
      req.body,
      req.ip || 'unknown',
      req.headers['user-agent']
    );

    // Set secure HttpOnly cookie for Refresh Token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(
      res,
      { user: result.user, accessToken: result.accessToken },
      undefined,
      'Logged in successfully'
    );
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      await this.authService.logout(token);
    }
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    sendSuccess(res, null, undefined, 'Logged out successfully');
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      throw new AuthenticationError('Refresh token is required.');
    }

    const result = await this.authService.rotateRefreshToken(
      token,
      req.ip || 'unknown',
      req.headers['user-agent']
    );

    // Refresh cookies with new rotated token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { accessToken: result.accessToken }, undefined, 'Token rotated successfully');
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    await this.authService.changePassword(req.user.id, req.body);
    sendSuccess(res, null, undefined, 'Password changed successfully');
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    // Placeholder response
    sendSuccess(res, { message: 'Reset password OTP sent to registered channel (placeholder)' });
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    // Placeholder response
    sendSuccess(res, null, undefined, 'Password reset successfully (placeholder)');
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const profile = await this.authService.getUserProfile(req.user.id);
    sendSuccess(res, profile, undefined, 'Current user profile retrieved successfully');
  };
}

export default AuthController;
