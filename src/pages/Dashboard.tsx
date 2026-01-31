import { useState } from 'react';
import { GoalCard } from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, BarChart3, Flame, Loader2 } from 'lucide-react';
import { DailyLoggerModal } from '@/components/daily/DailyLoggerModal';
import { useGoals, Goal } from '@/hooks/useGoals';

const Dashboard = () => {
  const { goals, loading, incrementGoal, decrementGoal, toggleGoalComplete } = useGoals();
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);

  const handleIncrement = (id: string) => {
    incrementGoal(id);
  };

  const handleDecrement = (id: string) => {
    decrementGoal(id);
  };

  const handleToggleComplete = (id: string) => {
    toggleGoalComplete(id);
  };

  // Convert database goal to component format
  const toComponentGoal = (goal: Goal) => ({
    id: goal.id,
    title: goal.title,
    type: goal.type,
    category: goal.category,
    icon: goal.icon,
    targetValue: goal.target_value ?? undefined,
    currentValue: goal.current_value,
    status: goal.status,
    isCompleted: goal.is_completed,
  });

  const oneShotGoals = goals.filter(g => g.type === 'one-shot');
  const counterGoals = goals.filter(g => g.type === 'counter');
  const habitGoals = goals.filter(g => g.type === 'habit');

  const completedCount = goals.filter(g => g.is_completed).length;
  const totalProgress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

      {/* Quick Log Button */}
      <Button
        onClick={() => setIsLoggerOpen(true)}
        className="w-full h-14 text-base font-medium gap-3 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Plus className="w-5 h-5" />
        Saisie rapide du jour
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
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={toComponentGoal(goal)}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </TabsContent>

          <TabsContent value="oneshot" className="mt-4 space-y-3">
            {oneShotGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={toComponentGoal(goal)}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </TabsContent>

          <TabsContent value="counter" className="mt-4 space-y-3">
            {counterGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={toComponentGoal(goal)}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            ))}
          </TabsContent>

          <TabsContent value="habit" className="mt-4 space-y-3">
            {habitGoals.map(goal => (
              <GoalCard key={goal.id} goal={toComponentGoal(goal)} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Daily Logger Modal */}
      <DailyLoggerModal open={isLoggerOpen} onOpenChange={setIsLoggerOpen} />
    </div>
  );
};

export default Dashboard;
