import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Create a singleton client for client-side
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Only create client if we have valid credentials
    if (supabaseUrl && supabaseAnonKey) {
      client = createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey
      )
    }
  }
  return client!
}
