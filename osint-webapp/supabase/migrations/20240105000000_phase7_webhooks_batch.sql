-- Phase 7: Advanced Features - Webhooks and Batch Processing
-- Migration: 20240105000000_phase7_webhooks_batch.sql

-- ============================================
-- WEBHOOKS
-- ============================================

-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT, -- For HMAC signature verification
  headers JSONB DEFAULT '{}', -- Custom headers to include
  is_active BOOLEAN DEFAULT true,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_url CHECK (url ~* '^https?://'),
  CONSTRAINT non_empty_events CHECK (array_length(events, 1) > 0)
);

-- Webhook deliveries table (for tracking delivery attempts)
CREATE TABLE public.webhook_deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for webhooks
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhooks_is_active ON public.webhooks(is_active);
CREATE INDEX idx_webhooks_events ON public.webhooks USING GIN(events);
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON public.webhook_deliveries(next_retry_at)
  WHERE status = 'retrying';
CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries(created_at);

-- Comments for documentation
COMMENT ON TABLE public.webhooks IS 'User-defined webhooks for event notifications';
COMMENT ON TABLE public.webhook_deliveries IS 'Webhook delivery attempts and results';
COMMENT ON COLUMN public.webhooks.events IS 'Array of event types this webhook subscribes to';
COMMENT ON COLUMN public.webhooks.secret IS 'Secret key for HMAC signature verification';
COMMENT ON COLUMN public.webhook_deliveries.attempts IS 'Number of delivery attempts made';

-- ============================================
-- BATCH PROCESSING
-- ============================================

-- Batch jobs table
CREATE TABLE public.batch_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  investigation_id UUID REFERENCES public.investigations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_operations INTEGER NOT NULL DEFAULT 0,
  completed_operations INTEGER DEFAULT 0,
  failed_operations INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  options JSONB DEFAULT '{}', -- Execution options (parallel, max_parallel, etc.)
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_operation_counts CHECK (
    completed_operations >= 0 AND
    failed_operations >= 0 AND
    completed_operations + failed_operations <= total_operations
  )
);

