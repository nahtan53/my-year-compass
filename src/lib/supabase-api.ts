import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Goal, DailyLog, MedicalEvent } from '@/types/goals';
import type { Recipe } from '@/types/recipes';

// Helpers : snake_case (DB) <-> camelCase (app)
function goalFromRow(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    title: String(row.title),
    type: row.type as Goal['type'],
    category: String(row.category),
    icon: String(row.icon),
    targetValue: row.target_value != null ? Number(row.target_value) : undefined,
    currentValue: Number(row.current_value),
    status: row.status as Goal['status'],
    isCompleted: Boolean(row.is_completed),
  };
}

function goalToRow(goal: Partial<Goal>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (goal.title != null) row.title = goal.title;
  if (goal.type != null) row.type = goal.type;
  if (goal.category != null) row.category = goal.category;
  if (goal.icon != null) row.icon = goal.icon;
  if (goal.targetValue != null) row.target_value = goal.targetValue;
  if (goal.currentValue != null) row.current_value = goal.currentValue;
  if (goal.status != null) row.status = goal.status;
  if (goal.isCompleted != null) row.is_completed = goal.isCompleted;
  return row;
}

function normalizeDate(value: unknown): string {
  const s = String(value ?? '');
  return s.includes('T') ? s.slice(0, 10) : s;
}

const MEAT_DEFAULT = 'none' as const;
function meatFromRow(value: unknown, fallback: string): DailyLog['meatLunch'] {
  const s = String(value ?? fallback);
  const allowed: DailyLog['meatLunch'][] = ['none', 'red', 'chicken', 'duck', 'pork', 'lamb', 'fish', 'vegetarian'];
  return allowed.includes(s as DailyLog['meatLunch']) ? (s as DailyLog['meatLunch']) : MEAT_DEFAULT;
}

function dailyLogFromRow(row: Record<string, unknown>): DailyLog {
  const oldMeat = row.meat_type != null ? String(row.meat_type) : MEAT_DEFAULT;
  return {
    id: String(row.id),
    date: normalizeDate(row.date),
    sportStatus: row.sport_status as DailyLog['sportStatus'],
    meatLunch: meatFromRow(row.meat_lunch, oldMeat),
    meatDinner: meatFromRow(row.meat_dinner, oldMeat),
    alcohol: Boolean(row.alcohol),
    screenLimit: Boolean(row.screen_limit),
    reading: Boolean(row.reading),
    negotiationStaff: Boolean((row as { negotiation_staff?: unknown }).negotiation_staff),
    dailyPhrase: String(row.daily_phrase ?? ''),
  };
}

function dailyLogToRow(log: Partial<DailyLog>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (log.date != null) row.date = log.date;
  if (log.sportStatus != null) row.sport_status = log.sportStatus;
  if (log.meatLunch != null) row.meat_lunch = log.meatLunch;
  if (log.meatDinner != null) row.meat_dinner = log.meatDinner;
  if (log.alcohol != null) row.alcohol = log.alcohol;
  if (log.screenLimit != null) row.screen_limit = log.screenLimit;
  if (log.reading != null) row.reading = log.reading;
  if (log.negotiationStaff != null) (row as { negotiation_staff?: boolean }).negotiation_staff = log.negotiationStaff;
  if (log.dailyPhrase != null) row.daily_phrase = log.dailyPhrase;
  return row;
}

function medicalEventFromRow(row: Record<string, unknown>): MedicalEvent {
  return {
    id: String(row.id),
    type: row.type as MedicalEvent['type'],
    label: String(row.label),
    lastDate: String(row.last_date),
    nextDueDate: String(row.next_due_date),
    intervalMonths: Number(row.interval_months),
  };
}

function medicalEventToRow(event: Partial<MedicalEvent>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (event.type != null) row.type = event.type;
  if (event.label != null) row.label = event.label;
  if (event.lastDate != null) row.last_date = event.lastDate;
  if (event.nextDueDate != null) row.next_due_date = event.nextDueDate;
  if (event.intervalMonths != null) row.interval_months = event.intervalMonths;
  return row;
}

// ——— Goals ———
export async function fetchGoals(): Promise<Goal[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(goalFromRow);
}

export async function upsertGoal(goal: Goal): Promise<Goal> {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase non configuré');
  const row = goalToRow(goal) as Record<string, unknown> & { id?: string };
  row.id = goal.id;
  const { data, error } = await supabase.from('goals').upsert(row, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return goalFromRow(data);
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase non configuré');
  const row = goalToRow(updates);
  const { data, error } = await supabase.from('goals').update(row).eq('id', id).select().single();
  if (error) throw error;
  return goalFromRow(data);
}

// ——— Daily logs ———
export async function fetchDailyLogs(): Promise<DailyLog[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase.from('daily_logs').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dailyLogFromRow);
}

export async function upsertDailyLog(log: DailyLog): Promise<DailyLog> {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase non configuré');
  const row = dailyLogToRow(log) as Record<string, unknown>;
  row.date = log.date;
  // Ne pas envoyer id pour les nouveaux logs : la DB le génère. En update, le conflit se fait sur date.
  const { data, error } = await supabase.from('daily_logs').upsert(row, { onConflict: 'date' }).select().single();
  if (error) {
    const msg = error.message || (error as { details?: string }).details || String(error);
    throw new Error(msg);
  }
  return dailyLogFromRow(data);
}

// ——— Medical events ———
export async function fetchMedicalEvents(): Promise<MedicalEvent[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase.from('medical_events').select('*').order('next_due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(medicalEventFromRow);
}

export async function upsertMedicalEvent(event: MedicalEvent): Promise<MedicalEvent> {
  if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase non configuré');
  const row = medicalEventToRow(event) as Record<string, unknown> & { id?: string };
  row.id = event.id;
  const { data, error } = await supabase.from('medical_events').upsert(row, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return medicalEventFromRow(data);
}

// ——— Recipes ———
function recipeFromRow(row: Record<string, unknown>): Recipe {
  const ingredients = row.ingredients;
  const steps = row.steps;
  return {
    id: String(row.id),
    title: String(row.title),
    ingredients: Array.isArray(ingredients) ? ingredients.map(String) : [],
    steps: Array.isArray(steps) ? steps.map(String) : [],
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
  };
}

export async function fetchRecipes(): Promise<Recipe[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase.from('recipes').select('*').order('title', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(recipeFromRow);
}
