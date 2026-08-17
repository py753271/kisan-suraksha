import { Request, Response } from 'express';
import IntegrationService from '../services/integration.service';
import SyncService from '../services/sync.service';
import { sendSuccess } from '../utils/response';
import { AuthenticationError } from '../utils/errors';

export class IntegrationController {
  private integrationService: IntegrationService;
  private syncService: SyncService;

  constructor(
    integrationService = new IntegrationService(),
    syncService = new SyncService()
  ) {
    this.integrationService = integrationService;
    this.syncService = syncService;
  }

  getProviders = async (_req: Request, res: Response): Promise<void> => {
    const list = await this.integrationService.getProviders();
    sendSuccess(res, list, undefined, 'Registered government API feeds providers retrieved');
  };

  getStatus = async (_req: Request, res: Response): Promise<void> => {
    const status = await this.integrationService.getStatus();
    sendSuccess(res, status, undefined, 'Latest API synchronization status logs retrieved');
  };

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const health = await this.integrationService.getHealth();
    sendSuccess(res, health, undefined, 'API providers health checks and latency statistics compiled');
  };

  getSyncHistory = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit || 20);
    const list = await this.integrationService.getSyncHistory(limit);
    sendSuccess(res, list, undefined, 'Full synchronization history logs compiled');
  };

  syncAllProviders = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const providers = await this.integrationService.getProviders();
    const results: any[] = [];
    for (const p of providers) {
      if (p.isActive) {
        try {
          const resSync = await this.syncService.syncProvider(p.name, req.user.email);
          results.push(resSync);
        } catch (err: any) {
          results.push({ provider: p.name, status: 'FAILED', errorMessage: err.message });
        }
      }
    }
    sendSuccess(res, results, undefined, 'All active government feeds manual synchronization complete');
  };

  syncProvider = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const provider = String(req.params.provider);
    const result = await this.syncService.syncProvider(provider, req.user.email);
    sendSuccess(res, result, undefined, `Manual synchronization completed for provider ${provider}`);
  };

  retrySync = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const syncId = String(req.params.syncId);
    const result = await this.integrationService.retrySync(syncId, req.user.email);
    sendSuccess(res, result, undefined, `Retry synchronization job compiled for sync ID ${syncId}`);
  };
}

export default IntegrationController;
