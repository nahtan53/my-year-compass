-- My Year Compass - Schéma Supabase
-- À exécuter dans Supabase : SQL Editor → New query → Coller et Run

-- Table des objectifs (goals)
create table if not exists public.goals (
  id text primary key default (gen_random_uuid()::text),
  title text not null,
  type text not null check (type in ('one-shot', 'counter', 'habit')),
  category text not null,
  icon text not null,
  target_value integer,
  current_value integer not null default 0,
  status text not null check (status in ('todo', 'in-progress', 'done')) default 'todo',
  is_completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table des logs quotidiens (déjeuner et dîner séparés)
create table if not exists public.daily_logs (
  id text primary key default (gen_random_uuid()::text),
  date date not null unique,
  sport_status text not null check (sport_status in ('rest', 'running', 'muscu', 'other')),
  meat_lunch text not null default 'none' check (meat_lunch in ('none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'fish', 'vegetarian')),
  meat_dinner text not null default 'none' check (meat_dinner in ('none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'fish', 'vegetarian')),
  alcohol boolean not null default false,
  screen_limit boolean not null default false,
  reading boolean not null default false,
  negotiation_staff boolean not null default false,
  daily_phrase text default '',
  created_at timestamptz default now()
);

-- Table des événements médicaux
create table if not exists public.medical_events (
  id text primary key default (gen_random_uuid()::text),
  type text not null check (type in ('dentist', 'blood-donation', 'doctor', 'other')),
  label text not null,
  last_date date not null,
  next_due_date date not null,
  interval_months integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pour les requêtes courantes
create index if not exists idx_daily_logs_date on public.daily_logs (date);
create index if not exists idx_goals_status on public.goals (status);
create index if not exists idx_medical_events_next_due on public.medical_events (next_due_date);

-- Politique : tout le monde peut lire/écrire (à affiner plus tard avec l’auth)
alter table public.goals enable row level security;
alter table public.daily_logs enable row level security;
alter table public.medical_events enable row level security;

create policy "Allow all for goals" on public.goals for all using (true) with check (true);
create policy "Allow all for daily_logs" on public.daily_logs for all using (true) with check (true);
create policy "Allow all for medical_events" on public.medical_events for all using (true) with check (true);
