-- Ajout d'une colonne pour suivre la quantité d'alcool (en « doses bar »)
-- À exécuter dans Supabase : SQL Editor → coller puis Run

alter table public.daily_logs
  add column if not exists alcohol_units integer not null default 0;

-- Backfill : pour l'historique, 1 dose pour chaque jour marqué comme alcool = true
update public.daily_logs
set alcohol_units = 1
where alcohol is true
  and alcohol_units = 0;

