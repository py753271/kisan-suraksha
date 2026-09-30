import { z } from 'zod';

const coordinateSchema = z.coerce.number();

export const layerQueryValidator = z.object({
  params: z.object({
    layerName: z.enum(['flood_risk', 'lightning_density', 'boundaries', 'rain_density', 'cyclone_path']),
  }),
});

export const boundaryQueryValidator = z.object({
  params: z.object({
    type: z.enum(['state', 'district', 'tehsil', 'village']),
  }),
  query: z.object({
    code: z.string().min(1, 'Boundary code parameter is required'),
  }),
});

export const shelterQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    limit: z.coerce.number().int().positive().default(5),
  }),
});

export const reverseGeocodeValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
  }),
});

export const locationSearchValidator = z.object({
  query: z.object({
    q: z.string().trim().min(2, 'Search query must be at least 2 characters'),
    limit: z.coerce.number().int().min(1).max(20).default(10).optional(),
  }),
});
