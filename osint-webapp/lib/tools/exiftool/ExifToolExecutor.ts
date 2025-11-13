/**
 * ExifTool Executor
 * Executes ExifTool image metadata extraction in Docker
 */

import { DockerExecutor } from '../base/DockerExecutor';
import {
  exiftoolInputSchema,
  type ExifToolInput,
  type ExifToolOutput,
} from '../validators/exiftoolValidator';
import type { ToolMetadata, ParsedResult, ExecutionOptions } from '../base/ToolExecutor';

export class ExifToolExecutor extends DockerExecutor {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'exiftool',
      displayName: 'ExifTool',
      description: 'Extract metadata and EXIF information from images',
      category: 'image',
      dockerImage: 'exiftool:latest',
      command: 'exiftool',
      estimatedTime: '5-15 seconds',
      rateLimit: {
        max: 20,
        windowMs: 60000, // 20 requests per minute
      },
    };

    super(metadata, exiftoolInputSchema);
    this.dockerImage = 'exiftool:latest';
    this.defaultMemory = '128m';
    this.defaultCpus = '0.5';
    this.defaultNetwork = 'none'; // No network needed
  }

  /**
   * Build command arguments for ExifTool
   */
  protected buildCommand(input: ExifToolInput): string[] {
    const args: string[] = ['exiftool'];

    // JSON output
    args.push('-json');

    // Extract all metadata if requested
    if (input.extractAll) {
      args.push('-a', '-G1');
    }

    // Extract GPS coordinates
    if (input.extractGPS) {
      args.push('-gps:all');
    }

    // Add image path
    args.push(this.escapeShellArg(input.imagePath));

    return args;
  }

  /**
   * Parse ExifTool output
   */
  protected parseOutput(rawOutput: string): ExifToolOutput {
    try {
      // ExifTool outputs JSON array, parse the first item
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return this.formatExifToolOutput(jsonData[0] || {});
      }

      // Fallback: Parse text output
      return this.parseTextOutput(rawOutput);
    } catch (error) {
      console.error('Failed to parse ExifTool output:', error);
      throw new Error('Failed to parse tool output');
    }
  }

  /**
   * Format ExifTool JSON output
   */
  private formatExifToolOutput(exifData: any): ExifToolOutput {
    // Extract GPS coordinates
    const gps = exifData.GPSLatitude && exifData.GPSLongitude
      ? {
          latitude: this.convertGPSToDecimal(
            exifData.GPSLatitude,
            exifData.GPSLatitudeRef
          ),
          longitude: this.convertGPSToDecimal(
            exifData.GPSLongitude,
            exifData.GPSLongitudeRef
          ),
          altitude: exifData.GPSAltitude,
          latitudeRef: exifData.GPSLatitudeRef,
          longitudeRef: exifData.GPSLongitudeRef,
        }
      : undefined;

    return {
      fileName: exifData.FileName || 'unknown',
      fileSize: exifData.FileSize,
      fileType: exifData.FileType,
      mimeType: exifData.MIMEType,
      imageWidth: exifData.ImageWidth,
      imageHeight: exifData.ImageHeight,
      camera: {
        make: exifData.Make,
        model: exifData.Model,
        software: exifData.Software,
      },
      dateTime: {
        original: exifData.DateTimeOriginal,
        digitized: exifData.CreateDate,
        modified: exifData.ModifyDate,
      },
      gps,
      metadata: exifData,
      executionTime: 0, // Will be set by executor
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Convert GPS coordinates from degrees/minutes/seconds to decimal
   */
  private convertGPSToDecimal(gpsValue: any, ref: string): number | undefined {
    if (typeof gpsValue === 'number') {
      return ref === 'S' || ref === 'W' ? -gpsValue : gpsValue;
    }

    if (typeof gpsValue === 'string') {
      // Parse formats like "40 deg 44' 54.36\" N"
      const parts = gpsValue.match(/(\d+)\s*deg\s*(\d+)'\s*([\d.]+)"/);
      if (parts) {
        const degrees = parseFloat(parts[1]);
        const minutes = parseFloat(parts[2]);
        const seconds = parseFloat(parts[3]);
        let decimal = degrees + minutes / 60 + seconds / 3600;

        if (ref === 'S' || ref === 'W') {
          decimal = -decimal;
        }

        return decimal;
      }
    }

    return undefined;
  }

  /**
   * Parse text output (fallback)
   */
  private parseTextOutput(rawOutput: string): ExifToolOutput {
    const lines = rawOutput.split('\n');
    const metadata: Record<string, any> = {};
    let fileName = 'unknown';

    for (const line of lines) {
      const match = line.match(/(.+?)\s*:\s*(.+)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        metadata[key] = value;

        if (key.toLowerCase().includes('filename')) {
          fileName = value;
        }
      }
    }

    return {
      fileName,
      fileSize: metadata['File Size'],
      fileType: metadata['File Type'],
      mimeType: metadata['MIME Type'],
      imageWidth: metadata['Image Width'] ? parseInt(metadata['Image Width']) : undefined,
      imageHeight: metadata['Image Height'] ? parseInt(metadata['Image Height']) : undefined,
      camera: {
        make: metadata['Make'],
        model: metadata['Camera Model Name'] || metadata['Model'],
        software: metadata['Software'],
      },
      dateTime: {
        original: metadata['Date/Time Original'],
        digitized: metadata['Create Date'],
        modified: metadata['Modify Date'],
      },
      metadata,
      executionTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute ExifTool with progress reporting
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
