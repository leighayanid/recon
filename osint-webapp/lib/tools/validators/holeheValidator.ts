/**
 * Holehe Input Validator
 * Zod schema for Holehe email investigation tool
 */

import { z } from 'zod';

export const holeheInputSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  onlyUsed: z
    .boolean()
    .optional()
    .default(true)
    .describe('Show only accounts where email is used'),
  timeout: z
    .number()
    .min(5)
    .max(120)
    .optional()
    .default(30)
    .describe('Timeout in seconds for each check'),
});

export type HoleheInput = z.infer<typeof holeheInputSchema>;

export const holeheOutputSchema = z.object({
  email: z.string(),
  totalSites: z.number(),
  foundSites: z.number(),
  accounts: z.array(
    z.object({
      site: z.string(),
      exists: z.boolean(),
      rateLimit: z.boolean().optional(),
      emailRecovery: z.string().optional(),
      phoneNumber: z.string().optional(),
    })
  ),
  executionTime: z.number(),
  timestamp: z.string(),
});

export type HoleheOutput = z.infer<typeof holeheOutputSchema>;
