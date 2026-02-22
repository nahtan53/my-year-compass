import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { fetchRecipes } from '@/lib/supabase-api';
import type { Recipe } from '@/types/recipes';
import { ChefHat, Loader2, ChevronDown, ChevronUp, Clock, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function RecipeCard({ recipe, defaultOpen = false }: { recipe: Recipe; defaultOpen?: boolean }) {
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
            {recipe.durationMinutes != null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {recipe.durationMinutes} min
              </span>
            )}
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

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
    refetchOnMount: true,
  });

  const drawRandom = useCallback(() => {
    const excludeIds = new Set(rouletteHistory);
    const pool = recipes.filter(r => !excludeIds.has(r.id));
    const list = pool.length > 0 ? pool : recipes;
    if (list.length === 0) {
      setDrawnRecipe(null);
      return;
    }
    const index = Math.floor(Math.random() * list.length);
    const recipe = list[index];
    setDrawnRecipe(recipe);
    pushRouletteHistory(recipe.id);
    setRouletteHistory(getRouletteHistory());
  }, [recipes, rouletteHistory]);

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
        <CardContent className="space-y-3">
          <Button
            onClick={drawRandom}
            disabled={recipes.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            <Shuffle className="w-5 h-5" />
            Tirer une recette au hasard
          </Button>
          {recipes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Ajoute des recettes dans Supabase (table <code className="text-xs bg-muted px-1 rounded">recipes</code>) pour utiliser la roulette.
            </p>
          )}
          {drawnRecipe && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Recette tirée :</p>
              <RecipeCard recipe={drawnRecipe} defaultOpen />
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
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecettesPage;
