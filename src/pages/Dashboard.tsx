import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Goal } from '@/types/goals';
import { GoalCard } from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, BarChart3, Flame, Loader2 } from 'lucide-react';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { fetchGoals, fetchDailyLogs, updateGoal } from '@/lib/supabase-api';
import { toast } from '@/hooks/use-toast';
import { computeHabitCurrentValue } from '@/lib/habit-sync';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

  const { data: goalsRaw = [], isLoading: goalsLoading, isError: goalsError, error: goalsErr } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    refetchOnMount: true,
  });
  const { data: dailyLogs = [], isLoading: logsLoading, isError: logsError, error: logsErr } = useQuery({
    queryKey: ['dailyLogs'],
    queryFn: fetchDailyLogs,
    refetchOnMount: true,
  });

  const goals = useMemo(() => {
    const enriched = goalsRaw.map(goal => {
      if (goal.type !== 'habit') return goal;
      const computed = computeHabitCurrentValue(goal, dailyLogs);
      if (computed == null) return goal;
      const targetValue = goal.targetValue ?? 0;
      return {
        ...goal,
        currentValue: computed,
        isCompleted: computed >= targetValue,
        status: (computed >= targetValue ? 'done' : computed > 0 ? 'in-progress' : 'todo') as Goal['status'],
      };
    });

    // Tri stable pour éviter que les cartes « bougent » visuellement
    return enriched.slice().sort((a, b) => a.title.localeCompare(b.title));
  }, [goalsRaw, dailyLogs]);

  const isLoading = goalsLoading || logsLoading;
  const isError = goalsError || logsError;
  const errorMessage = goalsErr ? String(goalsErr) : logsErr ? String(logsErr) : null;

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Goal> }) =>
      updateGoal(id, updates),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ['goals'] }),
    onError: (err) => toast({ title: 'Erreur', description: String(err), variant: 'destructive' }),
  });

  const handleIncrement = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal || goal.type !== 'counter' && goal.type !== 'habit') return;
    const targetValue = goal.targetValue ?? 0;
    const newValue = Math.min(goal.currentValue + 1, targetValue);
    updateGoalMutation.mutate({
      id,
      updates: {
        currentValue: newValue,
        isCompleted: newValue >= targetValue,
        status: newValue >= targetValue ? 'done' : goal.status,
      },
    });
  };

  const handleDecrement = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newValue = Math.max(goal.currentValue - 1, 0);
    updateGoalMutation.mutate({
      id,
      updates: {
        currentValue: newValue,
        isCompleted: false,
        status: newValue === 0 ? 'todo' : 'in-progress',
      },
    });
  };

  const handleToggleComplete = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const isCompleted = !goal.isCompleted;
    updateGoalMutation.mutate({
      id,
      updates: {
        isCompleted,
        status: isCompleted ? 'done' : 'todo',
        currentValue: isCompleted ? 1 : 0,
      },
    });
  };

  const oneShotGoals = goals.filter(g => g.type === 'one-shot');
  const counterGoals = goals.filter(g => g.type === 'counter');
  const habitGoals = goals.filter(g => g.type === 'habit');

  const completedCount = goals.filter(g => g.isCompleted).length;
  const totalProgress = goals.length ? Math.round((completedCount / goals.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError && errorMessage) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive mb-1">Impossible de charger les données</p>
          <p className="text-muted-foreground font-mono text-xs mb-3">{errorMessage}</p>
          <p className="text-muted-foreground text-xs">
            Vérifie ton fichier <code className="bg-muted px-1 rounded">.env</code> (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), que les tables existent dans Supabase, puis redémarre le serveur (<code className="bg-muted px-1 rounded">npm run dev</code>).
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Tu peux quand même créer des objectifs si Supabase est correctement configuré après redémarrage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
          <div className="text-2xl font-bold text-primary font-mono">{completedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Terminés</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
          <div className="text-2xl font-bold text-foreground font-mono">{goals.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Objectifs</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
          <div className="text-2xl font-bold text-success font-mono">{totalProgress}%</div>
          <div className="text-xs text-muted-foreground mt-1">Progrès</div>
        </div>
      </div>

      {/* Create Goal Button */}
      <Button
        onClick={() => setIsCreateGoalOpen(true)}
        className="w-full h-14 text-base font-medium gap-3 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Plus className="w-5 h-5" />
        Créer un objectif
      </Button>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border/50">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun objectif</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Commence par ajouter tes objectifs pour 2026
          </p>
        </div>
      )}

      {/* Goals Tabs */}
      {goals.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-11">
            <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
            <TabsTrigger value="oneshot" className="text-xs gap-1">
              <Target className="w-3.5 h-3.5" />
              One-shot
            </TabsTrigger>
            <TabsTrigger value="counter" className="text-xs gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Compteurs
            </TabsTrigger>
            <TabsTrigger value="habit" className="text-xs gap-1">
              <Flame className="w-3.5 h-3.5" />
              Habitudes
            </TabsTrigger>
          </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {goals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-foreground">Aucun objectif pour le moment</p>
              <p className="mt-1">
                Ajoute des objectifs dans Supabase (table <code className="text-xs bg-muted px-1 rounded">goals</code>) pour les voir ici.
                Types possibles : <code className="text-xs bg-muted px-1 rounded">one-shot</code>, <code className="text-xs bg-muted px-1 rounded">counter</code> ou <code className="text-xs bg-muted px-1 rounded">habit</code>.
              </p>
            </div>
          ) : (
            goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="oneshot" className="mt-4 space-y-3">
          {oneShotGoals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-foreground">Aucun objectif one-shot</p>
              <p className="mt-1">
                Les objectifs one-shot (ex. passer un diplôme, faire un projet) ont le type <strong>one-shot</strong> en base.
                Créez-les dans Supabase : table <code className="text-xs bg-muted px-1 rounded">goals</code>, champ <code className="text-xs bg-muted px-1 rounded">type</code> = <code className="text-xs bg-muted px-1 rounded">one-shot</code>.
              </p>
            </div>
          ) : (
            oneShotGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="counter" className="mt-4 space-y-3">
          {counterGoals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-foreground">Aucun objectif compteur</p>
              <p className="mt-1">
                Les objectifs compteur (ex. lire 12 livres, voir 24 films) ont le type <strong>counter</strong> en base, avec <code className="text-xs bg-muted px-1 rounded">target_value</code>.
                Créez-les dans Supabase : table <code className="text-xs bg-muted px-1 rounded">goals</code>, champ <code className="text-xs bg-muted px-1 rounded">type</code> = <code className="text-xs bg-muted px-1 rounded">counter</code>.
              </p>
            </div>
          ) : (
            counterGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="habit" className="mt-4 space-y-3">
          {habitGoals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <Flame className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-foreground">Aucune habitude pour le moment</p>
              <p className="mt-1">
                Les habitudes (sport, lecture, écrans…) sont des objectifs avec le type <strong>habit</strong> en base.
                La saisie rapide du jour met à jour leur progression, mais il faut d’abord créer ces objectifs (par ex. dans Supabase : table <code className="text-xs bg-muted px-1 rounded">goals</code>, champ <code className="text-xs bg-muted px-1 rounded">type</code> = <code className="text-xs bg-muted px-1 rounded">habit</code>).
              </p>
            </div>
          ) : (
            habitGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen} />
    </div>
  );
};

export default Dashboard;
