import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider as TooltipProviderLocal,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme } = useTheme();
  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM yyyy", { locale: fr });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const isDark = theme !== 'light';

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
          <div className="flex items-center gap-2">
            <TooltipProviderLocal delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                  >
                    <Sun className={cn('h-4 w-4', isDark && 'hidden')} />
                    <Moon className={cn('h-4 w-4', !isDark && 'hidden')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDark ? 'Mode clair' : 'Mode sombre'}
                </TooltipContent>
              </Tooltip>
            </TooltipProviderLocal>
            <span className="text-2xl font-bold text-primary font-mono">2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}
