import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { fetchHaradaPlan, saveHaradaPlan } from '@/lib/supabase-api';
import { createEmptyHaradaPlan, normalizeHaradaPlan, type HaradaPlan } from '@/types/harada';
import { cn } from '@/lib/utils';

const SUBGOAL_POSITIONS = [0, 1, 2, 3, 5, 6, 7, 8];
const ACTION_POSITIONS = SUBGOAL_POSITIONS;

type EditorTarget = { kind: 'main' } | { kind: 'subgoal'; goalIndex: number } | { kind: 'action'; goalIndex: number; actionIndex: number };

function getSubgoalIndex(position: number) {
  return SUBGOAL_POSITIONS.indexOf(position);
}

function getMatrixCell(plan: HaradaPlan, row: number, column: number) {
  const blockRow = Math.floor(row / 3);
  const blockColumn = Math.floor(column / 3);
  const blockPosition = blockRow * 3 + blockColumn;
  const localPosition = (row % 3) * 3 + (column % 3);

  if (blockPosition === 4) {
    if (localPosition === 4) return { kind: 'main' as const, text: plan.mainGoal };
    const goalIndex = getSubgoalIndex(localPosition);
    return { kind: 'subgoal' as const, goalIndex, text: plan.subgoals[goalIndex] };
  }

  const goalIndex = getSubgoalIndex(blockPosition);
  if (localPosition === 4) return { kind: 'subgoal' as const, goalIndex, text: plan.subgoals[goalIndex] };
  const actionIndex = ACTION_POSITIONS.indexOf(localPosition);
  return { kind: 'action' as const, goalIndex, actionIndex, text: plan.actions[goalIndex][actionIndex] };
}

function CellText({ children }: { children: string }) {
  return <span className="line-clamp-3 w-full whitespace-normal break-words">{children || 'Ajouter…'}</span>;
}

