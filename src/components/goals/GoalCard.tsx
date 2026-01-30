import { Goal } from '@/types/goals';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Briefcase,
  Waves,
  Trophy,
  BookOpen,
  ChefHat,
  Film,
  Dumbbell,
  Book,
  Moon,
  Plus,
  Minus,
  Check,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Waves,
  Trophy,
  BookOpen,
  ChefHat,
  Film,
  Dumbbell,
  Book,
  Moon,
};

interface GoalCardProps {
  goal: Goal;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onStatusChange?: (id: string, status: Goal['status']) => void;
}

export function GoalCard({
  goal,
  onIncrement,
  onDecrement,
  onToggleComplete,
  onStatusChange,
}: GoalCardProps) {
  const Icon = iconMap[goal.icon] || Target;
  const progress = goal.targetValue
    ? Math.round((goal.currentValue / goal.targetValue) * 100)
    : goal.isCompleted
    ? 100
    : 0;

  const statusColors = {
    todo: 'bg-muted text-muted-foreground',
    'in-progress': 'bg-primary/20 text-primary',
    done: 'bg-success/20 text-success',
  };

  const statusLabels = {
    todo: 'À faire',
    'in-progress': 'En cours',
    done: 'Terminé',
  };

  return (
    <Card className={cn(
      'card-hover border-border/50 overflow-hidden',
      goal.isCompleted && 'opacity-75'
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
              goal.isCompleted ? 'bg-success/20' : 'bg-primary/10'
            )}>
              <Icon className={cn(
                'w-5 h-5',
                goal.isCompleted ? 'text-success' : 'text-primary'
              )} />
            </div>
            <div className="min-w-0">
              <h3 className={cn(
                'font-medium text-sm leading-tight truncate',
                goal.isCompleted && 'line-through text-muted-foreground'
              )}>
                {goal.title}
              </h3>
              <span className="text-xs text-muted-foreground">{goal.category}</span>
            </div>
          </div>
          
          {goal.type === 'one-shot' && (
            <Badge variant="secondary" className={cn('text-xs shrink-0', statusColors[goal.status])}>
              {statusLabels[goal.status]}
            </Badge>
          )}
        </div>

        {/* Content based on type */}
        {goal.type === 'one-shot' && (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              checked={goal.isCompleted}
              onCheckedChange={() => onToggleComplete?.(goal.id)}
              className="touch-target"
            />
            <span className="text-sm text-muted-foreground">
              Marquer comme terminé
            </span>
          </div>
        )}

        {(goal.type === 'counter' || goal.type === 'habit') && goal.targetValue && (
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-mono font-medium tabular-nums">
                  {goal.currentValue} / {goal.targetValue}
                </span>
              </div>
              <Progress 
                value={progress} 
                className={cn('h-2', progress >= 100 && 'progress-glow')}
              />
            </div>

            {/* Counter controls (only for counter type) */}
            {goal.type === 'counter' && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-bold tabular-nums text-primary">
                  {progress}%
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 touch-target"
                    onClick={() => onDecrement?.(goal.id)}
                    disabled={goal.currentValue <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 touch-target"
                    onClick={() => onIncrement?.(goal.id)}
                    disabled={goal.isCompleted}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Habit indicator */}
            {goal.type === 'habit' && (
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Mis à jour automatiquement via le Daily Logger</span>
              </div>
            )}
          </div>
        )}

        {/* Completion indicator */}
        {goal.isCompleted && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-success text-sm">
            <Check className="w-4 h-4" />
            <span>Objectif atteint ! 🎉</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
