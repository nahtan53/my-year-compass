import { useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import LoginPage from '@/pages/LoginPage';

type AuthGuardProps = { children: ReactNode };

export function AuthGuard({ children }: AuthGuardProps) {
  const [session, setSession] = useState<{ user: unknown } | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      setSession(null); // Pas de Supabase → afficher l'app sans auth (dév local)
      return;
    }

    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s ? { user: s.user } : null);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? { user: s.user } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isSupabaseConfigured() || !supabase) {
    return <>{children}</>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
