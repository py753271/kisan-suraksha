import { z } from 'zod';

const coordinateSchema = z.coerce.number();

export const advisoryQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    cropId: z.string().uuid('Invalid crop ID format').optional(),
    stage: z.enum(['Sowing', 'Vegetative', 'Flowering', 'Harvesting']).optional(),
    season: z.enum(['Kharif', 'Rabi', 'Zaid']).optional(),
  }),
});

export const recommendationQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
  }),
});

export const riskQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    cropId: z.string().uuid('Invalid crop ID format'),
  }),
});

export const advisoryHistoryQueryValidator = z.object({
  query: z.object({
    cropId: z.string().uuid('Invalid crop ID format').optional(),
    limit: z.coerce.number().int().positive().default(10),
  }),
});
