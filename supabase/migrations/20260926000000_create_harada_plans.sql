create table if not exists public.harada_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.harada_plans enable row level security;

drop policy if exists "Allow all for harada_plans" on public.harada_plans;
drop policy if exists "Users can view their Harada plan" on public.harada_plans;
drop policy if exists "Users can create their Harada plan" on public.harada_plans;
drop policy if exists "Users can update their Harada plan" on public.harada_plans;
drop policy if exists "Users can delete their Harada plan" on public.harada_plans;

create policy "Users can view their Harada plan"
  on public.harada_plans for select using (auth.uid() = user_id);
create policy "Users can create their Harada plan"
  on public.harada_plans for insert with check (auth.uid() = user_id);
create policy "Users can update their Harada plan"
  on public.harada_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their Harada plan"
  on public.harada_plans for delete using (auth.uid() = user_id);