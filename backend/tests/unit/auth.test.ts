import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/password';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/utils/jwt';
import { authenticate } from '../../src/middlewares/auth.middleware';
import { hasRole, hasPermission } from '../../src/middlewares/rbac.middleware';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../../src/utils/errors';

describe('Authentication & Authorization Utilities (Phase 3)', () => {

  // 1. Password utilities
  describe('Password Crypts', () => {
    it('Should hash and successfully verify a match', async () => {
      const password = 'KisanPassword@2026';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('Should fail matching with incorrect password', async () => {
      const hash = await hashPassword('CorrectPassword123!');
      const isMatch = await comparePassword('WrongPassword123!', hash);
      expect(isMatch).toBe(false);
    });

    it('Should enforce password strength policies', () => {
      expect(validatePasswordStrength('weak').isValid).toBe(false);
      expect(validatePasswordStrength('nouppercase123!').isValid).toBe(false);
      expect(validatePasswordStrength('NoSpecialChar123').isValid).toBe(false);
      expect(validatePasswordStrength('StrongPassword123!').isValid).toBe(true);
    });
  });

  // 2. JWT Sign & Verify
  describe('JWT Security Tokens', () => {
    const mockPayload = {
      id: 'user-id-123',
      email: 'farmer@gov.in',
      role: 'FARMER' as const,
      permissions: ['alert:read', 'crop:read'],
    };

    it('Should sign and verify an Access Token successfully', () => {
      const token = signAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.permissions).toEqual(mockPayload.permissions);
    });

    it('Should sign and verify a Refresh Token successfully', () => {
      const refreshPayload = { id: 'user-id-123', tokenId: 'token-uuid-abc' };
      const token = signRefreshToken(refreshPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.id).toBe(refreshPayload.id);
      expect(decoded.tokenId).toBe(refreshPayload.tokenId);
    });
  });

  // 3. Middlewares checks
  describe('Auth & RBAC Middlewares', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {};
      nextFunction = jest.fn() as unknown as jest.MockedFunction<NextFunction>;
    });

    it('authenticate: Should throw AuthenticationError if header is missing', () => {
      mockRequest.headers = {};
      expect(() => authenticate(mockRequest as Request, mockResponse as Response, nextFunction)).toThrow(
        AuthenticationError
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('authenticate: Should authenticate and populate req.user with valid token', () => {
      const mockPayload = {
        id: 'user-id-123',
        email: 'farmer@gov.in',
        role: 'FARMER' as const,
        permissions: ['alert:read'],
      };
      const token = signAccessToken(mockPayload);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(mockPayload.id);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('hasRole: Should pass for matching role and throw for mismatched role', () => {
      mockRequest.user = {
        id: '123',
        email: 'a@b.com',
        role: 'FARMER',
        permissions: [],
      };

      const guard = hasRole(['FARMER', 'SUPER_ADMIN']);
      expect(() => guard(mockRequest as Request, mockResponse as Response, nextFunction)).not.toThrow();
      expect(nextFunction).toHaveBeenCalled();

      const invalidGuard = hasRole(['SUPER_ADMIN', 'STATE_ADMIN']);
      expect(() => invalidGuard(mockRequest as Request, mockResponse as Response, nextFunction)).toThrow(
        AuthorizationError
      );
    });

    it('hasPermission: Should pass for matching permission and throw for mismatched permission', () => {
      mockRequest.user = {
        id: '123',
        email: 'a@b.com',
        role: 'FARMER',
        permissions: ['alert:read', 'crop:read'],
      };

      const guard = hasPermission(['alert:read']);
      expect(() => guard(mockRequest as Request, mockResponse as Response, nextFunction)).not.toThrow();

      const invalidGuard = hasPermission(['alert:create']);
      expect(() => invalidGuard(mockRequest as Request, mockResponse as Response, nextFunction)).toThrow(
        AuthorizationError
      );
    });
  });
});
