-- Ajout du flag \"négociation avec le personnel\" (tracking discret)
-- À exécuter dans Supabase : SQL Editor → coller puis Run

alter table public.daily_logs
  add column if not exists negotiation_staff boolean not null default false;