-- Batch operations table (individual operations within a batch)
CREATE TABLE public.batch_operations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  batch_job_id UUID REFERENCES public.batch_jobs(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL, -- Link to actual job
  tool_name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Batch templates table (reusable batch operation templates)
CREATE TABLE public.batch_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  operations JSONB NOT NULL, -- Array of operation definitions
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for batch processing
CREATE INDEX idx_batch_jobs_user_id ON public.batch_jobs(user_id);
CREATE INDEX idx_batch_jobs_investigation_id ON public.batch_jobs(investigation_id);
CREATE INDEX idx_batch_jobs_status ON public.batch_jobs(status);
CREATE INDEX idx_batch_jobs_created_at ON public.batch_jobs(created_at);
CREATE INDEX idx_batch_operations_batch_job_id ON public.batch_operations(batch_job_id);
CREATE INDEX idx_batch_operations_job_id ON public.batch_operations(job_id);
CREATE INDEX idx_batch_operations_status ON public.batch_operations(status);
CREATE INDEX idx_batch_operations_tool_name ON public.batch_operations(tool_name);
CREATE INDEX idx_batch_templates_user_id ON public.batch_templates(user_id);
CREATE INDEX idx_batch_templates_is_public ON public.batch_templates(is_public);

-- Full-text search indexes
CREATE INDEX idx_batch_jobs_name_search ON public.batch_jobs USING gin(to_tsvector('english', name));
CREATE INDEX idx_batch_templates_name_search ON public.batch_templates USING gin(to_tsvector('english', name));

-- Comments for documentation
COMMENT ON TABLE public.batch_jobs IS 'Batch jobs containing multiple tool operations';
COMMENT ON TABLE public.batch_operations IS 'Individual operations within a batch job';
COMMENT ON TABLE public.batch_templates IS 'Reusable templates for common batch operations';
COMMENT ON COLUMN public.batch_jobs.options IS 'Execution options: parallel, max_parallel, stop_on_error, etc.';
COMMENT ON COLUMN public.batch_operations.execution_time_ms IS 'Time taken to execute the operation in milliseconds';

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update webhook statistics after delivery
CREATE OR REPLACE FUNCTION update_webhook_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE public.webhooks
    SET
      total_deliveries = total_deliveries + 1,
      successful_deliveries = successful_deliveries + 1,
      last_delivery_at = NEW.delivered_at,
      updated_at = NOW()
    WHERE id = NEW.webhook_id;
  ELSIF NEW.status = 'failed' AND NEW.attempts >= NEW.max_attempts THEN
    UPDATE public.webhooks
    SET
      total_deliveries = total_deliveries + 1,
      failed_deliveries = failed_deliveries + 1,
      last_error = NEW.error_message,
      updated_at = NOW()
    WHERE id = NEW.webhook_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for webhook statistics
CREATE TRIGGER trigger_update_webhook_stats
AFTER UPDATE ON public.webhook_deliveries
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_webhook_stats();

-- Function to update batch job progress
CREATE OR REPLACE FUNCTION update_batch_job_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_ops INTEGER;
  completed_ops INTEGER;
  failed_ops INTEGER;
  progress INTEGER;
BEGIN
  -- Count operations
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO total_ops, completed_ops, failed_ops
  FROM public.batch_operations
  WHERE batch_job_id = NEW.batch_job_id;

  -- Calculate progress
  IF total_ops > 0 THEN
    progress := ROUND((completed_ops + failed_ops)::NUMERIC / total_ops * 100);
  ELSE
    progress := 0;
  END IF;

  -- Update batch job
  UPDATE public.batch_jobs
  SET
    completed_operations = completed_ops,
    failed_operations = failed_ops,
    progress_percentage = progress,
    status = CASE
      WHEN completed_ops + failed_ops = total_ops THEN
        CASE WHEN failed_ops = total_ops THEN 'failed'::TEXT ELSE 'completed'::TEXT END
      WHEN completed_ops + failed_ops > 0 THEN 'processing'::TEXT
      ELSE 'pending'::TEXT
    END,
    updated_at = NOW(),
    completed_at = CASE
      WHEN completed_ops + failed_ops = total_ops THEN NOW()
      ELSE completed_at
    END
  WHERE id = NEW.batch_job_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for batch job progress
CREATE TRIGGER trigger_update_batch_job_progress
AFTER INSERT OR UPDATE ON public.batch_operations
FOR EACH ROW
WHEN (NEW.status IN ('completed', 'failed', 'cancelled'))
EXECUTE FUNCTION update_batch_job_progress();

-- Function to increment batch template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metadata ? 'template_id' THEN
    UPDATE public.batch_templates
    SET usage_count = usage_count + 1
    WHERE id = (NEW.metadata->>'template_id')::UUID;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for template usage tracking
CREATE TRIGGER trigger_increment_template_usage
AFTER INSERT ON public.batch_jobs
FOR EACH ROW
EXECUTE FUNCTION increment_template_usage();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE TRIGGER trigger_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_batch_jobs_updated_at
BEFORE UPDATE ON public.batch_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_batch_templates_updated_at
BEFORE UPDATE ON public.batch_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR STATISTICS
-- ============================================

-- Webhook statistics view
CREATE OR REPLACE VIEW public.webhook_stats AS
SELECT
  w.id,
  w.user_id,
  w.url,
  w.is_active,
  w.total_deliveries,
  w.successful_deliveries,
  w.failed_deliveries,
  CASE
    WHEN w.total_deliveries > 0 THEN
      ROUND((w.successful_deliveries::NUMERIC / w.total_deliveries * 100)::NUMERIC, 2)
    ELSE 0
  END as success_rate_percentage,
  w.last_delivery_at,
  COUNT(wd.id) FILTER (WHERE wd.created_at > NOW() - INTERVAL '24 hours') as deliveries_24h,
  COUNT(wd.id) FILTER (WHERE wd.status = 'success' AND wd.created_at > NOW() - INTERVAL '24 hours') as successful_deliveries_24h
FROM public.webhooks w
LEFT JOIN public.webhook_deliveries wd ON wd.webhook_id = w.id
GROUP BY w.id;

-- Batch job statistics view
CREATE OR REPLACE VIEW public.batch_job_stats AS
SELECT
  bj.id,
  bj.user_id,
  bj.name,
  bj.status,
  bj.total_operations,
  bj.completed_operations,
  bj.failed_operations,
  bj.progress_percentage,
  CASE
    WHEN bj.total_operations > 0 THEN
      ROUND((bj.completed_operations::NUMERIC / bj.total_operations * 100)::NUMERIC, 2)
    ELSE 0
  END as success_rate_percentage,
  AVG(bo.execution_time_ms) FILTER (WHERE bo.status = 'completed') as avg_execution_time_ms,
  MIN(bo.execution_time_ms) FILTER (WHERE bo.status = 'completed') as min_execution_time_ms,
  MAX(bo.execution_time_ms) FILTER (WHERE bo.status = 'completed') as max_execution_time_ms,
  bj.created_at,
  bj.started_at,
  bj.completed_at,
  CASE
    WHEN bj.completed_at IS NOT NULL AND bj.started_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (bj.completed_at - bj.started_at))::INTEGER
    ELSE NULL
  END as total_execution_time_seconds
FROM public.batch_jobs bj
LEFT JOIN public.batch_operations bo ON bo.batch_job_id = bj.id
GROUP BY bj.id;

-- Grant appropriate permissions (assuming RLS is enabled)
GRANT ALL ON public.webhooks TO authenticated;
GRANT ALL ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.batch_jobs TO authenticated;
GRANT ALL ON public.batch_operations TO authenticated;
GRANT ALL ON public.batch_templates TO authenticated;
GRANT SELECT ON public.webhook_stats TO authenticated;
GRANT SELECT ON public.batch_job_stats TO authenticated;
