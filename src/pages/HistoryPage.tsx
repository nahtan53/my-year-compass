import { mockDailyLogs } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dumbbell, BookOpen, Quote } from 'lucide-react';

const HistoryPage = () => {
  const today = new Date();
  const currentMonth = today;
  const previousMonth = subMonths(today, 1);

  const renderHeatmap = (month: Date, dataKey: 'sport' | 'reading') => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    // Pad to start on Monday
    const startDay = start.getDay();
    const padStart = startDay === 0 ? 6 : startDay - 1;

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
          <div key={i} className="text-[10px] text-muted-foreground text-center h-5 flex items-center justify-center">
            {day}
          </div>
        ))}
        
        {/* Empty cells for padding */}
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`pad-${i}`} className="w-full aspect-square" />
        ))}
        
        {/* Day cells */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = mockDailyLogs.find(l => l.date === dateStr);
          
          let level = 0;
          if (log) {
            if (dataKey === 'sport') {
              level = log.sportStatus !== 'rest' ? 4 : 0;
            } else if (dataKey === 'reading') {
              level = log.reading ? 4 : 0;
            }
          }
          
          const isToday = isSameDay(day, today);
          
          return (
            <div
              key={dateStr}
              className={cn(
                'w-full aspect-square heatmap-cell',
                `heatmap-${level}`,
                isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
              )}
              title={`${format(day, 'dd MMM', { locale: fr })}${log ? ` - ${dataKey === 'sport' ? log.sportStatus : log.reading ? 'Lu' : 'Non lu'}` : ''}`}
            />
          );
        })}
      </div>
    );
  };

  const phrasesWithDates = mockDailyLogs
    .filter(log => log.dailyPhrase && log.dailyPhrase.trim().length > 0)
    .slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-xl font-bold">Historique</h1>

      {/* Sport Heatmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            Sport - {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderHeatmap(currentMonth, 'sport')}
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
            <span>Moins</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map(level => (
                <div key={level} className={`w-3 h-3 rounded-sm heatmap-${level}`} />
              ))}
            </div>
            <span>Plus</span>
          </div>
        </CardContent>
      </Card>

      {/* Reading Heatmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Lecture - {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderHeatmap(currentMonth, 'reading')}
        </CardContent>
      </Card>

      {/* Phrases du jour */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Quote className="w-4 h-4 text-primary" />
            Phrases du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {phrasesWithDates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune phrase enregistrée pour le moment.
            </p>
          ) : (
            phrasesWithDates.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <p className="text-sm leading-relaxed">{log.dailyPhrase}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(log.date), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
