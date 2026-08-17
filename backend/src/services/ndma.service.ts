import { logger } from '../config/logger.config';

export class NDMAService {
  async fetchData(): Promise<any> {
    logger.info('[NDMA Service] Fetching emergency bulletins from National Disaster Management Authority...');
    return {
      alerts: [
        {
          title: 'Extreme Heatwave Warning',
          description: 'Severe heatwave conditions expected across Western India plains.',
          instructions: 'Avoid direct sunlight exposure between 12:00 PM and 3:00 PM.',
          effectiveTime: new Date().toISOString(),
          expiryTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days TTL
          severity: 'Extreme',
          category: 'meteorological',
          affectedRegions: ['GJ', 'RJ'],
        },
      ],
    };
  }
}

export default NDMAService;
