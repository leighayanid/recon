-- Seed data for development

-- Note: Sample data requires actual user UUIDs from auth.users
-- You'll need to sign up through the app first, then add this data manually
-- or update this file with real UUIDs

-- Example:
-- After creating a user through signup, get their UUID:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then uncomment and update the following with real UUIDs:

-- INSERT INTO public.investigations (user_id, name, description, tags)
-- VALUES
--   (
--     'replace-with-real-user-uuid',
--     'Sample Investigation',
--     'This is a sample investigation for testing',
--     ARRAY['test', 'sample']
--   );

-- INSERT INTO public.jobs (user_id, tool_name, status, input_data, progress)
-- VALUES
--   (
--     'replace-with-real-user-uuid',
--     'sherlock',
--     'completed',
--     '{"username": "testuser"}'::jsonb,
--     100
--   );
