export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  durationMinutes: number | null;
}

export interface SeasonalIngredient {
  id: string;
  name: string;
  month: number;
  category: string | null;
}
