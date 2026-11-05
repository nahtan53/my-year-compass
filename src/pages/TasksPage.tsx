import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, Circle, ClipboardList, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { deleteTask, fetchTasks, upsertTask } from '@/lib/supabase-api';
import { TASK_QUADRANTS, type Task, type TaskQuadrant } from '@/types/task';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type View = 'list' | 'matrix';

const queryKey = ['tasks'];

function TaskRow({
  task,
  onComplete,
  onDelete,
  disabled,
  draggable = false,
}: {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  disabled: boolean;
  draggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: disabled || !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : undefined }}
      className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 p-3"
    >
      {draggable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Déplacer ${task.title}`}
          className="touch-none shrink-0 cursor-grab rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onComplete}
        disabled={disabled}
        aria-label={task.completed ? 'Marquer comme à faire' : 'Marquer comme terminée'}
        className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
      >
        {task.completed
          ? <Check className="h-5 w-5 text-primary" />
          : <Circle className="h-5 w-5" />}
      </button>
      <span className={cn('min-w-0 flex-1 break-words text-sm', task.completed && 'text-muted-foreground line-through')}>
        {task.title}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={disabled}
        aria-label={`Supprimer ${task.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TaskDropZone({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <Card
      ref={setNodeRef}
      className={cn(className, isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}
    >
      {children}
    </Card>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('list');
  const [title, setTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const { data: tasks = [], isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchTasks,
  });

  const saveMutation = useMutation({
    mutationFn: upsertTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => toast({ title: 'Impossible d’enregistrer la tâche', description: String(err), variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => toast({ title: 'Impossible de supprimer la tâche', description: String(err), variant: 'destructive' }),
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || busy) return;
    saveMutation.mutate(
      {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        quadrant: null,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      {
        onSuccess: () => setTitle((currentTitle) => currentTitle === trimmedTitle ? '' : currentTitle),
      },
    );
  };

  const updateTask = (task: Task, updates: Partial<Task>) => {
    if (!busy) saveMutation.mutate({ ...task, ...updates });
  };

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const unclassifiedTasks = activeTasks.filter((task) => task.quadrant === null);

  const renderTask = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      disabled={busy}
      onComplete={() => updateTask(task, { completed: !task.completed })}
      onDelete={() => deleteMutation.mutate(task.id)}
      draggable={view === 'matrix' && !task.completed}
    />
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedTaskId(null);
    if (!over) return;

    const task = activeTasks.find((item) => item.id === active.id);
    if (!task) return;

    const targetId = String(over.id);
    const quadrant = targetId === 'unclassified'
      ? null
      : targetId.startsWith('quadrant:')
      ? targetId.slice('quadrant:'.length) as TaskQuadrant
      : undefined;

    if (quadrant !== undefined && task.quadrant !== quadrant) {
      updateTask(task, { quadrant });
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <div>
          <h1 className="font-semibold text-destructive">Impossible de charger les tâches</h1>
          <p className="mt-1 break-words text-sm text-muted-foreground">{String(error)}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Si Supabase est activé, vérifie que la migration de la table <code>tasks</code> a bien été appliquée.
        </p>
        <Button variant="outline" onClick={() => refetch()}>Réessayer</Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-8 animate-fade-up">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Organisation</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mes tâches</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fais le tour de tout ce que tu as à faire, puis décide de tes priorités.
            </p>
          </div>
          <div className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground">
            {activeTasks.length} à faire · {completedTasks.length} terminée{completedTasks.length > 1 ? 's' : ''}
          </div>
        </div>
      </header>

      <div className="inline-flex rounded-lg bg-muted p-1" role="tablist" aria-label="Vue des tâches">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'list'}
          onClick={() => setView('list')}
          className={cn('rounded-md px-4 py-2 text-sm font-medium transition-colors', view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >
          Liste complète
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'matrix'}
          onClick={() => setView('matrix')}
          className={cn('rounded-md px-4 py-2 text-sm font-medium transition-colors', view === 'matrix' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >
          Matrice
        </button>
      </div>

      {view === 'list' ? (
        <div className="space-y-5">
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="p-4 sm:p-5">
              <form onSubmit={addTask} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ajouter tout ce que tu as en tête…"
                  aria-label="Nouvelle tâche"
                  maxLength={200}
                  className="min-w-0 flex-1 bg-background"
                />
                <Button type="submit" disabled={!title.trim() || busy} className="shrink-0">
                  <Plus className="h-4 w-4" />
                  Ajouter à la liste
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">Commence par tout noter, sans essayer de prioriser.</p>
            </CardContent>
          </Card>

          {tasks.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <ClipboardList className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="font-medium">Ta liste est encore vide</h2>
                <p className="mt-1 text-sm text-muted-foreground">Note ici les tâches, petites ou grandes, que tu veux garder en tête.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Toutes les tâches</h2>
                <span className="text-xs text-muted-foreground">{tasks.length} au total</span>
              </div>
              <div className="space-y-2">{tasks.map(renderTask)}</div>
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setDraggedTaskId(String(active.id))}
          onDragCancel={() => setDraggedTaskId(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Glisse une tâche dans le quadrant correspondant. Tu peux aussi utiliser la poignée au clavier.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {TASK_QUADRANTS.map((quadrant) => {
                const quadrantTasks = activeTasks.filter((task) => task.quadrant === quadrant.id);
                return (
                  <TaskDropZone
                    key={quadrant.id}
                    id={`quadrant:${quadrant.id}`}
                    className={cn('border', quadrant.color)}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold">{quadrant.action}</h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {quadrant.urgency} · {quadrant.importance}
                          </p>
                        </div>
                        <span className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium tabular-nums">
                          {quadrantTasks.length}
                        </span>
                      </div>
                      {quadrantTasks.length > 0
                        ? <div className="space-y-2">{quadrantTasks.map(renderTask)}</div>
                        : <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">Dépose une tâche ici</p>}
                    </CardContent>
                  </TaskDropZone>
                );
              })}
            </div>

            <TaskDropZone id="unclassified" className="border-dashed border-border/70 bg-muted/10">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">À classer</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Dépose ici une tâche pour retirer sa priorité.</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">{unclassifiedTasks.length}</span>
                </div>
                {unclassifiedTasks.length > 0
                  ? <div className="space-y-2">{unclassifiedTasks.map(renderTask)}</div>
                  : <p className="text-sm text-muted-foreground">Toutes tes tâches sont classées.</p>}
              </CardContent>
            </TaskDropZone>
          </div>
          <DragOverlay>
            {draggedTaskId ? (
              <div className="rounded-xl border border-primary/50 bg-card p-3 text-sm shadow-lg">
                {tasks.find((task) => task.id === draggedTaskId)?.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  );
}
