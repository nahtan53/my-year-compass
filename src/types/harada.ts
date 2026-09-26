export type HaradaPlan = {
  mainGoal: string;
  subgoals: string[];
  actions: string[][];
  details: string[];
};

export function createEmptyHaradaPlan(): HaradaPlan {
  return {
    mainGoal: '',
    subgoals: Array(8).fill(''),
    actions: Array.from({ length: 8 }, () => Array(8).fill('')),
    details: Array(8).fill(''),
  };
}

export function normalizeHaradaPlan(value: unknown): HaradaPlan {
  const emptyPlan = createEmptyHaradaPlan();
  if (!value || typeof value !== 'object') return emptyPlan;

  const input = value as Partial<HaradaPlan>;
  return {
    mainGoal: typeof input.mainGoal === 'string' ? input.mainGoal : '',
    subgoals: emptyPlan.subgoals.map((_, index) =>
      typeof input.subgoals?.[index] === 'string' ? input.subgoals[index] : ''
    ),
    actions: emptyPlan.actions.map((row, goalIndex) =>
      row.map((_, actionIndex) =>
        typeof input.actions?.[goalIndex]?.[actionIndex] === 'string'
          ? input.actions[goalIndex][actionIndex]
          : ''
      )
    ),
    details: emptyPlan.details.map((_, index) =>
      typeof input.details?.[index] === 'string' ? input.details[index] : ''
    ),
  };
}