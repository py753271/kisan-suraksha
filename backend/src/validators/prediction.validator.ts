import { z } from 'zod';

export const predictionRequestValidator = z.object({
  query: z.object({
    predictionType: z.enum(['WEATHER_TREND', 'CROP_RISK', 'YIELD_ADVISORY']),
    confidenceThreshold: z.coerce.number().min(0).max(1).default(0.70),
  }),
});

export const generatePredictionValidator = z.object({
  body: z.object({
    predictionType: z.enum(['WEATHER_TREND', 'CROP_RISK', 'YIELD_ADVISORY']),
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
});
