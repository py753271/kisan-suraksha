import { z } from 'zod';

export const dashboardFiltersValidator = z.object({
  query: z.object({
    stateId: z.string().uuid().optional(),
    districtId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const reportFiltersValidator = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().default(10),
  }),
});
