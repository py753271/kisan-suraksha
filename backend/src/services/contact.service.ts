import EmergencyContactRepository from '../repositories/emergency-contact.repository';
import { getCache, setCache } from '../config/redis.config';
import { logger } from '../config/logger.config';

export class ContactService {
  private contactRepo: EmergencyContactRepository;

  constructor(contactRepo = new EmergencyContactRepository()) {
    this.contactRepo = contactRepo;
  }

  async getContacts(filters: {
    stateId?: string;
    districtId?: string;
    serviceType?: string;
  }): Promise<any[]> {
    const cacheKey = `emergency:contacts:${filters.stateId || 'all'}:${filters.districtId || 'all'}:${filters.serviceType || 'all'}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for emergency contacts: ${cacheKey}`);
      return cached;
    }

    const contacts = await this.contactRepo.findFiltered(filters);

    // Cache contacts lookup for 1 hour (3600 seconds)
    await setCache(cacheKey, contacts, 3600);
    return contacts;
  }
}

export default ContactService;
