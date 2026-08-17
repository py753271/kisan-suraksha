import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../utils/errors';

export const hasRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthorizationError('User context not established.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('You do not have the required role to access this resource.');
    }

    next();
  };
};

export const hasPermission = (allowedPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthorizationError('User context not established.');
    }

    const hasAccess = allowedPermissions.some((perm) => req.user?.permissions.includes(perm));
    if (!hasAccess) {
      throw new AuthorizationError('You do not have the required permission to perform this action.');
    }

    next();
  };
};
