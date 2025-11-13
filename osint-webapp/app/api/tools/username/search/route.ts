import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { addJob } from "@/lib/queue/jobQueue"
import { ValidationError } from "@/lib/utils/errors"
import { usernameSchema } from "@/lib/utils/validation"
import { z } from "zod"
import type { Database } from "@/types/database.types"

// Input schema for username search
const searchInputSchema = z.object({
  username: usernameSchema,
  timeout: z.number().min(10).max(300).optional().default(60),
  sites: z.array(z.string()).optional(),
  proxy: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: "Unauthorized", statusCode: 401 } },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = searchInputSchema.parse(body)

    // Create job in database
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        tool_name: "sherlock",
        status: "pending",
        input_data: validatedData,
        progress: 0,
      } as any)
      .select()
      .single<Database['public']['Tables']['jobs']['Row']>()

    if (jobError) {
      console.error("Failed to create job:", jobError)
      return NextResponse.json(
        { error: { message: "Failed to create job", statusCode: 500 } },
        { status: 500 }
      )
    }

    // Add job to queue
    try {
      await addJob("sherlock", validatedData, user.id, undefined, {
        priority: 5,
      })
    } catch (queueError) {
      console.error("Failed to add job to queue:", queueError)

      // Update job status to failed
      await (supabase as any)
        .from("jobs")
        .update({
          status: "failed",
          error_message: "Failed to queue job",
        })
        .eq("id", jobData.id)

      return NextResponse.json(
        { error: { message: "Failed to queue job", statusCode: 500 } },
        { status: 500 }
      )
    }

    // Log usage
    await (supabase as any).from("usage_logs").insert({
      user_id: user.id,
      tool_name: "sherlock",
      action: "search",
      metadata: {
        username: validatedData.username,
        timeout: validatedData.timeout,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: jobData.id,
        status: jobData.status,
        progress: jobData.progress,
        createdAt: jobData.created_at,
      },
    })
  } catch (error) {
    console.error("Username search API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: "Validation error",
            statusCode: 400,
            errors: (error as any).errors.map((e: any) => `${e.path.join(".")}: ${e.message}`),
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
            statusCode: error.statusCode,
          },
        },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: "Internal server error",
          statusCode: 500,
        },
      },
      { status: 500 }
    )
  }
}
