import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, isAfter, addDays, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart3,
  Dumbbell,
  BookOpen,
  Target,
  Stethoscope,
  Loader2,
  TrendingUp,
  Calendar,
  Flame,
  Plus,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchGoals, fetchDailyLogs, fetchMedicalEvents } from '@/lib/supabase-api';
import { DailyLoggerModal } from '@/components/daily/DailyLoggerModal';
import { cn } from '@/lib/utils';
import type { DailyLog } from '@/types/goals';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

function useMonthlyChartData(dailyLogs: DailyLog[], startMonth: Date, endMonth: Date) {
  return useMemo(() => {
    const normalizeDate = (d: string) => (d.includes('T') ? d.slice(0, 10) : d);
    const logByDate = new Map<string, DailyLog>();
    dailyLogs.forEach(log => logByDate.set(normalizeDate(log.date), log));

    const daysInMonth = endMonth.getDate();
    type DayData = {
      day: number;
      label: string;
      sport: number;
      reading: number;
      screenLimit: number;
      sportCumul: number | null;
      readingCumul: number | null;
      screenCumul: number | null;
    };
    const data: DayData[] = [];
    let sportCumul = 0;
    let readingCumul = 0;
    let screenCumul = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = addDays(startMonth, d - 1);
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = logByDate.get(dateStr);

      if (log) {
        const sport = log.sportStatus !== 'rest' ? 1 : 0;
        const reading = log.reading ? 1 : 0;
        const screen = log.screenLimit ? 1 : 0;
        sportCumul += sport;
        readingCumul += reading;
        screenCumul += screen;
        data.push({
          day: d,
          label: String(d),
          sport,
          reading,
          screenLimit: screen,
          sportCumul,
          readingCumul,
          screenCumul,
        });
      } else {
        data.push({
          day: d,
          label: String(d),
          sport: 0,
          reading: 0,
          screenLimit: 0,
          sportCumul: null,
          readingCumul: null,
          screenCumul: null,
        });
      }
    }
    return data;
  }, [dailyLogs, startMonth, endMonth]);
}

