import { RoleType } from '../constants';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        email: string;
        role: RoleType;
        permissions: string[];
      };
    }
  }
}
