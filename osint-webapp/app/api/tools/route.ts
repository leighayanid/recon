/**
 * Tools API Routes
 * GET /api/tools - List available tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllToolsMetadata } from '@/lib/tools/registry';
import { formatErrorResponse, logError } from '@/lib/utils/errors';

/**
 * GET /api/tools
 * Get all available OSINT tools and their metadata
 */
export async function GET(request: NextRequest) {
  try {
    const tools = getAllToolsMetadata();

    return NextResponse.json({
      success: true,
      data: {
        tools,
        count: Object.keys(tools).length,
      },
    });
  } catch (error) {
    logError(error as Error);
    const errorResponse = formatErrorResponse(
      error as Error,
      process.env.NODE_ENV === 'development'
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
