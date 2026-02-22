-- Table recettes (à exécuter dans Supabase SQL Editor si pas déjà fait)
create table if not exists public.recipes (
  id text primary key default (gen_random_uuid()::text),
  title text not null,
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  duration_minutes integer,
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;
create policy "Allow all for recipes" on public.recipes for all using (true) with check (true);
