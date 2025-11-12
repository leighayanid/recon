/**
 * Validation Utilities
 * Common validation functions and schemas
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

// Username validation
export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(50, 'Username must be less than 50 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters');

// Domain validation
export const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .max(255, 'Domain must be less than 255 characters')
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/,
    'Invalid domain format'
  );

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use international format)');

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must be less than 2048 characters');

// IP address validation (IPv4)
export const ipv4Schema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Invalid IPv4 address'
  );

// UUID validation
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Input sanitization functions
 */

/**
 * Sanitize string input by removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input.replace(/[<>\"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return entities[char] || char;
  });
}

/**
 * Sanitize username (allow only alphanumeric, underscore, hyphen)
 */
export function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Sanitize domain name
 */
export function sanitizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/[^a-z0-9.-]/g, '');
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Remove SQL injection attempts
 */
export function sanitizeSql(input: string): string {
  return input.replace(/['";\\]/g, '');
}

/**
 * Remove shell command injection attempts
 */
export function sanitizeShellCommand(input: string): string {
  return input.replace(/[;&|`$(){}[\]<>]/g, '');
}

/**
 * Validation helper functions
 */

/**
 * Validate and parse input with Zod schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}

/**
 * Check if string is a valid username
 */
export function isValidUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}

/**
 * Check if string is a valid email
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Check if string is a valid domain
 */
export function isValidDomain(domain: string): boolean {
  return domainSchema.safeParse(domain).success;
}

/**
 * Check if string is a valid phone number
 */
export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

/**
 * Check if string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

/**
 * Rate limit validation
 */
export const rateLimitSchema = z.object({
  max: z.number().min(1).max(1000),
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
});

/**
 * Job input validation
 */
export const jobInputSchema = z.object({
  toolName: z.enum([
    'sherlock',
    'maigret',
    'theharvester',
    'sublist3r',
    'amass',
    'holehe',
    'h8mail',
    'phoneinfoga',
    'exiftool',
  ]),
  inputData: z.record(z.any()),
  investigationId: z.string().uuid().optional(),
  priority: z.number().min(0).max(10).optional(),
});

export type JobInput = z.infer<typeof jobInputSchema>;
