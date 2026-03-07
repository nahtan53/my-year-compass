-- Ajouter l'option "poisson" (fish) pour déjeuner et dîner

alter table public.daily_logs
  drop constraint if exists daily_logs_meat_lunch_check,
  add constraint daily_logs_meat_lunch_check
    check (meat_lunch in ('none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'fish', 'vegetarian'));

alter table public.daily_logs
  drop constraint if exists daily_logs_meat_dinner_check,
  add constraint daily_logs_meat_dinner_check
    check (meat_dinner in ('none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'fish', 'vegetarian'));
