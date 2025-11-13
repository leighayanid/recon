-- Phase 8: Admin & Monitoring - Database Schema

-- Add missing columns to profiles table if they don't exist
DO $$
BEGIN
  -- Add last_sign_in_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'profiles'
                 AND column_name = 'last_sign_in_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add is_suspended column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'profiles'
                 AND column_name = 'is_suspended') THEN
    ALTER TABLE public.profiles ADD COLUMN is_suspended BOOLEAN DEFAULT false;
  END IF;

  -- Add suspension_reason column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'profiles'
                 AND column_name = 'suspension_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN suspension_reason TEXT;
  END IF;
END $$;

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'admin', 'pro')),
  tool_name TEXT,
  max_requests INTEGER NOT NULL CHECK (max_requests > 0),
  window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure at least one of user_id, role, or tool_name is set
  CHECK (user_id IS NOT NULL OR role IS NOT NULL OR tool_name IS NOT NULL)
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_metrics table for tracking system health
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('database', 'redis', 'storage', 'queue', 'api', 'cpu', 'memory')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  value NUMERIC,
  response_time_ms NUMERIC,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_exports table for tracking export requests
CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('users', 'jobs', 'investigations', 'reports', 'audit_logs', 'usage_logs')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'xlsx')),
  filters JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_role ON public.rate_limits(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_tool_name ON public.rate_limits(tool_name) WHERE tool_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_is_active ON public.rate_limits(is_active);

CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_resolved ON public.system_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON public.system_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_type ON public.system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_status ON public.system_metrics(status);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON public.system_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON public.data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON public.data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_created_at ON public.data_exports(created_at DESC);

-- Add indexes for admin queries on existing tables
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in_at ON public.profiles(last_sign_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);

CREATE INDEX IF NOT EXISTS idx_usage_logs_tool_name ON public.usage_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);

-- Create view for user statistics
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  p.last_sign_in_at,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as jobs_completed,
  COUNT(DISTINCT CASE WHEN j.status = 'failed' THEN j.id END) as jobs_failed,
  COUNT(DISTINCT i.id) as total_investigations,
  COUNT(DISTINCT r.id) as total_reports,
  COUNT(DISTINCT w.id) as total_webhooks,
  COUNT(DISTINCT b.id) as total_batch_jobs,
  MAX(j.created_at) as last_job_created,
  (
    SELECT j2.tool_name
    FROM public.jobs j2
    WHERE j2.user_id = p.id
    GROUP BY j2.tool_name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as most_used_tool
FROM public.profiles p
LEFT JOIN public.jobs j ON p.id = j.user_id
LEFT JOIN public.investigations i ON p.id = i.user_id
LEFT JOIN public.reports r ON p.id = r.user_id
LEFT JOIN public.webhooks w ON p.id = w.user_id
LEFT JOIN public.batch_jobs b ON p.id = b.user_id
GROUP BY p.id, p.email, p.full_name, p.role, p.created_at, p.last_sign_in_at;

-- Create view for tool usage statistics
CREATE OR REPLACE VIEW public.tool_usage_statistics AS
SELECT
  j.tool_name,
  COUNT(*) as total_executions,
  COUNT(DISTINCT j.user_id) as total_users,
  COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed,
  AVG(EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) * 1000) as avg_execution_time_ms,
  COUNT(CASE WHEN j.created_at >= CURRENT_DATE THEN 1 END) as executions_today,
  COUNT(CASE WHEN j.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as executions_week,
  COUNT(CASE WHEN j.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as executions_month,
  MAX(j.created_at) as last_execution
FROM public.jobs j
GROUP BY j.tool_name;

-- Create view for system overview
CREATE OR REPLACE VIEW public.system_overview AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'pro') as pro_users,
  (SELECT COUNT(*) FROM public.jobs) as total_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'pending') as pending_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'running') as running_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'completed') as completed_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'failed') as failed_jobs,
  (SELECT COUNT(*) FROM public.jobs WHERE created_at >= CURRENT_DATE) as jobs_today,
  (SELECT COUNT(*) FROM public.investigations) as total_investigations,
  (SELECT COUNT(*) FROM public.investigations WHERE status = 'active') as active_investigations,
  (SELECT COUNT(*) FROM public.reports) as total_reports,
  (SELECT COUNT(*) FROM public.webhooks) as total_webhooks,
  (SELECT COUNT(*) FROM public.webhooks WHERE is_active = true) as active_webhooks,
  (SELECT COUNT(*) FROM public.batch_jobs) as total_batch_jobs;

