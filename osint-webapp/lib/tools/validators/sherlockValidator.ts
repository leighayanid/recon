/**
 * Sherlock Input Validator
 * Zod schema for Sherlock username search tool
 */

import { z } from 'zod';

export const sherlockInputSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  timeout: z
    .number()
    .min(1)
    .max(300)
    .optional()
    .default(60)
    .describe('Timeout in seconds for each site check'),
  sites: z
    .array(z.string())
    .optional()
    .describe('Specific sites to check (leave empty for all)'),
  proxy: z
    .string()
    .url()
    .optional()
    .describe('Proxy URL to use for requests'),
});

export type SherlockInput = z.infer<typeof sherlockInputSchema>;

export const sherlockOutputSchema = z.object({
  username: z.string(),
  totalSites: z.number(),
  foundSites: z.number(),
  results: z.array(
    z.object({
      site: z.string(),
      url: z.string(),
      found: z.boolean(),
      responseTime: z.number().optional(),
      httpStatus: z.number().optional(),
    })
  ),
  executionTime: z.number(),
  timestamp: z.string(),
});

export type SherlockOutput = z.infer<typeof sherlockOutputSchema>;
