import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sparkles } from 'lucide-react';

export function Header() {
  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM yyyy", { locale: fr });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Life Tracker</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{capitalizedDate}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary font-mono">2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}
