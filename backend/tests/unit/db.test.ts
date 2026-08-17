import { describe, expect, it, jest } from '@jest/globals';
import { prismaMock } from '../mocks/database.mock';
import { getCache, setCache } from '../../src/config/redis.config';

// Mock Redis calls
jest.mock('../../src/config/redis.config', () => {
  const original = jest.requireActual('../../src/config/redis.config') as any;
  return {
    ...original,
    getCache: jest.fn<typeof getCache>(),
    setCache: jest.fn<typeof setCache>(),
  };
});

describe('Database and Cache Layer Tests (Phase 2)', () => {
  
  it('Prisma Mock: Should successfully retrieve a user and match properties', async () => {
    const mockUser = {
      id: 'user-uuid-123456',
      email: 'farmer@kisansuraksha.gov.in',
      passwordHash: 'hashed-password',
      fullName: 'Raj Patel',
      phone: null,
      isEmailVerified: false,
      isMobileVerified: false,
      roleId: 'role-uuid-1',
      loginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: 'System',
      updatedBy: 'System',
      deletedBy: null,
      version: 1,
    };

    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    const result = await prismaMock.user.findFirst({
      where: { email: 'farmer@kisansuraksha.gov.in' },
    });

    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { email: 'farmer@kisansuraksha.gov.in' },
    });
  });

  it('Prisma Mock: Should create a role permission constraint successfully', async () => {
    const mockMapping = {
      roleId: 'role-uuid-1',
      permissionId: 'perm-uuid-1',
    };

    prismaMock.rolePermission.create.mockResolvedValue(mockMapping);

    const result = await prismaMock.rolePermission.create({
      data: mockMapping,
    });

    expect(result).toEqual(mockMapping);
    expect(prismaMock.rolePermission.create).toHaveBeenCalledWith({
      data: mockMapping,
    });
  });

  it('Redis Mock: Should read from and write to Redis Cache successfully', async () => {
    const mockData = { temp: 31, condition: 'Sunny' };
    const mockGet = getCache as jest.MockedFunction<typeof getCache>;
    const mockSet = setCache as jest.MockedFunction<typeof setCache>;

    mockGet.mockResolvedValue(mockData);
    mockSet.mockResolvedValue(true);

    const getResult = await getCache('weather:current:22.3:70.7');
    const setResult = await setCache('weather:current:22.3:70.7', mockData, 300);

    expect(getResult).toEqual(mockData);
    expect(setResult).toBe(true);
    expect(mockGet).toHaveBeenCalledWith('weather:current:22.3:70.7');
    expect(mockSet).toHaveBeenCalledWith('weather:current:22.3:70.7', mockData, 300);
  });
});
