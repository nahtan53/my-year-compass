create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  quadrant text check (quadrant in ('do', 'schedule', 'delegate', 'eliminate')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their tasks"
  on public.tasks for select using (auth.uid() = user_id);
create policy "Users can create their tasks"
  on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their tasks"
  on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their tasks"
  on public.tasks for delete using (auth.uid() = user_id);
