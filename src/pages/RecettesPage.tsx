import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { fetchRecipes, fetchSeasonalIngredientsForMonth } from '@/lib/supabase-api';
import type { Recipe, SeasonalIngredient } from '@/types/recipes';
import { ChefHat, Loader2, ChevronDown, ChevronUp, Clock, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_DURATION_MIN = 15;
const MAX_DURATION_MAX = 180;
const MAX_DURATION_STEP = 5;
const COMPAT_THRESHOLD = 0.75; // 75 %

function filterRecipesByMaxMinutes(recipes: Recipe[], maxMinutes: number | null): Recipe[] {
  if (maxMinutes == null) return recipes;
  return recipes.filter((r) => {
    const d = r.durationMinutes;
    if (d == null) return false;
    return d <= maxMinutes;
  });
}

const ROULETTE_HISTORY_KEY = 'recettes-roulette-history';
const HISTORY_SIZE = 5;

function getRouletteHistory(): string[] {
  try {
    const raw = localStorage.getItem(ROULETTE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_SIZE).filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function pushRouletteHistory(id: string): void {
  const prev = getRouletteHistory();
  const next = [id, ...prev.filter(x => x !== id)].slice(0, HISTORY_SIZE);
  localStorage.setItem(ROULETTE_HISTORY_KEY, JSON.stringify(next));
}

function computeSeasonCompatibility(recipe: Recipe, seasonal: SeasonalIngredient[]): number {
  if (!seasonal.length || !recipe.ingredients.length) return 1; // 100% si pas de données

  const seasonalNames = seasonal.map((s) => s.name.toLowerCase());
  let total = 0;
  let matches = 0;

  for (const rawLine of recipe.ingredients) {
    const line = rawLine.toLowerCase();
    // On ne garde que la partie avant les " : " pour isoler l'ingrédient principal
    const namePart = line.split(':')[0]?.trim();
    if (!namePart) continue;
    total++;
    if (seasonalNames.some((name) => namePart.includes(name))) {
      matches++;
    }
  }

  if (!total) return 1;
  return matches / total;
}

function RecipeCard({
  recipe,
  defaultOpen = false,
  compatibility,
}: {
  recipe: Recipe;
  defaultOpen?: boolean;
  compatibility?: number | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-border/50 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-primary shrink-0" />
              {recipe.title}
            </CardTitle>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {recipe.durationMinutes != null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {recipe.durationMinutes} min
                </span>
              )}
              {typeof compatibility === 'number' && (
                <span className="text-[10px] text-muted-foreground">
                  Compat saison&nbsp;: {Math.round(compatibility * 100)}%
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-8">
              <span className="text-xs text-muted-foreground">
                Ingrédients · Étapes
              </span>
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 pt-2 border-t border-border/50">
              {recipe.ingredients.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ingrédients</p>
                  <ul className="text-sm list-disc list-inside space-y-0.5">
                    {recipe.ingredients.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {recipe.steps.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Étapes</p>
                  <ol className="text-sm list-decimal list-inside space-y-1">
                    {recipe.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

const RecettesPage = () => {
  const [rouletteHistory, setRouletteHistory] = useState<string[]>(getRouletteHistory);
  const [drawnRecipe, setDrawnRecipe] = useState<Recipe | null>(null);
  const [limitByTime, setLimitByTime] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState(45);
  const [useSeasonFilter, setUseSeasonFilter] = useState(false);

  const { data: recipes = [], isLoading, isError, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
    refetchOnMount: true,
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const { data: seasonal = [] } = useQuery({
    queryKey: ['seasonal-ingredients', currentMonth],
    queryFn: () => fetchSeasonalIngredientsForMonth(currentMonth),
    refetchOnMount: true,
    enabled: useSeasonFilter,
  });

  const effectiveMax = limitByTime ? maxMinutes : null;

  const compatibilityById = useMemo(() => {
    const map = new Map<string, number>();
    if (!useSeasonFilter || !seasonal.length) return map;
    recipes.forEach((recipe) => {
      map.set(recipe.id, computeSeasonCompatibility(recipe, seasonal));
    });
    return map;
  }, [recipes, seasonal, useSeasonFilter]);

  const filteredRecipes = useMemo(() => {
    const byTime = filterRecipesByMaxMinutes(recipes, effectiveMax);
    if (!useSeasonFilter) return byTime;
    return byTime.filter((recipe) => {
      const score =
        compatibilityById.get(recipe.id) ?? computeSeasonCompatibility(recipe, seasonal);
      return score >= COMPAT_THRESHOLD;
    });
  }, [recipes, effectiveMax, useSeasonFilter, compatibilityById, seasonal]);

  const drawRandom = useCallback(() => {
    const excludeIds = new Set(rouletteHistory);
    const pool = filteredRecipes.filter(r => !excludeIds.has(r.id));
    const list = pool.length > 0 ? pool : filteredRecipes;
    if (list.length === 0) {
      setDrawnRecipe(null);
      return;
    }
    const index = Math.floor(Math.random() * list.length);
    const recipe = list[index];
    setDrawnRecipe(recipe);
    pushRouletteHistory(recipe.id);
    setRouletteHistory(getRouletteHistory());
  }, [filteredRecipes, rouletteHistory]);

  if (isError && error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive mb-1">Impossible de charger les recettes</p>
          <p className="text-muted-foreground font-mono text-xs mb-3">{String(error)}</p>
          <p className="text-muted-foreground text-xs">
            Vérifie ton <code className="bg-muted px-1 rounded">.env</code> et redémarre <code className="bg-muted px-1 rounded">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up pb-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          Recettes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Liste et tirage au hasard (les 5 dernières tirées sont exclues)
        </p>
      </div>

      {/* Roulette */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-primary" />
            Roulette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="season-filter" className="text-sm text-muted-foreground cursor-pointer">
                Filtre saison (ingrédients de saison)
              </Label>
              <Switch
                id="season-filter"
                checked={useSeasonFilter}
                onCheckedChange={setUseSeasonFilter}
              />
            </div>
            {useSeasonFilter && !seasonal.length && (
              <p className="text-[11px] text-muted-foreground">
                Aucune donnée dans <code className="bg-muted px-1 rounded">seasonal_ingredients</code> pour ce mois.
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="limit-time" className="text-sm text-muted-foreground cursor-pointer">
                Limiter par temps max
              </Label>
              <Switch
                id="limit-time"
                checked={limitByTime}
                onCheckedChange={setLimitByTime}
              />
            </div>
            {limitByTime && (
              <div className="space-y-2 pl-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Temps max</span>
                  <span className="font-medium tabular-nums">{maxMinutes} min</span>
                </div>
                <Slider
                  min={MAX_DURATION_MIN}
                  max={MAX_DURATION_MAX}
                  step={MAX_DURATION_STEP}
                  value={[maxMinutes]}
                  onValueChange={([v]) => setMaxMinutes(v ?? maxMinutes)}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <Button
            onClick={drawRandom}
            disabled={filteredRecipes.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            <Shuffle className="w-5 h-5" />
            Tirer une recette au hasard
          </Button>
          {filteredRecipes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {recipes.length === 0
                ? 'Ajoute des recettes dans Supabase (table recipes) pour utiliser la roulette.'
                : limitByTime
                  ? `Aucune recette ≤ ${maxMinutes} min. Augmente le temps max ou désactive la limite.`
                  : 'Aucune recette.'}
            </p>
          )}
          {drawnRecipe && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Recette tirée :</p>
              <RecipeCard
                recipe={drawnRecipe}
                defaultOpen
                compatibility={
                  useSeasonFilter && drawnRecipe
                    ? compatibilityById.get(drawnRecipe.id) ?? null
                    : null
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste */}
      <div>
        <h2 className="text-base font-semibold mb-3">Toutes les recettes</h2>
        {recipes.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucune recette. Crée la table <code className="text-xs bg-muted px-1 rounded">recipes</code> dans Supabase et ajoute des recettes (title, ingredients, steps, duration_minutes).
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                compatibility={
                  useSeasonFilter ? compatibilityById.get(recipe.id) ?? null : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecettesPage;
