import { jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import db from '../../src/config/database.config';

// Mock the database client
jest.mock('../../src/config/database.config', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
  db: mockDeep<PrismaClient>(),
}));

export const prismaMock = db as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
