import type { Goal, DailyLog } from '@/types/goals';

/**
 * Type de métrique suivie par une habitude (aligné sur les champs de daily_logs).
 */
export type HabitMetric = 'sport' | 'reading' | 'screen_limit';

/**
 * Détermine quelle métrique quotidienne est suivie par cet objectif habitude.
 * Convention basée sur category / icon / titre (pas de champ dédié en base pour l’instant).
 */
export function getHabitMetric(goal: Goal): HabitMetric | null {
  if (goal.type !== 'habit') return null;
  const cat = goal.category.toLowerCase();
  const title = goal.title.toLowerCase();
  const icon = goal.icon;

  if (cat.includes('sport') || icon === 'Dumbbell') return 'sport';
  if (cat.includes('lecture') || icon === 'Book' || icon === 'BookOpen') return 'reading';
  if (cat.includes('bien-être') && icon === 'Moon') return 'screen_limit';
  if (title.includes('écran') || title.includes('ecran')) return 'screen_limit';

  return null;
}

function normalizeDate(d: string): string {
  return d.includes('T') ? d.slice(0, 10) : d;
}

/**
 * Compte le nombre de jours qui comptent pour la métrique donnée (d’après les daily_logs).
 */
export function countDaysForMetric(metric: HabitMetric, dailyLogs: DailyLog[]): number {
  return dailyLogs.filter(log => {
    switch (metric) {
      case 'sport':
        return log.sportStatus !== 'rest';
      case 'reading':
        return log.reading;
      case 'screen_limit':
        return log.screenLimit;
      default:
        return false;
    }
  }).length;
}

/**
 * Pour un objectif habitude, calcule le currentValue à partir des logs.
 * Retourne null si l’objectif n’est pas une habitude ou n’a pas de métrique reconnue.
 */
export function computeHabitCurrentValue(goal: Goal, dailyLogs: DailyLog[]): number | null {
  const metric = getHabitMetric(goal);
  if (!metric) return null;
  return countDaysForMetric(metric, dailyLogs);
}