-- Function to get system statistics
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'users', (
      SELECT json_build_object(
        'total', COUNT(*),
        'active_today', COUNT(*) FILTER (WHERE last_sign_in_at >= CURRENT_DATE),
        'active_week', COUNT(*) FILTER (WHERE last_sign_in_at >= CURRENT_DATE - INTERVAL '7 days'),
        'active_month', COUNT(*) FILTER (WHERE last_sign_in_at >= CURRENT_DATE - INTERVAL '30 days'),
        'new_today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'new_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'new_month', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'),
        'by_role', (
          SELECT json_object_agg(role, cnt)
          FROM (SELECT role, COUNT(*) as cnt FROM public.profiles GROUP BY role) as role_counts
        )
      )
      FROM public.profiles
    ),
    'jobs', (
      SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'running', COUNT(*) FILTER (WHERE status = 'running'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'month', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'),
        'avg_execution_time_ms', COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE completed_at IS NOT NULL), 0)
      )
      FROM public.jobs
    ),
    'investigations', (
      SELECT json_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE status = 'active'),
        'archived', COUNT(*) FILTER (WHERE status = 'archived'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'month', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')
      )
      FROM public.investigations
    ),
    'reports', (
      SELECT json_build_object(
        'total', COUNT(*),
        'public', COUNT(*) FILTER (WHERE is_public = true),
        'private', COUNT(*) FILTER (WHERE is_public = false),
        'today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'month', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')
      )
      FROM public.reports
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user details for admin
CREATE OR REPLACE FUNCTION public.get_admin_user_details(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = target_user_id),
    'stats', (
      SELECT json_build_object(
        'total_jobs', COUNT(DISTINCT j.id),
        'total_investigations', COUNT(DISTINCT i.id),
        'total_reports', COUNT(DISTINCT r.id),
        'api_keys_count', COUNT(DISTINCT ak.id),
        'webhooks_count', COUNT(DISTINCT w.id),
        'batch_jobs_count', COUNT(DISTINCT b.id)
      )
      FROM public.profiles p
      LEFT JOIN public.jobs j ON p.id = j.user_id
      LEFT JOIN public.investigations i ON p.id = i.user_id
      LEFT JOIN public.reports r ON p.id = r.user_id
      LEFT JOIN public.api_keys ak ON p.id = ak.user_id
      LEFT JOIN public.webhooks w ON p.id = w.user_id
      LEFT JOIN public.batch_jobs b ON p.id = b.user_id
      WHERE p.id = target_user_id
    ),
    'recent_activity', (
      SELECT json_agg(
        json_build_object(
          'id', al.id,
          'action', al.action,
          'resource_type', al.resource_type,
          'resource_id', al.resource_id,
          'created_at', al.created_at,
          'ip_address', al.ip_address
        )
      )
      FROM public.audit_logs al
      WHERE al.user_id = target_user_id
      ORDER BY al.created_at DESC
      LIMIT 20
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage analytics
CREATE OR REPLACE FUNCTION public.get_usage_analytics(days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'date', date::TEXT,
      'jobs_created', COALESCE(jobs_created, 0),
      'jobs_completed', COALESCE(jobs_completed, 0),
      'jobs_failed', COALESCE(jobs_failed, 0),
      'investigations_created', COALESCE(investigations_created, 0),
      'reports_generated', COALESCE(reports_generated, 0),
      'new_users', COALESCE(new_users, 0),
      'active_users', COALESCE(active_users, 0)
    )
  )
  INTO result
  FROM (
    SELECT
      dates.date,
      (SELECT COUNT(*) FROM public.jobs WHERE created_at::DATE = dates.date) as jobs_created,
      (SELECT COUNT(*) FROM public.jobs WHERE created_at::DATE = dates.date AND status = 'completed') as jobs_completed,
      (SELECT COUNT(*) FROM public.jobs WHERE created_at::DATE = dates.date AND status = 'failed') as jobs_failed,
      (SELECT COUNT(*) FROM public.investigations WHERE created_at::DATE = dates.date) as investigations_created,
      (SELECT COUNT(*) FROM public.reports WHERE created_at::DATE = dates.date) as reports_generated,
      (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE = dates.date) as new_users,
      (SELECT COUNT(DISTINCT user_id) FROM public.jobs WHERE created_at::DATE = dates.date) as active_users
    FROM generate_series(
      CURRENT_DATE - (days || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    ) AS dates(date)
    ORDER BY dates.date DESC
  ) as analytics;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at columns
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users (they will be filtered by RLS)
GRANT SELECT ON public.user_statistics TO authenticated;
GRANT SELECT ON public.tool_usage_statistics TO authenticated;
GRANT SELECT ON public.system_overview TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.rate_limits IS 'Configurable rate limiting rules for users, roles, or tools';
COMMENT ON TABLE public.system_alerts IS 'System-wide alerts and notifications for administrators';
COMMENT ON TABLE public.system_metrics IS 'Time-series system health metrics';
COMMENT ON TABLE public.data_exports IS 'Track admin data export requests';

COMMENT ON VIEW public.user_statistics IS 'Aggregated user statistics for admin panel';
COMMENT ON VIEW public.tool_usage_statistics IS 'Aggregated tool usage statistics';
COMMENT ON VIEW public.system_overview IS 'Quick system overview metrics';

COMMENT ON FUNCTION public.get_system_stats IS 'Get comprehensive system statistics (admin only)';
COMMENT ON FUNCTION public.get_admin_user_details IS 'Get detailed user information for admin panel (admin only)';
COMMENT ON FUNCTION public.get_usage_analytics IS 'Get time-series usage analytics (admin only)';
