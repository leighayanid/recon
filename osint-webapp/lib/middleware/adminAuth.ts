// Admin Authentication Middleware

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Check if the current user is an admin
 * Returns the user profile if admin, null otherwise
 */
export async function requireAdmin() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Unauthorized: Authentication required',
      status: 401
    }
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      authorized: false,
      error: 'Unauthorized: Profile not found',
      status: 401
    }
  }

  // Check if user is suspended
  if (profile.is_suspended) {
    return {
      authorized: false,
      error: 'Forbidden: Account is suspended',
      status: 403
    }
  }

  // Check if user is admin
  if (profile.role !== 'admin') {
    return {
      authorized: false,
      error: 'Forbidden: Admin access required',
      status: 403
    }
  }

  return {
    authorized: true,
    user: profile,
    userId: user.id
  }
}

/**
 * Check if the current user is authenticated
 * Returns the user profile if authenticated, null otherwise
 */
export async function requireAuth() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Unauthorized: Authentication required',
      status: 401
    }
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      authorized: false,
      error: 'Unauthorized: Profile not found',
      status: 401
    }
  }

  // Check if user is suspended
  if (profile.is_suspended) {
    return {
      authorized: false,
      error: 'Forbidden: Account is suspended',
      status: 403
    }
  }

  return {
    authorized: true,
    user: profile,
    userId: user.id
  }
}

/**
 * Check if the current user has a specific role
 */
export async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      error: 'Unauthorized: Authentication required',
      status: 401
    }
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      authorized: false,
      error: 'Unauthorized: Profile not found',
      status: 401
    }
  }

  // Check if user is suspended
  if (profile.is_suspended) {
    return {
      authorized: false,
      error: 'Forbidden: Account is suspended',
      status: 403
    }
  }

  // Check if user has allowed role
  if (!allowedRoles.includes(profile.role)) {
    return {
      authorized: false,
      error: `Forbidden: Required role: ${allowedRoles.join(' or ')}`,
      status: 403
    }
  }

  return {
    authorized: true,
    user: profile,
    userId: user.id
  }
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized', status: number = 401) {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status }
  )
}

/**
 * Wrapper to handle admin-only API routes
 */
export async function withAdmin<T>(
  handler: (userId: string, profile: any) => Promise<T>
): Promise<NextResponse | T> {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status)
  }

  try {
    return await handler(auth.userId!, auth.user!)
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * Wrapper to handle authenticated API routes
 */
export async function withAuth<T>(
  handler: (userId: string, profile: any) => Promise<T>
): Promise<NextResponse | T> {
  const auth = await requireAuth()

  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status)
  }

  try {
    return await handler(auth.userId!, auth.user!)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * Log admin action to audit logs
 */
export async function logAdminAction(
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  metadata: Record<string, any> = {},
  request?: Request
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Extract IP and user agent from request if provided
  let ipAddress = null
  let userAgent = null

  if (request) {
    ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                null
    userAgent = request.headers.get('user-agent') || null
  }

  await supabase
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata
    })
}
