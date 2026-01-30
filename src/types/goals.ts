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
export type MeatType = 'none' | 'chicken' | 'red';

export interface DailyLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  sportStatus: SportStatus;
  meatType: MeatType;
  alcohol: boolean;
  screenLimit: boolean;
  reading: boolean;
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
