/**
 * Holehe Executor
 * Executes Holehe email investigation tool in Docker
 */

import { DockerExecutor } from '../base/DockerExecutor';
import {
  holeheInputSchema,
  type HoleheInput,
  type HoleheOutput,
} from '../validators/holeheValidator';
import type { ToolMetadata, ParsedResult, ExecutionOptions } from '../base/ToolExecutor';

export class HoleheExecutor extends DockerExecutor {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'holehe',
      displayName: 'Holehe',
      description: 'Check if an email is attached to an account on over 120 websites',
      category: 'email',
      dockerImage: 'holehe:latest',
      command: 'holehe',
      estimatedTime: '1-2 minutes',
      rateLimit: {
        max: 10,
        windowMs: 60000, // 10 requests per minute
      },
    };

    super(metadata, holeheInputSchema);
    this.dockerImage = 'holehe:latest';
    this.defaultMemory = '256m';
    this.defaultCpus = '0.5';
    this.defaultNetwork = 'bridge'; // Needs network access
  }

  /**
   * Build command arguments for Holehe
   */
  protected buildCommand(input: HoleheInput): string[] {
    const args: string[] = ['holehe'];

    // Add email
    args.push(this.escapeShellArg(input.email));

    // Only show used accounts
    if (input.onlyUsed) {
      args.push('--only-used');
    }

    // Add timeout
    if (input.timeout) {
      args.push('--timeout', input.timeout.toString());
    }

    // Output as JSON
    args.push('--json');

    return args;
  }

  /**
   * Parse Holehe output
   */
  protected parseOutput(rawOutput: string): HoleheOutput {
    try {
      // Try to parse JSON output
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return this.formatHoleheOutput(jsonData, rawOutput);
      }

      // Fallback: Parse text output
      return this.parseTextOutput(rawOutput);
    } catch (error) {
      console.error('Failed to parse Holehe output:', error);
      throw new Error('Failed to parse tool output');
    }
  }

  /**
   * Format Holehe JSON output
   */
  private formatHoleheOutput(jsonData: any, rawOutput: string): HoleheOutput {
    // Handle both array and object formats
    const results = Array.isArray(jsonData) ? jsonData : Object.values(jsonData);

    const accounts = results.map((item: any) => ({
      site: item.name || item.site || 'unknown',
      exists: item.exists === true || item.status === 'found',
      rateLimit: item.rateLimit || item.rate_limit || false,
      emailRecovery: item.emailrecovery || item.email_recovery,
      phoneNumber: item.phoneNumber || item.phone_number,
    }));

    const foundSites = accounts.filter((acc) => acc.exists).length;

    // Extract email from rawOutput if not in JSON
    let email = 'unknown';
    const emailMatch = rawOutput.match(/Email:\s*(\S+@\S+)/i) || rawOutput.match(/(\S+@\S+)/);
    if (emailMatch) {
      email = emailMatch[1];
    }

    return {
      email,
      totalSites: accounts.length,
      foundSites,
      accounts,
      executionTime: 0, // Will be set by executor
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse text output (fallback)
   */
  private parseTextOutput(rawOutput: string): HoleheOutput {
    const lines = rawOutput.split('\n');
    const accounts: HoleheOutput['accounts'] = [];
    let email = 'unknown';

    // Extract email
    const emailMatch = rawOutput.match(/(\S+@\S+)/);
    if (emailMatch) {
      email = emailMatch[1];
    }

    // Parse each line for results
    for (const line of lines) {
      // Look for "[+]" for found accounts
      if (line.includes('[+]') || line.includes('✓')) {
        const siteMatch = line.match(/(?:\[?\+\]?|✓)\s*(\w+)/i);
        if (siteMatch) {
          accounts.push({
            site: siteMatch[1],
            exists: true,
            rateLimit: false,
          });
        }
      }
    }

    return {
      email,
      totalSites: accounts.length,
      foundSites: accounts.filter((acc) => acc.exists).length,
      accounts,
      executionTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute Holehe with progress reporting
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
