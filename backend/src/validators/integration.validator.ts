import { z } from 'zod';

export const syncRequestValidator = z.object({
  params: z.object({
    provider: z.enum(['IMD', 'NDMA', 'CWC', 'INCOIS', 'MOSDAC', 'ISRO']),
  }),
});

export const retrySyncValidator = z.object({
  params: z.object({
    syncId: z.string().uuid('Invalid sync log ID format'),
  }),
});
