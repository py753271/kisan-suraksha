import NotificationPreferenceRepository from '../repositories/notification-preference.repository';
import { getCache, setCache, delCache } from '../config/redis.config';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class PreferenceService {
  private preferenceRepo: NotificationPreferenceRepository;

  constructor(preferenceRepo = new NotificationPreferenceRepository()) {
    this.preferenceRepo = preferenceRepo;
  }

  async getPreferences(userId: string): Promise<any[]> {
    const cacheKey = `user:preferences:${userId}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const prefs = await this.preferenceRepo.findByUserId(userId);
    await setCache(cacheKey, prefs, 3600);
    return prefs;
  }

  async updatePreferences(userId: string, preferences: any[]): Promise<any[]> {
    const results = await db.$transaction(async (tx: any) => {
      const updated: any[] = [];
      for (const pref of preferences) {
        const record = await tx.notificationPreference.upsert({
          where: {
            userId_channel: {
              userId,
              channel: pref.channel,
            },
          },
          update: {
            isEnabled: pref.isEnabled,
            quietHoursStart: pref.quietHoursStart || null,
            quietHoursEnd: pref.quietHoursEnd || null,
            emergencyOverride: pref.emergencyOverride !== false,
            version: { increment: 1 },
          },
          create: {
            userId,
            channel: pref.channel,
            isEnabled: pref.isEnabled,
            quietHoursStart: pref.quietHoursStart || null,
            quietHoursEnd: pref.quietHoursEnd || null,
            emergencyOverride: pref.emergencyOverride !== false,
          },
        });
        updated.push(record);
      }
      return updated;
    });

    // Invalidate caches
    await delCache(`user:preferences:${userId}`);
    logger.info(`User preferences updated for user: ${userId}`);
    return results;
  }
}

export default PreferenceService;
