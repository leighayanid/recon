/**
 * theHarvester Input Validator
 * Zod schema for theHarvester domain investigation tool
 */

import { z } from 'zod';

export const theharvesterInputSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(255, 'Domain must be less than 255 characters')
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
      'Invalid domain format'
    ),
  sources: z
    .array(z.string())
    .optional()
    .describe('Data sources to use (e.g., google, bing, linkedin)'),
  limit: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .default(100)
    .describe('Limit the number of results'),
  startFrom: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe('Start results from this number'),
  dns: z
    .boolean()
    .optional()
    .default(true)
    .describe('Perform DNS lookups'),
  takeover: z
    .boolean()
    .optional()
    .default(false)
    .describe('Check for subdomain takeover'),
});

export type TheHarvesterInput = z.infer<typeof theharvesterInputSchema>;

export const theharvesterOutputSchema = z.object({
  domain: z.string(),
  emails: z.array(z.string()),
  hosts: z.array(z.string()),
  ips: z.array(z.string()),
  urls: z.array(z.string()),
  asns: z.array(z.string()).optional(),
  interestingUrls: z.array(z.string()).optional(),
  totalResults: z.number(),
  sources: z.array(z.string()),
  executionTime: z.number(),
  timestamp: z.string(),
});

export type TheHarvesterOutput = z.infer<typeof theharvesterOutputSchema>;
