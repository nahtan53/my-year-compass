import { useState } from 'react';
import { Goal } from '@/types/goals';
import { GoalCard } from '@/components/goals/GoalCard';
import { mockGoals } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, BarChart3, Flame } from 'lucide-react';
import { DailyLoggerModal } from '@/components/daily/DailyLoggerModal';

const Dashboard = () => {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);

  const handleIncrement = (id: string) => {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id === id && goal.targetValue) {
          const newValue = Math.min(goal.currentValue + 1, goal.targetValue);
          return {
            ...goal,
            currentValue: newValue,
            isCompleted: newValue >= goal.targetValue,
            status: newValue >= goal.targetValue ? 'done' : goal.status,
          };
        }
        return goal;
      })
    );
  };

  const handleDecrement = (id: string) => {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id === id) {
          const newValue = Math.max(goal.currentValue - 1, 0);
          return {
            ...goal,
            currentValue: newValue,
            isCompleted: false,
            status: newValue === 0 ? 'todo' : 'in-progress',
          };
        }
        return goal;
      })
    );
  };

  const handleToggleComplete = (id: string) => {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id === id) {
          const isCompleted = !goal.isCompleted;
          return {
            ...goal,
            isCompleted,
            status: isCompleted ? 'done' : 'todo',
            currentValue: isCompleted ? 1 : 0,
          };
        }
        return goal;
      })
    );
  };

  const oneShotGoals = goals.filter(g => g.type === 'one-shot');
  const counterGoals = goals.filter(g => g.type === 'counter');
  const habitGoals = goals.filter(g => g.type === 'habit');

  const completedCount = goals.filter(g => g.isCompleted).length;
  const totalProgress = Math.round((completedCount / goals.length) * 100);

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

      {/* Goals Tabs */}
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
              goal={goal}
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
              goal={goal}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </TabsContent>

        <TabsContent value="counter" className="mt-4 space-y-3">
          {counterGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          ))}
        </TabsContent>

        <TabsContent value="habit" className="mt-4 space-y-3">
          {habitGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Daily Logger Modal */}
      <DailyLoggerModal open={isLoggerOpen} onOpenChange={setIsLoggerOpen} />
    </div>
  );
};

export default Dashboard;
