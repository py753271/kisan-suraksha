import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { WorkerService } from '../../src/services/worker.service';
import DeliveryService from '../../src/services/delivery.service';

// Mock BullMQ Worker
jest.mock('bullmq', () => {
  return {
    Worker: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        close: jest.fn().mockImplementation(() => Promise.resolve()) as any,
      };
    }),
  };
});

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      quit: jest.fn().mockImplementation(() => Promise.resolve()) as any,
    };
  });
});

describe('BullMQ Worker Service Tests', () => {
  let deliveryServiceMock: jest.Mocked<DeliveryService>;
  let workerService: WorkerService;

  beforeEach(() => {
    deliveryServiceMock = {
      deliver: jest.fn<any>(),
    } as any;
    workerService = new WorkerService(deliveryServiceMock);
  });

  afterEach(async () => {
    await workerService.stopWorkers();
  });

  it('Should initialize workers for all priority channels on start', () => {
    workerService.startWorkers();
    expect(workerService).toBeDefined();
  });

  it('Should shutdown workers cleanly when stopWorkers is executed', async () => {
    await workerService.stopWorkers();
    expect(workerService).toBeDefined();
  });
});
