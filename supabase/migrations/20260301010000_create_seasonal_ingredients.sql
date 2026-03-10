-- Table des ingrédients de saison, par mois (1-12)
-- À exécuter dans Supabase : SQL Editor → Run

create table if not exists public.seasonal_ingredients (
  id text primary key default (gen_random_uuid()::text),
  name text not null,         -- ex: "courgette", "tomate"
  month int not null check (month between 1 and 12),
  category text,              -- optionnel: "fruit", "legume", etc.
  created_at timestamptz default now()
);

alter table public.seasonal_ingredients enable row level security;
create policy "Allow all for seasonal_ingredients"
  on public.seasonal_ingredients
  for all
  using (true)
  with check (true);

