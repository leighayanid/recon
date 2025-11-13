-- Phase 7: Row Level Security Policies for Webhooks and Batch Processing
-- Migration: 20240105000001_phase7_rls_policies.sql

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WEBHOOKS POLICIES
-- ============================================

-- Users can view their own webhooks
CREATE POLICY "Users can view own webhooks"
ON public.webhooks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own webhooks
CREATE POLICY "Users can create own webhooks"
ON public.webhooks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own webhooks
CREATE POLICY "Users can update own webhooks"
ON public.webhooks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own webhooks
CREATE POLICY "Users can delete own webhooks"
ON public.webhooks
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- WEBHOOK DELIVERIES POLICIES
-- ============================================

-- Users can view deliveries for their own webhooks
CREATE POLICY "Users can view own webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks
    WHERE webhooks.id = webhook_deliveries.webhook_id
    AND webhooks.user_id = auth.uid()
  )
);

-- System can insert webhook deliveries (handled by backend)
CREATE POLICY "System can insert webhook deliveries"
ON public.webhook_deliveries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.webhooks
    WHERE webhooks.id = webhook_deliveries.webhook_id
  )
);

-- System can update webhook deliveries (for retry logic)
CREATE POLICY "System can update webhook deliveries"
ON public.webhook_deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks
    WHERE webhooks.id = webhook_deliveries.webhook_id
  )
);

-- Users can delete deliveries for their own webhooks
CREATE POLICY "Users can delete own webhook deliveries"
ON public.webhook_deliveries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.webhooks
    WHERE webhooks.id = webhook_deliveries.webhook_id
    AND webhooks.user_id = auth.uid()
  )
);

-- ============================================
-- BATCH JOBS POLICIES
-- ============================================

-- Users can view their own batch jobs
CREATE POLICY "Users can view own batch jobs"
ON public.batch_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own batch jobs
CREATE POLICY "Users can create own batch jobs"
ON public.batch_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own batch jobs
CREATE POLICY "Users can update own batch jobs"
ON public.batch_jobs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own batch jobs
CREATE POLICY "Users can delete own batch jobs"
ON public.batch_jobs
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- BATCH OPERATIONS POLICIES
-- ============================================

-- Users can view operations for their own batch jobs
CREATE POLICY "Users can view own batch operations"
ON public.batch_operations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.batch_jobs
    WHERE batch_jobs.id = batch_operations.batch_job_id
    AND batch_jobs.user_id = auth.uid()
  )
);

-- Users can create operations for their own batch jobs
CREATE POLICY "Users can create own batch operations"
ON public.batch_operations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.batch_jobs
    WHERE batch_jobs.id = batch_operations.batch_job_id
    AND batch_jobs.user_id = auth.uid()
  )
);

-- System can update batch operations (for execution)
CREATE POLICY "System can update batch operations"
ON public.batch_operations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.batch_jobs
    WHERE batch_jobs.id = batch_operations.batch_job_id
  )
);

-- Users can delete operations from their own batch jobs
CREATE POLICY "Users can delete own batch operations"
ON public.batch_operations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.batch_jobs
    WHERE batch_jobs.id = batch_operations.batch_job_id
    AND batch_jobs.user_id = auth.uid()
  )
);

-- ============================================
-- BATCH TEMPLATES POLICIES
-- ============================================

-- Users can view their own templates and public templates
CREATE POLICY "Users can view own and public templates"
ON public.batch_templates
FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
ON public.batch_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.batch_templates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.batch_templates
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ADMIN OVERRIDE POLICIES
-- ============================================

-- Admin users can view all webhooks
CREATE POLICY "Admins can view all webhooks"
ON public.webhooks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin users can view all webhook deliveries
CREATE POLICY "Admins can view all webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin users can view all batch jobs
CREATE POLICY "Admins can view all batch jobs"
ON public.batch_jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin users can view all batch operations
CREATE POLICY "Admins can view all batch operations"
ON public.batch_operations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin users can view all batch templates
CREATE POLICY "Admins can view all batch templates"
ON public.batch_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Users can view own webhooks" ON public.webhooks IS 'Users can only view their own webhooks';
COMMENT ON POLICY "Users can view own batch jobs" ON public.batch_jobs IS 'Users can only view their own batch jobs';
COMMENT ON POLICY "Users can view own and public templates" ON public.batch_templates IS 'Users can view their own templates and public templates created by others';
