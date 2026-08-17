import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { RoleType } from '../constants';

export interface JwtPayload {
  id: string; // Identifies the User ID
  email: string;
  role: RoleType;
  permissions: string[];
}

export interface RefreshTokenPayload {
  id: string; // Identifies the User ID
  tokenId: string; // Token family trace ID
}

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};
