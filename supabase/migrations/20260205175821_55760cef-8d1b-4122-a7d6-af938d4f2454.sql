-- Disable RLS on all tables since there's only one user
ALTER TABLE public.daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_events DISABLE ROW LEVEL SECURITY;

-- Drop the user_id requirement by making it nullable with a default
ALTER TABLE public.daily_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.daily_logs ALTER COLUMN user_id SET DEFAULT NULL;

ALTER TABLE public.goals ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.goals ALTER COLUMN user_id SET DEFAULT NULL;

ALTER TABLE public.medical_events ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.medical_events ALTER COLUMN user_id SET DEFAULT NULL;