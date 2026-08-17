import { z } from 'zod';

const coordinateSchema = z.coerce.number();

export const weatherQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    units: z.enum(['metric', 'imperial']).default('metric'),
    lang: z.string().default('en'),
  }),
});

export const weatherHistoryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    startDate: z.string().datetime({ message: 'Invalid start date format (ISO-8601 required)' }),
    endDate: z.string().datetime({ message: 'Invalid end date format (ISO-8601 required)' }),
  }),
});
