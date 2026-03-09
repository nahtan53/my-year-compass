export type GoalType = 'one-shot' | 'counter' | 'habit';

export type GoalStatus = 'todo' | 'in-progress' | 'done';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  category: string;
  icon: string;
  targetValue?: number;
  currentValue: number;
  status: GoalStatus;
  isCompleted: boolean;
}

export type SportStatus = 'rest' | 'running' | 'muscu' | 'other';

/** Type de viande / repas : déjeuner et dîner séparés */
export type MeatType =
  | 'none'
  | 'red'      // viande rouge
  | 'chicken'  // poulet
  | 'duck'     // canard
  | 'pork'     // porc
  | 'lamb'     // mouton
  | 'fish'     // poisson
  | 'vegetarian'; // végétarien

export interface DailyLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  sportStatus: SportStatus;
  /** Viande au déjeuner */
  meatLunch: MeatType;
  /** Viande au dîner */
  meatDinner: MeatType;
  alcohol: boolean;
  /** Nombre de « doses bar » consommées (0 si pas d'alcool) */
  alcoholUnits: number;
  screenLimit: boolean;
  reading: boolean;
  /** Négociation avec le personnel (tracking discret) */
  negotiationStaff: boolean;
  dailyPhrase: string;
}

export type MedicalEventType = 'dentist' | 'blood-donation' | 'doctor' | 'other';

export interface MedicalEvent {
  id: string;
  type: MedicalEventType;
  label: string;
  lastDate: string;
  nextDueDate: string;
  intervalMonths: number;
}
