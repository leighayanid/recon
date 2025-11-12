/**
 * Sherlock Executor
 * Executes Sherlock username search tool in Docker
 */

import { DockerExecutor } from '../base/DockerExecutor';
import { sherlockInputSchema, type SherlockInput, type SherlockOutput } from '../validators/sherlockValidator';
import type { ToolMetadata, ParsedResult, ExecutionOptions } from '../base/ToolExecutor';

export class SherlockExecutor extends DockerExecutor {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'sherlock',
      displayName: 'Sherlock',
      description: 'Hunt down social media accounts by username across social networks',
      category: 'username',
      dockerImage: 'sherlock/sherlock:latest',
      command: 'python3 sherlock',
      estimatedTime: '1-3 minutes',
      rateLimit: {
        max: 10,
        windowMs: 60000, // 10 requests per minute
      },
    };

    super(metadata, sherlockInputSchema);
    this.dockerImage = 'sherlock/sherlock:latest';
    this.defaultMemory = '512m';
    this.defaultCpus = '1.0';
    this.defaultNetwork = 'bridge'; // Needs network access
  }

  /**
   * Build command arguments for Sherlock
   */
  protected buildCommand(input: SherlockInput): string[] {
    const args: string[] = ['python3', 'sherlock'];

    // Add username
    args.push(this.escapeShellArg(input.username));

    // Add timeout
    if (input.timeout) {
      args.push('--timeout', input.timeout.toString());
    }

    // Add specific sites if provided
    if (input.sites && input.sites.length > 0) {
      args.push('--site', input.sites.join(','));
    }

    // Add proxy if provided
    if (input.proxy) {
      args.push('--proxy', this.escapeShellArg(input.proxy));
    }

    // Output as JSON
    args.push('--json', '/tmp/sherlock_output.json');

    // Print results
    args.push('--print-found');

    return args;
  }

  /**
   * Parse Sherlock output
   */
  protected parseOutput(rawOutput: string): SherlockOutput {
    try {
      // Try to parse as JSON first
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return this.formatSherlockOutput(jsonData, rawOutput);
      }

      // Fallback: Parse text output
      return this.parseTextOutput(rawOutput);
    } catch (error) {
      console.error('Failed to parse Sherlock output:', error);
      throw new Error('Failed to parse tool output');
    }
  }

  /**
   * Format Sherlock JSON output
   */
  private formatSherlockOutput(jsonData: any, rawOutput: string): SherlockOutput {
    const username = Object.keys(jsonData)[0] || 'unknown';
    const userData = jsonData[username] || {};

    const results = Object.entries(userData).map(([site, data]: [string, any]) => ({
      site,
      url: data.url_user || '',
      found: data.status === 'Claimed',
      responseTime: data.response_time,
      httpStatus: data.http_status,
    }));

    const foundSites = results.filter((r) => r.found).length;

    return {
      username,
      totalSites: results.length,
      foundSites,
      results,
      executionTime: 0, // Will be set by executor
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse text output (fallback)
   */
  private parseTextOutput(rawOutput: string): SherlockOutput {
    const lines = rawOutput.split('\n');
    const results: SherlockOutput['results'] = [];
    let username = 'unknown';

    // Extract username from first line
    const usernameMatch = rawOutput.match(/Checking username (\w+)/i);
    if (usernameMatch) {
      username = usernameMatch[1];
    }

    // Parse each line for results
    for (const line of lines) {
      // Look for "[+]" for found accounts
      if (line.includes('[+]')) {
        const siteMatch = line.match(/\[?\+\]?\s*(\w+):\s*(https?:\/\/[^\s]+)/i);
        if (siteMatch) {
          results.push({
            site: siteMatch[1],
            url: siteMatch[2],
            found: true,
          });
        }
      }
    }

    return {
      username,
      totalSites: results.length,
      foundSites: results.filter((r) => r.found).length,
      results,
      executionTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute Sherlock with progress reporting
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
