import { Goal, DailyLog, MedicalEvent } from '@/types/goals';

export const mockGoals: Goal[] = [
  // One-shot goals
  {
    id: '1',
    title: 'Faire un portfolio',
    type: 'one-shot',
    category: 'Carrière',
    icon: 'Briefcase',
    currentValue: 0,
    status: 'in-progress',
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Passer le PADI',
    type: 'one-shot',
    category: 'Aventure',
    icon: 'Waves',
    currentValue: 0,
    status: 'todo',
    isCompleted: false,
  },
  {
    id: '3',
    title: 'Courir un semi-marathon',
    type: 'one-shot',
    category: 'Sport',
    icon: 'Trophy',
    currentValue: 0,
    status: 'done',
    isCompleted: true,
  },
  // Counter goals
  {
    id: '4',
    title: 'Lire 12 livres',
    type: 'counter',
    category: 'Lecture',
    icon: 'BookOpen',
    targetValue: 12,
    currentValue: 4,
    status: 'in-progress',
    isCompleted: false,
  },
  {
    id: '5',
    title: 'Apprendre 52 recettes',
    type: 'counter',
    category: 'Cuisine',
    icon: 'ChefHat',
    targetValue: 52,
    currentValue: 18,
    status: 'in-progress',
    isCompleted: false,
  },
  {
    id: '6',
    title: 'Voir 24 films',
    type: 'counter',
    category: 'Culture',
    icon: 'Film',
    targetValue: 24,
    currentValue: 9,
    status: 'in-progress',
    isCompleted: false,
  },
  // Habit goals (linked to daily tracking)
  {
    id: '7',
    title: 'Sport 200 jours',
    type: 'habit',
    category: 'Sport',
    icon: 'Dumbbell',
    targetValue: 200,
    currentValue: 45,
    status: 'in-progress',
    isCompleted: false,
  },
  {
    id: '8',
    title: 'Lecture quotidienne 150 jours',
    type: 'habit',
    category: 'Lecture',
    icon: 'Book',
    targetValue: 150,
    currentValue: 32,
    status: 'in-progress',
    isCompleted: false,
  },
  {
    id: '9',
    title: 'Pas d\'écran au lit 300 jours',
    type: 'habit',
    category: 'Bien-être',
    icon: 'Moon',
    targetValue: 300,
    currentValue: 28,
    status: 'in-progress',
    isCompleted: false,
  },
];

// Generate some mock daily logs for the past 30 days
const generateMockLogs = (): DailyLog[] => {
  const logs: DailyLog[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    logs.push({
      id: `log-${i}`,
      date: dateStr,
      sportStatus: ['rest', 'running', 'muscu', 'other'][Math.floor(Math.random() * 4)] as DailyLog['sportStatus'],
      meatType: ['none', 'chicken', 'red'][Math.floor(Math.random() * 3)] as DailyLog['meatType'],
      alcohol: Math.random() > 0.7,
      screenLimit: Math.random() > 0.3,
      reading: Math.random() > 0.4,
      dailyPhrase: i === 0 ? '' : `Pensée du jour ${i}: Une journée productive et enrichissante.`,
    });
  }
  
  return logs;
};

export const mockDailyLogs = generateMockLogs();

export const mockMedicalEvents: MedicalEvent[] = [
  {
    id: 'med-1',
    type: 'dentist',
    label: 'Dentiste',
    lastDate: '2025-09-15',
    nextDueDate: '2026-03-15',
    intervalMonths: 6,
  },
  {
    id: 'med-2',
    type: 'blood-donation',
    label: 'Don du sang',
    lastDate: '2025-11-20',
    nextDueDate: '2026-02-20',
    intervalMonths: 3,
  },
  {
    id: 'med-3',
    type: 'doctor',
    label: 'Médecin généraliste',
    lastDate: '2025-06-01',
    nextDueDate: '2026-06-01',
    intervalMonths: 12,
  },
];
