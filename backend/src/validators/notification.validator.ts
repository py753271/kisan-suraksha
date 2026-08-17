import { z } from 'zod';

export const sendNotificationValidator = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    alertId: z.string().uuid().optional(),
    templateId: z.string().uuid().optional(),
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body content is required'),
    category: z.enum(['Weather', 'Alert', 'Crop', 'Emergency', 'Profile', 'System']),
    priority: z.enum(['High', 'Normal', 'Low']).default('Normal'),
  }),
});

export const broadcastNotificationValidator = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body content is required'),
    category: z.enum(['Weather', 'Alert', 'Crop', 'Emergency', 'Profile', 'System']),
    priority: z.enum(['High', 'Normal', 'Low']).default('Normal'),
    filters: z.object({
      stateId: z.string().uuid().optional(),
      districtId: z.string().uuid().optional(),
    }).optional(),
  }),
});

export const updatePreferencesValidator = z.object({
  body: z.object({
    preferences: z.array(
      z.object({
        channel: z.enum(['Push', 'SMS', 'Email', 'WhatsApp']),
        isEnabled: z.boolean(),
        quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM').nullable().optional(),
        quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM').nullable().optional(),
        emergencyOverride: z.boolean().default(true),
      })
    ),
  }),
});

export const notificationIdValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid notification request UUID format'),
  }),
});
