-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- API Keys policies
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Investigations policies
CREATE POLICY "Users can view own investigations" ON public.investigations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investigations" ON public.investigations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investigations" ON public.investigations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investigations" ON public.investigations
  FOR DELETE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Investigation Items policies
CREATE POLICY "Users can view own investigation items" ON public.investigation_items
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

CREATE POLICY "Users can create own investigation items" ON public.investigation_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

CREATE POLICY "Users can update own investigation items" ON public.investigation_items
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

CREATE POLICY "Users can delete own investigation items" ON public.investigation_items
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

-- Reports policies
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Logs policies (read-only for users, write via service role)
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs policies (admin only, or via service role)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);
