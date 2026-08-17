import { z } from 'zod';

const coordinateSchema = z.coerce.number();

export const sosRequestValidator = z.object({
  body: z.object({
    latitude: coordinateSchema.min(-90).max(90),
    longitude: coordinateSchema.min(-180).max(180),
    disasterType: z.string().min(1, 'Disaster type is required'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
    notes: z.string().optional(),
  }),
});

export const contactsQueryValidator = z.object({
  query: z.object({
    stateId: z.string().uuid().optional(),
    districtId: z.string().uuid().optional(),
    serviceType: z.string().optional(),
  }),
});

export const sheltersQueryValidator = z.object({
  query: z.object({
    status: z.enum(['Open', 'Closed', 'Full']).optional(),
  }),
});

export const nearbySheltersValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    limit: z.coerce.number().int().positive().default(5),
  }),
});

export const resourcesQueryValidator = z.object({
  query: z.object({
    lat: coordinateSchema.min(-90).max(90),
    lon: coordinateSchema.min(-180).max(180),
    limit: z.coerce.number().int().positive().default(5),
  }),
});

export const sosIdValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid SOS request UUID format'),
  }),
});
