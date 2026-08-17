import { z } from 'zod';

const coordinateSchema = z.coerce.number();

export const alertListValidator = z.object({
  query: z.object({
    category: z.string().optional(),
    severity: z.string().optional(),
    status: z.enum(['Active', 'Scheduled', 'Cancelled', 'Expired']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

export const alertLiveQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    radius: z.coerce.number().positive().default(5000), // distance in meters
    minLat: coordinateSchema.min(-90).max(90).optional(),
    minLon: coordinateSchema.min(-180).max(180).optional(),
    maxLat: coordinateSchema.min(-90).max(90).optional(),
    maxLon: coordinateSchema.min(-180).max(180).optional(),
  }),
});

export const alertIdValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid alert UUID format'),
  }),
});