export default function HaradaPage() {
  const { subgoalId } = useParams();
  const selectedGoalIndex = subgoalId == null ? null : Number(subgoalId);
  const isDetail = selectedGoalIndex !== null && Number.isInteger(selectedGoalIndex) && selectedGoalIndex >= 0 && selectedGoalIndex < 8;
  const [plan, setPlan] = useState<HaradaPlan>(createEmptyHaradaPlan);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading');
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let active = true;
    fetchHaradaPlan()
      .then((data) => {
        if (!active) return;
        setPlan(normalizeHaradaPlan(data));
        setLoaded(true);
        setSaveState('saved');
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
        setSaveState('error');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      saveHaradaPlan(plan)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [loaded, plan]);

  const openEditor = (target: EditorTarget) => {
    setEditor(target);
    setDraft(
      target.kind === 'main'
        ? plan.mainGoal
        : target.kind === 'subgoal'
        ? plan.subgoals[target.goalIndex]
        : plan.actions[target.goalIndex][target.actionIndex]
    );
  };

  const saveEditor = () => {
    if (!editor) return;
    setPlan((current) => {
      if (editor.kind === 'main') return { ...current, mainGoal: draft };
      if (editor.kind === 'subgoal') {
        const subgoals = [...current.subgoals];
        subgoals[editor.goalIndex] = draft;
        return { ...current, subgoals };
      }
      const actions = current.actions.map((row) => [...row]);
      actions[editor.goalIndex][editor.actionIndex] = draft;
      return { ...current, actions };
    });
    setEditor(null);
  };

  const updateSubgoal = (goalIndex: number, value: string) => {
    setPlan((current) => {
      const subgoals = [...current.subgoals];
      subgoals[goalIndex] = value;
      return { ...current, subgoals };
    });
  };

  const updateDetails = (goalIndex: number, value: string) => {
    setPlan((current) => {
      const details = [...current.details];
      details[goalIndex] = value;
      return { ...current, details };
    });
  };

  if (isDetail && selectedGoalIndex !== null) {
    const goalIndex = selectedGoalIndex;
    const cells = ACTION_POSITIONS.map((position, actionIndex) => {
      const actionRow = Math.floor(position / 3);
      const actionColumn = position % 3;
      return (
        <button
          key={position}
          type="button"
          onClick={() => openEditor({ kind: 'action', goalIndex, actionIndex })}
          aria-label={`Modifier l'action ${actionIndex + 1}`}
          className="flex aspect-square min-h-0 min-w-0 items-center justify-center border border-border/70 bg-card p-2 text-center text-xs leading-snug transition-colors hover:bg-primary/10"
        >
          <CellText>{plan.actions[goalIndex][actionIndex]}</CellText>
        </button>
      );
    });
    cells.splice(4, 0, (
      <button
        key="center"
        type="button"
        onClick={() => openEditor({ kind: 'subgoal', goalIndex })}
        aria-label="Modifier le levier"
        className="flex aspect-square min-w-0 items-center justify-center border-2 border-primary/70 bg-primary/15 p-2 text-center text-xs font-semibold leading-snug transition-colors hover:bg-primary/25"
      >
        <span className="line-clamp-3 w-full whitespace-normal break-words">
          {plan.subgoals[goalIndex] || 'Nommer le levier'}
        </span>
      </button>
    ));

    return (
      <section className="mx-auto max-w-5xl space-y-6 pb-8">
        <Link to="/harada" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour à la matrice
        </Link>
        <header className="space-y-3 border-b border-border/60 pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sous-objectif {goalIndex + 1} / 8</p>
          <input
            value={plan.subgoals[goalIndex]}
            onChange={(event) => updateSubgoal(goalIndex, event.target.value)}
            placeholder="Nommer ce levier"
            aria-label="Nom du sous-objectif"
            className="w-full min-w-0 bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/50"
          />
          {plan.mainGoal && <p className="text-sm text-muted-foreground">Objectif central : {plan.mainGoal}</p>}
        </header>
        <div className="grid w-full min-w-0 max-w-[620px] grid-cols-3 gap-1.5" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}>
          {cells}
        </div>
        <label className="block max-w-3xl space-y-2">
          <span className="text-sm font-medium">Notes et étapes intermédiaires</span>
          <Textarea
            value={plan.details[goalIndex]}
            onChange={(event) => updateDetails(goalIndex, event.target.value)}
            placeholder="Précisions, échéances, ressources, personnes à solliciter…"
            rows={5}
          />
        </label>
        <SaveIndicator state={saveState} />
        <EditorDialog editor={editor} draft={draft} setDraft={setDraft} onClose={() => setEditor(null)} onSave={saveEditor} />
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Plan de développement</p>
          <h2 className="text-2xl font-semibold">Matrice Harada</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Un objectif central, huit leviers, puis huit actions pour chacun.</p>
        </div>
        <SaveIndicator state={saveState} />
      </header>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[720px] grid-cols-9 overflow-hidden border-l border-t border-border/70" style={{ gridTemplateRows: 'repeat(9, minmax(74px, 1fr))' }}>
          {Array.from({ length: 81 }, (_, index) => {
            const row = Math.floor(index / 9);
            const column = index % 9;
            const cell = getMatrixCell(plan, row, column);
            const blockEnd = column % 3 === 2;
            const rowEnd = row % 3 === 2;
            const baseClass = cn(
              'flex min-h-[74px] min-w-0 items-center justify-center border-r border-b border-border/70 p-1.5 text-center text-[11px] leading-snug transition-colors hover:bg-primary/10 sm:p-2 sm:text-xs',
              blockEnd && 'border-r-2 border-r-primary/30',
              rowEnd && 'border-b-2 border-b-primary/30',
            );
            if (cell.kind === 'main') {
              return (
                <button key={index} type="button" onClick={() => openEditor({ kind: 'main' })} className={cn(baseClass, 'flex-col bg-primary/20 font-semibold text-foreground')}>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-primary">Objectif</span>
                  <CellText>{cell.text}</CellText>
                </button>
              );
            }
            if (cell.kind === 'subgoal') {
              return (
                <Link key={index} to={`/harada/${cell.goalIndex}`} aria-label={`Détailler le sous-objectif ${cell.text || cell.goalIndex + 1}`} className={cn(baseClass, 'bg-amber-500/10 font-medium hover:bg-amber-500/20')}>
                  <CellText>{cell.text}</CellText>
                </Link>
              );
            }
            return (
              <button key={index} type="button" onClick={() => openEditor({ kind: 'action', goalIndex: cell.goalIndex, actionIndex: cell.actionIndex })} aria-label={`Modifier une action du sous-objectif ${cell.goalIndex + 1}`} className={cn(baseClass, 'bg-card')}>
                <CellText>{cell.text}</CellText>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Légende de la matrice">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-primary/50" />Objectif central</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-amber-500/50" />Levier</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 border border-border bg-card" />Action</span>
      </div>
      <EditorDialog editor={editor} draft={draft} setDraft={setDraft} onClose={() => setEditor(null)} onSave={saveEditor} />
    </section>
  );
}

function SaveIndicator({ state }: { state: 'loading' | 'saved' | 'saving' | 'error' }) {
  if (state === 'loading') return <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Chargement</span>;
  if (state === 'saving') return <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Enregistrement</span>;
  if (state === 'error') return <span className="text-xs text-destructive">Échec de l’enregistrement</span>;
  return <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" />Enregistré</span>;
}

function EditorDialog({
  editor,
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  editor: EditorTarget | null;
  draft: string;
  setDraft: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={editor !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editor?.kind === 'main' ? 'Objectif central' : editor?.kind === 'subgoal' ? 'Nom du levier' : 'Action concrète'}</DialogTitle>
          <DialogDescription>Formulez un élément clair et assez précis pour guider la prochaine étape.</DialogDescription>
        </DialogHeader>
        <Textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire ici…" rows={4} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}