import NotificationTemplateRepository from '../repositories/notification-template.repository';
import { getCache, setCache } from '../config/redis.config';
import { NotFoundError } from '../utils/errors';

export class TemplateService {
  private templateRepo: NotificationTemplateRepository;

  constructor(templateRepo = new NotificationTemplateRepository()) {
    this.templateRepo = templateRepo;
  }

  async getTemplate(name: string, language = 'en'): Promise<any> {
    const cacheKey = `notification:templates:${name}:${language}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const template = await this.templateRepo.findByNameAndLang(name, language);
    if (!template) {
      throw new NotFoundError(`Template '${name}' in language '${language}' not found.`);
    }

    await setCache(cacheKey, template, 3600);
    return template;
  }

  render(bodyTemplate: string, variables: Record<string, any>): string {
    let rendered = bodyTemplate;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
    }
    return rendered;
  }
}

export default TemplateService;
