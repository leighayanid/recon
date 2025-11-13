/**
 * theHarvester Executor
 * Executes theHarvester domain investigation tool in Docker
 */

import { DockerExecutor } from '../base/DockerExecutor';
import {
  theharvesterInputSchema,
  type TheHarvesterInput,
  type TheHarvesterOutput,
} from '../validators/theharvesterValidator';
import type { ToolMetadata, ParsedResult, ExecutionOptions } from '../base/ToolExecutor';

export class TheHarvesterExecutor extends DockerExecutor {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'theharvester',
      displayName: 'theHarvester',
      description: 'Gather emails, subdomains, hosts, and more from different public sources',
      category: 'domain',
      dockerImage: 'theharvester:latest',
      command: 'python3 theHarvester.py',
      estimatedTime: '2-5 minutes',
      rateLimit: {
        max: 5,
        windowMs: 60000, // 5 requests per minute
      },
    };

    super(metadata, theharvesterInputSchema);
    this.dockerImage = 'theharvester:latest';
    this.defaultMemory = '512m';
    this.defaultCpus = '1.0';
    this.defaultNetwork = 'bridge'; // Needs network access
  }

  /**
   * Build command arguments for theHarvester
   */
  protected buildCommand(input: TheHarvesterInput): string[] {
    const args: string[] = ['python3', 'theHarvester.py'];

    // Add domain
    args.push('-d', this.escapeShellArg(input.domain));

    // Add sources
    if (input.sources && input.sources.length > 0) {
      args.push('-b', input.sources.join(','));
    } else {
      // Default sources
      args.push('-b', 'google,bing,linkedin,twitter');
    }

    // Add limit
    if (input.limit) {
      args.push('-l', input.limit.toString());
    }

    // Add start position
    if (input.startFrom) {
      args.push('-s', input.startFrom.toString());
    }

    // DNS lookup
    if (input.dns) {
      args.push('-n');
    }

    // Takeover check
    if (input.takeover) {
      args.push('-t');
    }

    // Output format
    args.push('-f', '/tmp/harvester_output');

    return args;
  }

  /**
   * Parse theHarvester output
   */
  protected parseOutput(rawOutput: string): TheHarvesterOutput {
    try {
      // Try to parse JSON output if available
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return this.formatHarvesterOutput(jsonData, rawOutput);
      }

      // Fallback: Parse text output
      return this.parseTextOutput(rawOutput);
    } catch (error) {
      console.error('Failed to parse theHarvester output:', error);
      throw new Error('Failed to parse tool output');
    }
  }

  /**
   * Format theHarvester JSON output
   */
  private formatHarvesterOutput(jsonData: any, rawOutput: string): TheHarvesterOutput {
    const emails = jsonData.emails || [];
    const hosts = jsonData.hosts || [];
    const ips = jsonData.ips || [];
    const urls = jsonData.urls || [];
    const asns = jsonData.asns || [];

    return {
      domain: jsonData.domain || 'unknown',
      emails: Array.isArray(emails) ? emails : [],
      hosts: Array.isArray(hosts) ? hosts : [],
      ips: Array.isArray(ips) ? ips : [],
      urls: Array.isArray(urls) ? urls : [],
      asns: Array.isArray(asns) ? asns : [],
      interestingUrls: jsonData.interesting_urls || [],
      totalResults:
        (emails.length || 0) +
        (hosts.length || 0) +
        (ips.length || 0) +
        (urls.length || 0),
      sources: jsonData.sources || [],
      executionTime: 0, // Will be set by executor
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse text output (fallback)
   */
  private parseTextOutput(rawOutput: string): TheHarvesterOutput {
    const lines = rawOutput.split('\n');
    const emails: string[] = [];
    const hosts: string[] = [];
    const ips: string[] = [];
    const urls: string[] = [];
    let domain = 'unknown';

    // Extract domain
    const domainMatch = rawOutput.match(/Target:\s*(\S+)/i);
    if (domainMatch) {
      domain = domainMatch[1];
    }

    // Parse sections
    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('Emails found')) {
        currentSection = 'emails';
      } else if (trimmed.includes('Hosts found')) {
        currentSection = 'hosts';
      } else if (trimmed.includes('IPs found')) {
        currentSection = 'ips';
      } else if (trimmed.includes('URLs found')) {
        currentSection = 'urls';
      } else if (currentSection === 'emails' && trimmed.includes('@')) {
        emails.push(trimmed);
      } else if (currentSection === 'hosts' && trimmed && !trimmed.startsWith('[')) {
        hosts.push(trimmed);
      } else if (currentSection === 'ips' && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(trimmed)) {
        ips.push(trimmed);
      } else if (currentSection === 'urls' && trimmed.startsWith('http')) {
        urls.push(trimmed);
      }
    }

    return {
      domain,
      emails,
      hosts,
      ips,
      urls,
      asns: [],
      totalResults: emails.length + hosts.length + ips.length + urls.length,
      sources: [],
      executionTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute theHarvester with progress reporting
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