const AnalysePage = () => {
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const now = new Date();
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(now));
  const startMonth = viewedMonth;
  const endMonth = endOfMonth(viewedMonth);

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    refetchOnMount: true,
  });
  const { data: dailyLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['dailyLogs'],
    queryFn: fetchDailyLogs,
    refetchOnMount: true,
  });
  const { data: medicalEvents = [], isLoading: medicalLoading } = useQuery({
    queryKey: ['medicalEvents'],
    queryFn: fetchMedicalEvents,
    refetchOnMount: true,
  });

  const isLoading = goalsLoading || logsLoading || medicalLoading;

  const normalizeDate = (d: string) => (d.includes('T') ? d.slice(0, 10) : d);
  const logsThisMonth = dailyLogs.filter(log => {
    const dateStr = normalizeDate(log.date);
    const logDate = new Date(dateStr);
    return isWithinInterval(logDate, { start: startMonth, end: endMonth });
  });

  const sportDaysThisMonth = logsThisMonth.filter(l => l.sportStatus !== 'rest').length;
  const readingDaysThisMonth = logsThisMonth.filter(l => l.reading).length;
  const screenLimitDaysThisMonth = logsThisMonth.filter(l => l.screenLimit).length;
  const daysInMonth = endMonth.getDate();

  const monthlyChartData = useMonthlyChartData(dailyLogs, startMonth, endMonth);

  const completedGoals = goals.filter(g => g.isCompleted).length;
  const inProgressGoals = goals.filter(g => g.status === 'in-progress').length;
  const todoGoals = goals.filter(g => g.status === 'todo').length;
  const totalProgress = goals.length ? Math.round((completedGoals / goals.length) * 100) : 0;

  const habitGoals = goals.filter(g => g.type === 'habit');
  const habitProgress = habitGoals.map(g => ({
    title: g.title,
    current: g.currentValue,
    target: g.targetValue ?? 0,
    pct: g.targetValue ? Math.round((g.currentValue / g.targetValue) * 100) : 0,
  }));

  const upcomingMedical = medicalEvents
    .filter(e => isAfter(new Date(e.nextDueDate), now))
    .sort((a, b) => differenceInDays(new Date(a.nextDueDate), new Date(b.nextDueDate)))
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const canGoNext = addMonths(viewedMonth, 1).getTime() <= endOfMonth(now).getTime();

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Skibidi Journée
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setViewedMonth(m => subMonths(m, 1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[140px] text-center">
            {format(viewedMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setViewedMonth(m => addMonths(m, 1))}
            disabled={!canGoNext}
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Saisie rapide du jour */}
      <Button
        onClick={() => setIsLoggerOpen(true)}
        className="w-full h-14 text-base font-medium gap-3 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Plus className="w-5 h-5" />
        Saisie rapide du jour
      </Button>

      {/* Métriques du mois : survoler pour afficher le graphique cumulatif */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Ce mois-ci
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{sportDaysThisMonth}</div>
                    <div className="text-xs text-muted-foreground">jours avec sport / {daysInMonth}</div>
                    <Progress
                      value={daysInMonth ? Math.round((sportDaysThisMonth / daysInMonth) * 100) : 0}
                      className="h-1.5 mt-1 max-w-[120px]"
                    />
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-0" align="start">
                <div className="p-3 pb-0">
                  <p className="text-sm font-medium">Sport</p>
                </div>
                <ChartContainer config={{ sportCumul: { label: 'Jours sport', color: 'hsl(var(--primary))' } }} className="h-[180px] w-full">
                  <LineChart data={monthlyChartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={24} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="sportCumul" stroke="var(--color-sportCumul)" strokeWidth={2} dot={false} connectNulls={false} />
                  </LineChart>
                </ChartContainer>
              </HoverCardContent>
            </HoverCard>

            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{readingDaysThisMonth}</div>
                    <div className="text-xs text-muted-foreground">jours lecture / {daysInMonth}</div>
                    <Progress
                      value={daysInMonth ? Math.round((readingDaysThisMonth / daysInMonth) * 100) : 0}
                      className="h-1.5 mt-1 max-w-[120px]"
                    />
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-0" align="start">
                <div className="p-3 pb-0">
                  <p className="text-sm font-medium">Lecture</p>
                </div>
                <ChartContainer config={{ readingCumul: { label: 'Jours lecture', color: 'hsl(var(--primary))' } }} className="h-[180px] w-full">
                  <LineChart data={monthlyChartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={24} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="readingCumul" stroke="var(--color-readingCumul)" strokeWidth={2} dot={false} connectNulls={false} />
                  </LineChart>
                </ChartContainer>
              </HoverCardContent>
            </HoverCard>

            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{screenLimitDaysThisMonth}</div>
                    <div className="text-xs text-muted-foreground">pas d'écran au lit / {daysInMonth}</div>
                    <Progress
                      value={daysInMonth ? Math.round((screenLimitDaysThisMonth / daysInMonth) * 100) : 0}
                      className="h-1.5 mt-1 max-w-[120px]"
                    />
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-0" align="start">
                <div className="p-3 pb-0">
                  <p className="text-sm font-medium">Pas d'écran au lit</p>
                </div>
                <ChartContainer config={{ screenCumul: { label: 'Jours', color: 'hsl(var(--primary))' } }} className="h-[180px] w-full">
                  <LineChart data={monthlyChartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={24} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="screenCumul" stroke="var(--color-screenCumul)" strokeWidth={2} dot={false} connectNulls={false} />
                  </LineChart>
                </ChartContainer>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardContent>
      </Card>

      {/* Habitudes */}
      {habitGoals.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Habitudes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habitProgress.map(({ title, current, target, pct }) => (
              <div key={title}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="truncate">{title}</span>
                  <span className="text-muted-foreground shrink-0">
                    {current} / {target}
                  </span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily Logger Modal */}
      <DailyLoggerModal open={isLoggerOpen} onOpenChange={setIsLoggerOpen} />
    </div>
  );
};

export default AnalysePage;
