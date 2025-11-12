/**
 * Base Tool Executor
 * Abstract base class for all OSINT tool executors
 */

import { z } from 'zod';
import type { ToolName } from '@/lib/queue/types';

export interface ToolProgress {
  percentage: number;
  message?: string;
  stage?: string;
}

export interface ExecutionOptions {
  timeout?: number;
  onProgress?: (progress: ToolProgress) => Promise<void> | void;
}

export interface ToolMetadata {
  name: ToolName;
  displayName: string;
  description: string;
  category: 'username' | 'domain' | 'email' | 'phone' | 'image' | 'social';
  dockerImage?: string;
  command: string;
  estimatedTime?: string;
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}

export interface ParsedResult {
  raw: string;
  parsed: any;
  metadata?: {
    executionTime?: number;
    toolVersion?: string;
    timestamp: string;
  };
}

/**
 * Abstract base class for tool executors
 */
export abstract class ToolExecutor {
  protected metadata: ToolMetadata;
  protected inputSchema: z.ZodSchema;

  constructor(metadata: ToolMetadata, inputSchema: z.ZodSchema) {
    this.metadata = metadata;
    this.inputSchema = inputSchema;
  }

  /**
   * Get tool metadata
   */
  getMetadata(): ToolMetadata {
    return this.metadata;
  }

  /**
   * Validate input data
   */
  validateInput(input: unknown): z.SafeParseReturnType<any, any> {
    return this.inputSchema.safeParse(input);
  }

  /**
   * Execute the tool
   */
  async execute(
    input: Record<string, any>,
    options: ExecutionOptions = {}
  ): Promise<ParsedResult> {
    // Validate input
    const validation = this.validateInput(input);
    if (!validation.success) {
      throw new Error(
        `Invalid input for ${this.metadata.name}: ${validation.error.message}`
      );
    }

    // Report initial progress
    await options.onProgress?.({
      percentage: 0,
      message: `Starting ${this.metadata.displayName}`,
      stage: 'init',
    });

    try {
      // Execute the actual tool
      const result = await this.executeInternal(validation.data, options);

      // Report completion
      await options.onProgress?.({
        percentage: 100,
        message: 'Completed',
        stage: 'done',
      });

      return result;
    } catch (error) {
      throw new Error(
        `Execution failed for ${this.metadata.name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Internal execution method to be implemented by subclasses
   */
  protected abstract executeInternal(
    input: any,
    options: ExecutionOptions
  ): Promise<ParsedResult>;

  /**
   * Parse raw tool output
   */
  protected abstract parseOutput(rawOutput: string): any;

  /**
   * Build command arguments
   */
  protected abstract buildCommand(input: any): string[];

  /**
   * Check if tool is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Default implementation - can be overridden
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get estimated execution time
   */
  getEstimatedTime(): string {
    return this.metadata.estimatedTime || 'Unknown';
  }

  /**
   * Get rate limit info
   */
  getRateLimit(): { max: number; windowMs: number } | undefined {
    return this.metadata.rateLimit;
  }
}

/**
 * Helper function to create timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
