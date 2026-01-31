-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('one-shot', 'counter', 'habit')),
  category TEXT NOT NULL DEFAULT 'Général',
  icon TEXT NOT NULL DEFAULT 'Target',
  target_value INTEGER,
  current_value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_logs table
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  sport_status TEXT NOT NULL DEFAULT 'rest' CHECK (sport_status IN ('rest', 'running', 'muscu', 'other')),
  meat_type TEXT NOT NULL DEFAULT 'none' CHECK (meat_type IN ('none', 'chicken', 'red')),
  alcohol BOOLEAN NOT NULL DEFAULT false,
  screen_limit BOOLEAN NOT NULL DEFAULT false,
  reading BOOLEAN NOT NULL DEFAULT false,
  daily_phrase TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create medical_events table
CREATE TABLE public.medical_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dentist', 'blood-donation', 'doctor', 'other')),
  label TEXT NOT NULL,
  last_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  interval_months INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals" 
ON public.goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for daily_logs
CREATE POLICY "Users can view their own daily logs" 
ON public.daily_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logs" 
ON public.daily_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs" 
ON public.daily_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs" 
ON public.daily_logs FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for medical_events
CREATE POLICY "Users can view their own medical events" 
ON public.medical_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medical events" 
ON public.medical_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical events" 
ON public.medical_events FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical events" 
ON public.medical_events FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_events_updated_at
BEFORE UPDATE ON public.medical_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();