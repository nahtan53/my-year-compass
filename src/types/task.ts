export type TaskQuadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

export type Task = {
  id: string;
  title: string;
  quadrant: TaskQuadrant | null;
  completed: boolean;
  createdAt: string;
};

export const TASK_QUADRANTS: {
  id: TaskQuadrant;
  title: string;
  urgency: string;
  importance: string;
  action: string;
  color: string;
}[] = [
  {
    id: 'do',
    title: 'Faire',
    urgency: 'Urgent',
    importance: 'Important',
    action: 'À faire maintenant',
    color: 'border-rose-500/30 bg-rose-500/5',
  },
  {
    id: 'schedule',
    title: 'Planifier',
    urgency: 'Pas urgent',
    importance: 'Important',
    action: 'À planifier',
    color: 'border-sky-500/30 bg-sky-500/5',
  },
  {
    id: 'delegate',
    title: 'Déléguer',
    urgency: 'Urgent',
    importance: 'Pas important',
    action: 'À déléguer',
    color: 'border-amber-500/30 bg-amber-500/5',
  },
  {
    id: 'eliminate',
    title: 'Éliminer',
    urgency: 'Pas urgent',
    importance: 'Pas important',
    action: 'À limiter',
    color: 'border-border/60 bg-muted/20',
  },
];
