/**
 * ExifTool Input Validator
 * Zod schema for ExifTool image analysis tool
 */

import { z } from 'zod';

export const exiftoolInputSchema = z.object({
  imagePath: z
    .string()
    .min(1, 'Image path is required')
    .describe('Path to the image file'),
  extractGPS: z
    .boolean()
    .optional()
    .default(true)
    .describe('Extract GPS coordinates if available'),
  extractAll: z
    .boolean()
    .optional()
    .default(true)
    .describe('Extract all available metadata'),
});

export type ExifToolInput = z.infer<typeof exiftoolInputSchema>;

export const exiftoolOutputSchema = z.object({
  fileName: z.string(),
  fileSize: z.string().optional(),
  fileType: z.string().optional(),
  mimeType: z.string().optional(),
  imageWidth: z.number().optional(),
  imageHeight: z.number().optional(),
  camera: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    software: z.string().optional(),
  }).optional(),
  dateTime: z.object({
    original: z.string().optional(),
    digitized: z.string().optional(),
    modified: z.string().optional(),
  }).optional(),
  gps: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    altitude: z.number().optional(),
    latitudeRef: z.string().optional(),
    longitudeRef: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  executionTime: z.number(),
  timestamp: z.string(),
});

export type ExifToolOutput = z.infer<typeof exiftoolOutputSchema>;
