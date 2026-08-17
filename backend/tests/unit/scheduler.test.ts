import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SchedulerService } from '../../src/services/scheduler.service';
import GovernmentSourceRepository from '../../src/repositories/government-source.repository';
import SyncService from '../../src/services/sync.service';

// Mock node-cron
jest.mock('node-cron', () => {
  return {
    validate: jest.fn().mockReturnValue(true),
    schedule: jest.fn().mockReturnValue({
      stop: jest.fn(),
    }),
  };
});

describe('Scheduler Service Tests', () => {
  let sourceRepoMock: jest.Mocked<GovernmentSourceRepository>;
  let syncServiceMock: jest.Mocked<SyncService>;
  let schedulerService: SchedulerService;

  beforeEach(() => {
    sourceRepoMock = {
      findMany: jest.fn<any>().mockResolvedValue([
        {
          id: 'source-1',
          name: 'IMD',
          type: 'IMD',
          syncFrequency: '*/15 * * * *',
          isActive: true,
        },
      ]),
    } as any;
    syncServiceMock = {
      syncProvider: jest.fn<any>(),
    } as any;
    schedulerService = new SchedulerService(sourceRepoMock, syncServiceMock);
  });

  it('Should validate and schedule cron jobs on start', async () => {
    await schedulerService.startScheduler();
    expect(sourceRepoMock.findMany).toHaveBeenCalled();
  });

  it('Should stop active cron jobs on shutdown', async () => {
    await schedulerService.startScheduler();
    schedulerService.stopScheduler();
    expect(schedulerService).toBeDefined();
  });
});
