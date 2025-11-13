-- Phase 8: Admin & Monitoring - RLS Policies

-- Enable RLS on new tables
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Rate Limits Policies
-- ============================================================================

-- Admins can do everything with rate limits
CREATE POLICY "Admins can view all rate limits" ON public.rate_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create rate limits" ON public.rate_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update rate limits" ON public.rate_limits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete rate limits" ON public.rate_limits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits" ON public.rate_limits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- System Alerts Policies
-- ============================================================================

-- Admins can view all system alerts
CREATE POLICY "Admins can view all system alerts" ON public.system_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create system alerts
CREATE POLICY "Admins can create system alerts" ON public.system_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update system alerts
CREATE POLICY "Admins can update system alerts" ON public.system_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete system alerts
CREATE POLICY "Admins can delete system alerts" ON public.system_alerts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- System Metrics Policies
-- ============================================================================

-- Admins can view all system metrics
CREATE POLICY "Admins can view all system metrics" ON public.system_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert metrics (no user_id check)
CREATE POLICY "System can insert metrics" ON public.system_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can delete old metrics
CREATE POLICY "Admins can delete system metrics" ON public.system_metrics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- Data Exports Policies
-- ============================================================================

-- Users can view their own data exports
CREATE POLICY "Users can view their own data exports" ON public.data_exports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all data exports
CREATE POLICY "Admins can view all data exports" ON public.data_exports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can create their own data export requests
CREATE POLICY "Users can create data exports" ON public.data_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- System can update export status
CREATE POLICY "System can update data exports" ON public.data_exports
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Users can delete their own exports
CREATE POLICY "Users can delete their own data exports" ON public.data_exports
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- Enhanced Profiles Policies for Admin Access
-- ============================================================================

-- Drop existing profile policies if they exist and recreate with admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Users can update their own profile (but not role or suspension status)
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Ensure users can't change their own role or suspension status
    (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
      is_suspended = (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ============================================================================
-- Enhanced Audit Logs Policies for Admin Access
-- ============================================================================

-- Drop existing audit log policies and recreate
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Enhanced Usage Logs Policies for Admin Access
-- ============================================================================

-- Drop existing usage log policies and recreate
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Admins can view all usage logs" ON public.usage_logs;

-- Users can view their own usage logs
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all usage logs
CREATE POLICY "Admins can view all usage logs" ON public.usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert usage logs
CREATE POLICY "System can insert usage logs" ON public.usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Admin Access to All Resources
-- ============================================================================

-- Admins can view all investigations
CREATE POLICY "Admins can view all investigations" ON public.investigations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- Function Security
-- ============================================================================

-- Only admins can execute admin functions
REVOKE EXECUTE ON FUNCTION public.get_system_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_details(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_usage_analytics(INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_analytics(INTEGER) TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 'Allow admins to view all user profiles';
COMMENT ON POLICY "Admins can update any profile" ON public.profiles IS 'Allow admins to update any user profile including role and suspension status';
COMMENT ON POLICY "Admins can view all audit logs" ON public.audit_logs IS 'Allow admins to view all audit log entries';
COMMENT ON POLICY "Admins can view all usage logs" ON public.usage_logs IS 'Allow admins to view all usage logs';
COMMENT ON POLICY "Admins can view all investigations" ON public.investigations IS 'Allow admins to view all investigations';
COMMENT ON POLICY "Admins can view all jobs" ON public.jobs IS 'Allow admins to view all jobs';
COMMENT ON POLICY "Admins can view all reports" ON public.reports IS 'Allow admins to view all reports';
