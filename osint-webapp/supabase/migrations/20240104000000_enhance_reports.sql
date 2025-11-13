-- Phase 6: Enhance Reports Table
-- Add additional fields and indexes for report generation

-- Add template field to reports
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'executive-summary'
CHECK (template IN ('executive-summary', 'detailed-technical', 'investigation-timeline', 'evidence-collection', 'custom'));

-- Add expires_at for public link expiration
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add format field to track report format
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'pdf'
CHECK (format IN ('pdf', 'json', 'csv', 'html'));

-- Add generation metadata
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_investigation_id ON public.reports(investigation_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_is_public ON public.reports(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_reports_template ON public.reports(template);

-- Full-text search on report names
CREATE INDEX IF NOT EXISTS idx_reports_name_search ON public.reports USING gin(name gin_trgm_ops);

-- Add comment for documentation
COMMENT ON TABLE public.reports IS 'Stores generated reports from investigations with various formats and templates';
COMMENT ON COLUMN public.reports.template IS 'Report template type used for generation';
COMMENT ON COLUMN public.reports.expires_at IS 'Expiration timestamp for public report links';
COMMENT ON COLUMN public.reports.format IS 'Report export format (pdf, json, csv, html)';
COMMENT ON COLUMN public.reports.generation_metadata IS 'Additional metadata about report generation (generation time, options used, etc.)';
