import cron from 'node-cron';
import SyncService from './sync.service';
import GovernmentSourceRepository from '../repositories/government-source.repository';
import { logger } from '../config/logger.config';

export class SchedulerService {
  private sourceRepo: GovernmentSourceRepository;
  private syncService: SyncService;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(
    sourceRepo = new GovernmentSourceRepository(),
    syncService = new SyncService()
  ) {
    this.sourceRepo = sourceRepo;
    this.syncService = syncService;
  }

  async startScheduler(): Promise<void> {
    logger.info('Initializing government integrations scheduler...');
    try {
      const sources = await this.sourceRepo.findMany({
        where: { isActive: true, deletedAt: null },
      });

      for (const source of sources) {
        // Ensure valid cron expression format
        if (!cron.validate(source.syncFrequency)) {
          logger.error(`Invalid cron expression defined for source ${source.name}: ${source.syncFrequency}`);
          continue;
        }

        logger.info(`Scheduling sync job for ${source.name} using expression: ${source.syncFrequency}`);
        const task = cron.schedule(source.syncFrequency, async () => {
          logger.info(`Scheduled execution triggered for provider sync: ${source.name}`);
          try {
            await this.syncService.syncProvider(source.name, 'Cron Scheduler');
          } catch (err: any) {
            logger.error(`Scheduled sync run failed for ${source.name}: ${err.message}`);
          }
        });

        this.tasks.set(source.name, task);
      }
    } catch (err: any) {
      logger.error('Failed starting government sources scheduler tasks:', err);
    }
  }

  stopScheduler(): void {
    logger.info('Stopping all scheduler sync tasks...');
    for (const [name, task] of this.tasks.entries()) {
      task.stop();
      logger.info(`Stopped sync task for provider: ${name}`);
    }
    this.tasks.clear();
  }
}

export default SchedulerService;
