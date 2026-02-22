import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, ChefHat, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyse', icon: BarChart3, label: 'Skibidi Journée' },
  { to: '/recettes', icon: ChefHat, label: 'Recettes' },
  { to: '/medical', icon: Stethoscope, label: 'Médical' },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors touch-target',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary/15' : 'bg-transparent'
                )}>
                  <Icon className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
