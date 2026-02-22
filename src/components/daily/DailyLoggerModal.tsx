import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dumbbell,
  Moon,
  BookOpen,
  Wine,
  Drumstick,
  Beef,
  Ban,
  Sparkles,
  Check,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SportStatus, MeatType, DailyLog } from '@/types/goals';
import { toast } from '@/hooks/use-toast';
import { toast } from '@/hooks/use-toast';
import { upsertDailyLog, fetchGoals, updateGoal } from '@/lib/supabase-api';
import { computeHabitCurrentValue } from '@/lib/habit-sync';

const normalizeDate = (d: string) => (d.includes('T') ? d.slice(0, 10) : d);

interface DailyLoggerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sportOptions: { value: SportStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'rest', label: 'Repos', icon: <Moon className="w-4 h-4" /> },
  { value: 'running', label: 'Running', icon: <span className="text-lg">🏃</span> },
  { value: 'muscu', label: 'Muscu', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'other', label: 'Autre', icon: <span className="text-lg">⚡</span> },
];

const meatOptions: { value: MeatType; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'Aucune', icon: <Ban className="w-4 h-4" /> },
  { value: 'chicken', label: 'Poulet', icon: <Drumstick className="w-4 h-4" /> },
  { value: 'red', label: 'Rouge', icon: <Beef className="w-4 h-4" /> },
];

const todayAtStart = () => startOfDay(new Date());

export function DailyLoggerModal({ open, onOpenChange }: DailyLoggerModalProps) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(todayAtStart);
  
  const [sportStatus, setSportStatus] = useState<SportStatus>('rest');
  const [meatType, setMeatType] = useState<MeatType>('none');
  const [alcohol, setAlcohol] = useState(false);
  const [screenLimit, setScreenLimit] = useState(false);
  const [reading, setReading] = useState(false);
  const [dailyPhrase, setDailyPhrase] = useState('');

  const today = todayAtStart();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const formattedDate = format(selectedDate, "EEEE d MMMM", { locale: fr });
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  const maxDateStr = format(today, 'yyyy-MM-dd');

  const dailyLogs = (queryClient.getQueryData(['dailyLogs']) as DailyLog[] | undefined) ?? [];
  const existingLog = dailyLogs.find(l => normalizeDate(l.date) === dateStr || l.date.startsWith(dateStr));
  const isEditing = Boolean(existingLog);

  useEffect(() => {
    if (!open) return;
    setSelectedDate(todayAtStart());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const logs = (queryClient.getQueryData(['dailyLogs']) as DailyLog[] | undefined) ?? [];
    const log = logs.find(l => normalizeDate(l.date) === dateStr || l.date.startsWith(dateStr));
    if (log) {
      setSportStatus(log.sportStatus);
      setMeatType(log.meatType);
      setAlcohol(log.alcohol);
      setScreenLimit(log.screenLimit);
      setReading(log.reading);
      setDailyPhrase(log.dailyPhrase ?? '');
    } else {
      setSportStatus('rest');
      setMeatType('none');
      setAlcohol(false);
      setScreenLimit(false);
      setReading(false);
      setDailyPhrase('');
    }
  }, [open, dateStr]);

  const saveLogMutation = useMutation({
    mutationFn: (log: DailyLog) => upsertDailyLog(log),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['dailyLogs'] });
      const dailyLogs = (queryClient.getQueryData(['dailyLogs']) as DailyLog[] | undefined) ?? [];
      const goals = await queryClient.fetchQuery({ queryKey: ['goals'], queryFn: fetchGoals });
      for (const goal of goals) {
        if (goal.type !== 'habit') continue;
        const expected = computeHabitCurrentValue(goal, dailyLogs);
        if (expected == null) continue;
        if (expected !== goal.currentValue) {
          const targetValue = goal.targetValue ?? 0;
          try {
            await updateGoal(goal.id, {
              currentValue: expected,
              isCompleted: expected >= targetValue,
              status: expected >= targetValue ? 'done' : expected > 0 ? 'in-progress' : 'todo',
            });
          } catch {
            // ignore per-goal errors, main log is saved
          }
        }
      }
      await queryClient.refetchQueries({ queryKey: ['goals'] });
      setShowSuccess(true);
      toast({
        title: "Journée enregistrée ! 🎉",
        description: "Tes données ont été sauvegardées avec succès.",
      });
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        setSelectedDate(todayAtStart());
        setSportStatus('rest');
        setMeatType('none');
        setAlcohol(false);
        setScreenLimit(false);
        setReading(false);
        setDailyPhrase('');
      }, 1500);
    },
    onError: (err) => {
      toast({
        title: 'Erreur',
        description: String(err),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    const log: DailyLog = {
      id: '', // upsert se fait sur date en base
      date: dateStr,
      sportStatus,
      meatType,
      alcohol,
      screenLimit,
      reading,
      dailyPhrase: dailyPhrase.trim(),
    };
    saveLogMutation.mutate(log);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const next = startOfDay(new Date(value));
    if (next.getTime() > today.getTime()) return;
    setSelectedDate(next);
  };

  const isSubmitting = saveLogMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4 celebrate">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-semibold">Bravo ! 🎊</h3>
            <p className="text-muted-foreground mt-1">Journée validée</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-5 h-5 text-primary" />
                {isEditing ? 'Modifier la saisie du' : 'Saisie du'} {formattedDate}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date du jour à enregistrer
                </Label>
                <Input
                  type="date"
                  value={dateStr}
                  max={maxDateStr}
                  onChange={handleDateChange}
                  className="max-w-[200px]"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  Sport
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {sportOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSportStatus(option.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all touch-target',
                        sportStatus === option.value
                          ? 'toggle-active border-primary'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      {option.icon}
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">🍽️ Alimentation</Label>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Viande consommée</span>
                  <div className="grid grid-cols-3 gap-2">
                    {meatOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMeatType(option.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all touch-target',
                          meatType === option.value
                            ? 'toggle-active border-primary'
                            : 'border-border bg-card hover:border-primary/50'
                        )}
                      >
                        {option.icon}
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Alcool consommé</span>
                  </div>
                  <Switch checked={alcohol} onCheckedChange={setAlcohol} />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">🧘 Bien-être & Écrans</Label>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Pas d'écran dans le lit</span>
                  </div>
                  <Switch checked={screenLimit} onCheckedChange={setScreenLimit} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Lecture effectuée</span>
                  </div>
                  <Switch checked={reading} onCheckedChange={setReading} />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phrase" className="text-sm font-medium">
                  ✨ Phrase du jour
                </Label>
                <Textarea
                  id="phrase"
                  placeholder="Une pensée, un moment marquant, une gratitude..."
                  value={dailyPhrase}
                  onChange={(e) => setDailyPhrase(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <span className="text-xs text-muted-foreground text-right block">
                  {dailyPhrase.length}/500
                </span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {isEditing ? 'Enregistrer les modifications' : 'Valider ma journée'}
                  </span>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
