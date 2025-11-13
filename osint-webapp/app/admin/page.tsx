// Admin Dashboard Page

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?redirect=/admin')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_suspended')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.is_suspended) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, monitor system health, and view analytics
        </p>
      </div>

      <AdminDashboard />
    </div>
  )
}
