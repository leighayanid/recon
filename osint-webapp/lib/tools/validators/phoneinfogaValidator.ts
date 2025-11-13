/**
 * PhoneInfoga Input Validator
 * Zod schema for PhoneInfoga phone investigation tool
 */

import { z } from 'zod';

export const phoneinfogaInputSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Invalid phone number format (E.164 format recommended)'
    ),
  scanners: z
    .array(z.string())
    .optional()
    .describe('Specific scanners to use'),
});

export type PhoneInfogaInput = z.infer<typeof phoneinfogaInputSchema>;

export const phoneinfogaOutputSchema = z.object({
  phoneNumber: z.string(),
  valid: z.boolean(),
  localFormat: z.string().optional(),
  internationalFormat: z.string().optional(),
  countryCode: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
  carrier: z.string().optional(),
  lineType: z.string().optional(),
  scanResults: z.array(
    z.object({
      scanner: z.string(),
      data: z.record(z.any()),
    })
  ).optional(),
  executionTime: z.number(),
  timestamp: z.string(),
});

export type PhoneInfogaOutput = z.infer<typeof phoneinfogaOutputSchema>;
