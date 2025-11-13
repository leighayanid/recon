/**
 * Docker Executor
 * Executes OSINT tools in Docker containers for security and isolation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolExecutor, type ExecutionOptions, type ParsedResult } from './ToolExecutor';

const execAsync = promisify(exec);

export interface DockerExecutionOptions extends ExecutionOptions {
  memory?: string; // e.g., '512m'
  cpus?: string; // e.g., '0.5'
  network?: 'none' | 'bridge' | 'host';
  volumes?: string[]; // e.g., ['/host/path:/container/path:ro']
}

/**
 * Abstract base class for Docker-based tool executors
 */
export abstract class DockerExecutor extends ToolExecutor {
  protected dockerImage!: string;
  protected defaultMemory = '512m';
  protected defaultCpus = '1.0';
  protected defaultNetwork: 'none' | 'bridge' | 'host' = 'bridge';

  /**
   * Execute tool inside Docker container
   */
  protected async executeInternal(
    input: any,
    options: DockerExecutionOptions = {}
  ): Promise<ParsedResult> {
    const startTime = Date.now();
    const dockerImage = this.metadata.dockerImage || this.dockerImage;

    if (!dockerImage) {
      throw new Error(`No Docker image specified for ${this.metadata.name}`);
    }

    // Build command arguments
    const commandArgs = this.buildCommand(input);

    // Build Docker run command
    const dockerCommand = this.buildDockerCommand(dockerImage, commandArgs, options);

    // Report progress
    await options.onProgress?.({
      percentage: 20,
      message: 'Starting Docker container',
      stage: 'docker-init',
    });

    try {
      // Check if image exists, pull if not
      await this.ensureDockerImage(dockerImage);

      await options.onProgress?.({
        percentage: 40,
        message: 'Executing tool',
        stage: 'execution',
      });

      // Execute the command with timeout
      const timeout = options.timeout || 300000; // 5 minutes default
      const { stdout, stderr } = await this.executeWithTimeout(dockerCommand, timeout);

      await options.onProgress?.({
        percentage: 80,
        message: 'Processing results',
        stage: 'parsing',
      });

      // Parse output
      const parsed = this.parseOutput(stdout);

      const executionTime = Date.now() - startTime;

      return {
        raw: stdout,
        parsed,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Docker execution failed: ${errorMessage}`);
    }
  }

  /**
   * Build Docker run command
   */
  protected buildDockerCommand(
    image: string,
    commandArgs: string[],
    options: DockerExecutionOptions = {}
  ): string {
    const memory = options.memory || this.defaultMemory;
    const cpus = options.cpus || this.defaultCpus;
    const network = options.network || this.defaultNetwork;

    const dockerArgs = [
      'docker run',
      '--rm', // Remove container after execution
      `--memory=${memory}`,
      `--cpus=${cpus}`,
      `--network=${network}`,
      '--security-opt=no-new-privileges',
      '--cap-drop=ALL',
    ];

    // Add volumes if specified
    if (options.volumes) {
      options.volumes.forEach((volume) => {
        dockerArgs.push(`-v ${volume}`);
      });
    }

    // Add image and command
    dockerArgs.push(image);
    dockerArgs.push(...commandArgs);

    return dockerArgs.join(' ');
  }

  /**
   * Ensure Docker image is available locally
   */
  protected async ensureDockerImage(image: string): Promise<void> {
    try {
      // Check if image exists
      await execAsync(`docker image inspect ${image}`);
    } catch {
      // Image doesn't exist, pull it
      console.log(`Pulling Docker image: ${image}`);
      await execAsync(`docker pull ${image}`);
    }
  }

  /**
   * Execute command with timeout
   */
  protected async executeWithTimeout(
    command: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const process = exec(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data;
      });

      process.stderr?.on('data', (data) => {
        stderr += data;
      });

      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      process.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Process exited with code ${code}. Error: ${stderr}`));
        }
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Check if Docker is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize input for shell execution
   */
  protected sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[;&|`$(){}[\]<>]/g, '');
  }

  /**
   * Escape shell arguments
   */
  protected escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
}
