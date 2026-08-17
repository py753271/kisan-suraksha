import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../repositories/user.repository';
import RoleRepository from '../repositories/role.repository';
import RefreshTokenRepository from '../repositories/refresh-token.repository';
import SessionRepository from '../repositories/session.repository';
import { hashPassword, comparePassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { logger } from '../config/logger.config';
import { db } from '../config/database.config';

export class AuthService {
  private userRepo: UserRepository;
  private roleRepo: RoleRepository;
  private tokenRepo: RefreshTokenRepository;
  private sessionRepo: SessionRepository;

  constructor(
    userRepo = new UserRepository(),
    roleRepo = new RoleRepository(),
    tokenRepo = new RefreshTokenRepository(),
    sessionRepo = new SessionRepository()
  ) {
    this.userRepo = userRepo;
    this.roleRepo = roleRepo;
    this.tokenRepo = tokenRepo;
    this.sessionRepo = sessionRepo;
  }

  async register(data: any): Promise<any> {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email is already registered.');
    }

    let role = await this.roleRepo.findByName(data.roleName || 'FARMER');
    if (!role) {
      // Fallback
      role = await this.roleRepo.findByName('FARMER');
      if (!role) {
        throw new NotFoundError('Default Role not found. Please run seed script.');
      }
    }

    const passwordHash = await hashPassword(data.password);
    
    // Execute inside a database transaction for referential safety
    const newUser = await db.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash,
          roleId: role.id,
          createdBy: 'Self-Register',
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          tableName: 'user',
          recordId: user.id,
          newValues: { email: user.email, role: role.name },
          createdBy: 'System',
        },
      });

      return user;
    });

    logger.info(`User registered successfully: ${newUser.email}`);
    
    const { passwordHash: _passwordHash, ...profile } = newUser;
    return profile;
  }

  async login(credentials: any, ipAddress?: string, deviceDetails?: string): Promise<any> {
    const userWithIAM = await this.userRepo.findByEmailWithRoleAndPermissions(credentials.email);
    if (!userWithIAM) {
      throw new AuthenticationError('Invalid email or password.');
    }

    // Check account locking
    if (userWithIAM.lockUntil && userWithIAM.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((userWithIAM.lockUntil.getTime() - Date.now()) / 60000);
      throw new AuthenticationError(`Account is temporarily locked. Try again in ${minutesLeft} minutes.`);
    }

    const isMatch = await comparePassword(credentials.password, userWithIAM.passwordHash);
    if (!isMatch) {
      const attempts = userWithIAM.loginAttempts + 1;
      let lockUntil: Date | null = null;
      
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
        logger.warn(`Account locked due to consecutive failures: ${userWithIAM.email}`);
      }

      await this.userRepo.updateFailedLoginAttempts(userWithIAM.id, attempts, lockUntil);
      
      // Audit log failed login
      await db.auditLog.create({
        data: {
          userId: userWithIAM.id,
          action: lockUntil ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          tableName: 'user',
          recordId: userWithIAM.id,
          ipAddress,
          createdBy: 'System',
        },
      });

      throw new AuthenticationError('Invalid email or password.');
    }

    // Reset failed attempts upon successful login
    if (userWithIAM.loginAttempts > 0 || userWithIAM.lockUntil) {
      await this.userRepo.resetFailedLoginAttempts(userWithIAM.id);
    }

    // Create session and refresh token details in transaction
    const tokens = await db.$transaction(async (tx: any) => {
      // 1. Create session record
      const session = await tx.userSession.create({
        data: {
          userId: userWithIAM.id,
          ipAddress,
          deviceDetails,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdBy: 'AuthService',
        },
      });

      // 2. Create refresh token record
      const tokenId = uuidv4();
      const refreshTokenValue = signRefreshToken({ id: userWithIAM.id, tokenId });
      
      await tx.refreshToken.create({
        data: {
          userId: userWithIAM.id,
          token: refreshTokenValue,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: 'AuthService',
        },
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: userWithIAM.id,
          action: 'USER_LOGGED_IN',
          tableName: 'userSession',
          recordId: session.id,
          ipAddress,
          createdBy: 'System',
        },
      });

      return {
        accessToken: signAccessToken({
          id: userWithIAM.id,
          email: userWithIAM.email,
          role: userWithIAM.role.name,
          permissions: userWithIAM.role.permissions.map((rp: any) => rp.permission.name),
        }),
        refreshToken: refreshTokenValue,
      };
    });

    logger.info(`User logged in successfully: ${userWithIAM.email}`);

    const { passwordHash: _passwordHash, loginAttempts: _loginAttempts, lockUntil: _lockUntil, ...profile } = userWithIAM;
    return { user: profile, ...tokens };
  }

  async logout(refreshTokenVal: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshTokenVal);
      await db.$transaction(async (tx: any) => {
        // Invalidate token
        const dbToken = await tx.refreshToken.findUnique({
          where: { token: refreshTokenVal },
        });
        if (dbToken) {
          await tx.refreshToken.update({
            where: { id: dbToken.id },
            data: { isRevoked: true },
          });
        }

        // Write Audit Log
        await tx.auditLog.create({
          data: {
            userId: payload.id,
            action: 'USER_LOGGED_OUT',
            tableName: 'refreshToken',
            recordId: dbToken?.id || 'N/A',
            createdBy: 'System',
          },
        });
      });
    } catch (_error) {
      logger.warn('Logout processed with invalid refresh token verification.');
    }
  }

  async rotateRefreshToken(token: string, ipAddress?: string, deviceDetails?: string): Promise<any> {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (_err) {
      throw new AuthenticationError('Invalid refresh token.');
    }

    const dbToken = await this.tokenRepo.findByToken(token);
    
    // Refresh Token Reuse Detection (Token Compromise mitigation)
    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      if (dbToken && dbToken.isRevoked) {
        logger.error(`🚨 ALERT: Revoked Refresh Token Reuse Attempt! User ID: ${dbToken.userId}`);
        
        // Revoke all tokens for this compromised user session family
        await this.tokenRepo.revokeAllForUser(dbToken.userId);
        
        await db.auditLog.create({
          data: {
            userId: dbToken.userId,
            action: 'TOKEN_REUSE_DETECTED',
            tableName: 'refreshToken',
            recordId: dbToken.id,
            ipAddress,
            createdBy: 'System',
          },
        });
      }
      throw new AuthenticationError('Compromised refresh token. All active sessions revoked.');
    }

    // Revoke current token and issue new pair in a database transaction
    const userWithIAM = await this.userRepo.findById(payload.id);
    if (!userWithIAM) {
      throw new AuthenticationError('User not found.');
    }

    const userWithRole = await this.userRepo.findByEmailWithRoleAndPermissions(userWithIAM.email);

    return db.$transaction(async (tx: any) => {
      // 1. Revoke the old token
      await tx.refreshToken.update({
        where: { id: dbToken.id },
        data: { isRevoked: true },
      });

      // 2. Register new session
      await tx.userSession.create({
        data: {
          userId: userWithIAM.id,
          ipAddress,
          deviceDetails,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: 'AuthService',
        },
      });

      // 3. Issue new refresh token
      const newTokenId = uuidv4();
      const newRefreshToken = signRefreshToken({ id: userWithIAM.id, tokenId: newTokenId });

      await tx.refreshToken.create({
        data: {
          userId: userWithIAM.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: 'AuthService',
        },
      });

      const accessToken = signAccessToken({
        id: userWithRole.id,
        email: userWithRole.email,
        role: userWithRole.role.name,
        permissions: userWithRole.role.permissions.map((rp: any) => rp.permission.name),
      });

      return { accessToken, refreshToken: newRefreshToken };
    });
  }

  async changePassword(userId: string, data: any): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const isMatch = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid current password.');
    }

    const newHash = await hashPassword(data.newPassword);
    
    await db.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          version: { increment: 1 },
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          tableName: 'user',
          recordId: userId,
          createdBy: 'System',
        },
      });
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await db.$transaction(async (tx: any) => {
      await tx.userSession.deleteMany({
        where: { userId },
      });
      await tx.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'LOGOUT_ALL_DEVICES',
          tableName: 'userSession',
          recordId: userId,
          createdBy: 'System',
        },
      });
    });
    logger.info(`Logged out all devices for User ID: ${userId}`);
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepo.findByEmailWithRoleAndPermissions(
      (await this.userRepo.findById(userId))?.email || ''
    );
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    const { passwordHash: _passwordHash, ...profile } = user;
    return profile;
  }
}

export default AuthService;
