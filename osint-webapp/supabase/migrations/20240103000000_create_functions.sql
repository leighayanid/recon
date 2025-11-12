-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_investigations', (SELECT COUNT(*) FROM public.investigations WHERE user_id = user_uuid),
    'total_jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = user_uuid),
    'completed_jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = user_uuid AND status = 'completed'),
    'failed_jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = user_uuid AND status = 'failed'),
    'total_reports', (SELECT COUNT(*) FROM public.reports WHERE user_id = user_uuid),
    'tools_usage', (
      SELECT json_object_agg(tool_name, count)
      FROM (
        SELECT tool_name, COUNT(*) as count
        FROM public.jobs
        WHERE user_id = user_uuid
        GROUP BY tool_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search investigations
CREATE OR REPLACE FUNCTION public.search_investigations(
  user_uuid UUID,
  search_query TEXT,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  status TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    i.description,
    i.status,
    i.tags,
    i.created_at,
    GREATEST(
      similarity(i.name, search_query),
      similarity(COALESCE(i.description, ''), search_query)
    ) as similarity
  FROM public.investigations i
  WHERE i.user_id = user_uuid
    AND (
      i.name ILIKE '%' || search_query || '%'
      OR i.description ILIKE '%' || search_query || '%'
      OR search_query = ANY(i.tags)
    )
  ORDER BY similarity DESC, i.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
