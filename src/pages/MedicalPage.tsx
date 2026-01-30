import { useState } from 'react';
import { mockMedicalEvents } from '@/data/mockData';
import { MedicalEvent } from '@/types/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, addMonths, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Stethoscope, Heart, Smile, Calendar, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dentist: Smile,
  'blood-donation': Heart,
  doctor: Stethoscope,
  other: Calendar,
};

const MedicalPage = () => {
  const [events, setEvents] = useState<MedicalEvent[]>(mockMedicalEvents);

  const getStatusInfo = (nextDueDate: string) => {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const daysUntil = differenceInDays(dueDate, today);
    
    if (isPast(dueDate)) {
      return { status: 'overdue', label: 'En retard', color: 'bg-destructive/20 text-destructive' };
    } else if (daysUntil <= 30) {
      return { status: 'soon', label: 'Bientôt', color: 'bg-warning/20 text-warning' };
    }
    return { status: 'ok', label: 'OK', color: 'bg-success/20 text-success' };
  };

  const handleMarkDone = (id: string) => {
    setEvents(prev =>
      prev.map(event => {
        if (event.id === id) {
          const newLastDate = format(new Date(), 'yyyy-MM-dd');
          const newNextDate = format(addMonths(new Date(), event.intervalMonths), 'yyyy-MM-dd');
          return {
            ...event,
            lastDate: newLastDate,
            nextDueDate: newNextDate,
          };
        }
        return event;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold">Suivi Médical</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gardez une trace de vos rendez-vous importants
        </p>
      </div>

      <div className="space-y-3">
        {events.map(event => {
          const Icon = iconMap[event.type] || Calendar;
          const { label, color } = getStatusInfo(event.nextDueDate);
          const dueDate = new Date(event.nextDueDate);
          const daysUntil = differenceInDays(dueDate, new Date());

          return (
            <Card key={event.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{event.label}</h3>
                      <Badge variant="secondary" className={cn('text-xs', color)}>
                        {label}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="text-foreground/70">Dernier : </span>
                        {format(new Date(event.lastDate), "d MMM yyyy", { locale: fr })}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-foreground/70">Prochain : </span>
                        <span className={cn(
                          daysUntil < 0 ? 'text-destructive font-medium' : 
                          daysUntil <= 30 ? 'text-warning font-medium' : ''
                        )}>
                          {format(dueDate, "d MMM yyyy", { locale: fr })}
                          {daysUntil < 0 && ` (${Math.abs(daysUntil)} jours de retard)`}
                          {daysUntil >= 0 && daysUntil <= 30 && ` (dans ${daysUntil} jours)`}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 h-9"
                      onClick={() => handleMarkDone(event.id)}
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Marquer comme fait
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info box */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Rappel automatique</p>
            <p className="text-muted-foreground">
              Quand la base de données sera connectée, vous recevrez des notifications
              avant chaque rendez-vous à planifier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalPage;
