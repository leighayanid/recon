/**
 * PhoneInfoga Executor
 * Executes PhoneInfoga phone investigation tool in Docker
 */

import { DockerExecutor } from '../base/DockerExecutor';
import {
  phoneinfogaInputSchema,
  type PhoneInfogaInput,
  type PhoneInfogaOutput,
} from '../validators/phoneinfogaValidator';
import type { ToolMetadata, ParsedResult, ExecutionOptions } from '../base/ToolExecutor';

export class PhoneInfogaExecutor extends DockerExecutor {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'phoneinfoga',
      displayName: 'PhoneInfoga',
      description: 'Advanced information gathering & OSINT framework for phone numbers',
      category: 'phone',
      dockerImage: 'phoneinfoga:latest',
      command: './phoneinfoga',
      estimatedTime: '30-60 seconds',
      rateLimit: {
        max: 15,
        windowMs: 60000, // 15 requests per minute
      },
    };

    super(metadata, phoneinfogaInputSchema);
    this.dockerImage = 'phoneinfoga:latest';
    this.defaultMemory = '256m';
    this.defaultCpus = '0.5';
    this.defaultNetwork = 'bridge'; // Needs network access
  }

  /**
   * Build command arguments for PhoneInfoga
   */
  protected buildCommand(input: PhoneInfogaInput): string[] {
    const args: string[] = ['./phoneinfoga', 'scan'];

    // Add phone number
    args.push('-n', this.escapeShellArg(input.phoneNumber));

    // Add specific scanners if provided
    if (input.scanners && input.scanners.length > 0) {
      args.push('--scanner', input.scanners.join(','));
    }

    // Output format
    args.push('--output', 'json');

    return args;
  }

  /**
   * Parse PhoneInfoga output
   */
  protected parseOutput(rawOutput: string): PhoneInfogaOutput {
    try {
      // Try to parse JSON output
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return this.formatPhoneInfogaOutput(jsonData);
      }

      // Fallback: Parse text output
      return this.parseTextOutput(rawOutput);
    } catch (error) {
      console.error('Failed to parse PhoneInfoga output:', error);
      throw new Error('Failed to parse tool output');
    }
  }

  /**
   * Format PhoneInfoga JSON output
   */
  private formatPhoneInfogaOutput(jsonData: any): PhoneInfogaOutput {
    const scanResults = jsonData.scanResults || jsonData.scan_results || [];

    return {
      phoneNumber: jsonData.phoneNumber || jsonData.phone_number || jsonData.number || 'unknown',
      valid: jsonData.valid === true || jsonData.isValid === true,
      localFormat: jsonData.localFormat || jsonData.local_format,
      internationalFormat: jsonData.internationalFormat || jsonData.international_format,
      countryCode: jsonData.countryCode || jsonData.country_code,
      country: jsonData.country || jsonData.countryName,
      location: jsonData.location || jsonData.region,
      carrier: jsonData.carrier || jsonData.carrierName,
      lineType: jsonData.lineType || jsonData.line_type || jsonData.type,
      scanResults: Array.isArray(scanResults)
        ? scanResults.map((result: any) => ({
            scanner: result.scanner || result.name || 'unknown',
            data: result.data || result,
          }))
        : [],
      executionTime: 0, // Will be set by executor
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse text output (fallback)
   */
  private parseTextOutput(rawOutput: string): PhoneInfogaOutput {
    const lines = rawOutput.split('\n');
    let phoneNumber = 'unknown';
    let valid = false;
    let localFormat: string | undefined;
    let internationalFormat: string | undefined;
    let country: string | undefined;
    let carrier: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('Phone number:')) {
        phoneNumber = trimmed.split(':')[1]?.trim() || phoneNumber;
      } else if (trimmed.includes('Valid:')) {
        valid = trimmed.toLowerCase().includes('true') || trimmed.toLowerCase().includes('yes');
      } else if (trimmed.includes('Local format:')) {
        localFormat = trimmed.split(':')[1]?.trim();
      } else if (trimmed.includes('International format:')) {
        internationalFormat = trimmed.split(':')[1]?.trim();
      } else if (trimmed.includes('Country:')) {
        country = trimmed.split(':')[1]?.trim();
      } else if (trimmed.includes('Carrier:')) {
        carrier = trimmed.split(':')[1]?.trim();
      }
    }

    return {
      phoneNumber,
      valid,
      localFormat,
      internationalFormat,
      country,
      carrier,
      executionTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute PhoneInfoga with progress reporting
   */
  async execute(
    input: Record<string, any>,
    options: ExecutionOptions = {}
  ): Promise<ParsedResult> {
    const result = await super.execute(input, options);

    // Update execution time in parsed data
    if (result.metadata?.executionTime) {
      result.parsed.executionTime = result.metadata.executionTime;
    }

    return result;
  }
}
