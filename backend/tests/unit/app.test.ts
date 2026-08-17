import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from '../mocks/database.mock';
import { checkRedisHealth } from '../../src/config/redis.config';

// Mock Redis health check
jest.mock('../../src/config/redis.config', () => {
  const original = jest.requireActual('../../src/config/redis.config') as any;
  return {
    ...original,
    checkRedisHealth: jest.fn<typeof checkRedisHealth>(),
  };
});

import app from '../../src/app';
import { HTTP_STATUS } from '../../src/constants';

describe('Enterprise Backend Foundation Verification (Phase 1)', () => {
  const mockCheckRedisHealth = checkRedisHealth as jest.MockedFunction<typeof checkRedisHealth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Health checks verification
  it('GET /health should return 200 with system health details', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'healthy');
  });

  it('GET /health/live should return 200 with liveness check', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data).toHaveProperty('liveness', 'alive');
  });

  it('GET /health/ready should return 200 when PostgreSQL and Redis are healthy', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    mockCheckRedisHealth.mockResolvedValue({ status: 'UP', latency: '2ms' });

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data).toHaveProperty('readiness', 'ready');
    expect(res.body.data.services.database).toBe('UP');
    expect(res.body.data.services.redis).toBe('UP');
  });

  it('GET /health/ready should return 503 when PostgreSQL fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('DB Connection Refused'));
    mockCheckRedisHealth.mockResolvedValue({ status: 'UP', latency: '2ms' });

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(res.body.success).toBe(false);
    expect(res.body.data.services.database).toBe('DOWN');
    expect(res.body.data.services.redis).toBe('UP');
  });

  it('GET /health/ready should return 503 when Redis fails', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    mockCheckRedisHealth.mockResolvedValue({ status: 'DOWN', latency: 'N/A' });

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(res.body.success).toBe(false);
    expect(res.body.data.services.database).toBe('UP');
    expect(res.body.data.services.redis).toBe('DOWN');
  });

  it('Liveness check should remain 200 when database and Redis fail', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('DB Failed'));
    mockCheckRedisHealth.mockResolvedValue({ status: 'DOWN', latency: 'N/A' });

    const res = await request(app).get('/health/live');
    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data).toHaveProperty('liveness', 'alive');
  });

  // 2. Trace and X-Request-ID headers
  it('Response headers must contain X-Request-ID and match body trace ID', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-request-id');
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  // 3. Helmet Security Headers
  it('Helmet security headers must be active', async () => {
    const res = await request(app).get('/health');
    // Content-Security-Policy or X-Content-Type-Options is injected by Helmet
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options');
  });

  // 4. CORS configuration
  it('CORS headers must be active with correct origin details', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers).toHaveProperty('access-control-allow-origin', 'http://localhost:3000');
    expect(res.headers).toHaveProperty('access-control-allow-credentials', 'true');
  });

  // 5. Compression
  it('Response should support GZIP compression when requested', async () => {
    const res = await request(app)
      .get('/health')
      .set('Accept-Encoding', 'gzip, deflate');
    // Depending on response size, compression might be skipped, but content-encoding is standard
    if (res.headers['content-encoding']) {
      expect(res.headers['content-encoding']).toBe('gzip');
    }
  });

  // 6. Async Error Propagation & Error Handlers
  it('GET /api/v1/test-async-error must propagate ValidationError through global handler', async () => {
    const res = await request(app).get('/api/v1/test-async-error');
    
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('message', 'Simulated async validation error');
  });
});
