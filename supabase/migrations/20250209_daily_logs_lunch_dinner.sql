-- Migration : déjeuner et dîner séparés + nouveaux types de viande
-- À exécuter dans Supabase SQL Editor si ta table daily_logs existe déjà avec meat_type

-- 1. Ajouter les colonnes (sans contrainte d’abord pour permettre le backfill)
alter table public.daily_logs
  add column if not exists meat_lunch text,
  add column if not exists meat_dinner text;

-- 2. Remplir à partir de l’ancien meat_type pour les lignes existantes
update public.daily_logs
set
  meat_lunch = coalesce(meat_type, 'none'),
  meat_dinner = coalesce(meat_type, 'none')
where meat_lunch is null or meat_dinner is null;

-- 3. Valeur par défaut et NOT NULL
alter table public.daily_logs
  alter column meat_lunch set default 'none',
  alter column meat_dinner set default 'none';

update public.daily_logs set meat_lunch = 'none' where meat_lunch is null;
update public.daily_logs set meat_dinner = 'none' where meat_dinner is null;

alter table public.daily_logs
  alter column meat_lunch set not null,
  alter column meat_dinner set not null;

-- 4. Contraintes des valeurs autorisées
alter table public.daily_logs
  drop constraint if exists daily_logs_meat_lunch_check,
  add constraint daily_logs_meat_lunch_check
    check (meat_lunch in ('none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'vegetarian'));

alter table public.daily_logs
  drop constraint if exists daily_logs_meat_dinner_check,
  add constraint daily_logs_meat_dinner_check
    check (meat_dinner in ('none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'vegetarian'));

-- Optionnel : supprimer l’ancienne colonne (décommente si tu n’as plus besoin de meat_type)
-- alter table public.daily_logs drop column if exists meat_type;
