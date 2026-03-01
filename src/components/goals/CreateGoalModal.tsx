import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Goal, GoalType } from '@/types/goals';
import { toast } from '@/hooks/use-toast';
import { upsertGoal } from '@/lib/supabase-api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Sparkles, Check } from 'lucide-react';

interface CreateGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const goalTypes: { value: GoalType; label: string }[] = [
  { value: 'one-shot', label: 'One-shot' },
  { value: 'counter', label: 'Compteur' },
  { value: 'habit', label: 'Habitude' },
];

const iconOptions = [
  'Briefcase',
  'Waves',
  'Trophy',
  'BookOpen',
  'ChefHat',
  'Film',
  'Dumbbell',
  'Book',
  'Moon',
  'Target',
  'BarChart3',
  'Flame',
];

export function CreateGoalModal({ open, onOpenChange }: CreateGoalModalProps) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('one-shot');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('Target');
  const [targetValue, setTargetValue] = useState<string>('');

  const createGoalMutation = useMutation({
    mutationFn: (goal: Goal) => upsertGoal(goal),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['goals'] });
      setShowSuccess(true);
      toast({
        title: "Objectif créé ! 🎉",
        description: "Ton nouvel objectif a été ajouté avec succès.",
      });
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        setTitle('');
        setType('one-shot');
        setCategory('');
        setIcon('Target');
        setTargetValue('');
      }, 1500);
    },
    onError: (err) => {
      const msg = String(err);
      const isSupabaseUnconfigured = msg.includes('Supabase non configuré');
      toast({
        title: isSupabaseUnconfigured ? 'Supabase non configuré' : 'Erreur',
        description: isSupabaseUnconfigured
          ? 'Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans ton fichier .env, puis redémarre le serveur (npm run dev).'
          : msg,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!isSupabaseConfigured()) {
      toast({
        title: 'Supabase non configuré',
        description: 'Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans ton fichier .env, puis redémarre le serveur (Ctrl+C puis npm run dev).',
        variant: 'destructive',
      });
      return;
    }
    if (!title.trim() || !category.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Le titre et la catégorie sont obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    const goal: Goal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type,
      category: category.trim(),
      icon,
      targetValue: type !== 'one-shot' && targetValue ? parseInt(targetValue, 10) : undefined,
      currentValue: 0,
      status: 'todo',
      isCompleted: false,
    };

    createGoalMutation.mutate(goal);
  };

  const isSubmitting = createGoalMutation.isPending;
  const requiresTarget = type === 'counter' || type === 'habit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4 celebrate">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-semibold">Objectif créé ! 🎊</h3>
            <p className="text-muted-foreground mt-1">Tu peux maintenant le suivre</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Créer un objectif
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Lire 12 livres"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Input
                  id="category"
                  placeholder="Ex: Lecture, Sport, Carrière..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((iconName) => (
                      <SelectItem key={iconName} value={iconName}>
                        {iconName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresTarget && (
                <div className="space-y-2">
                  <Label htmlFor="target">
                    Objectif {type === 'counter' ? '(nombre)' : '(jours)'} *
                  </Label>
                  <Input
                    id="target"
                    type="number"
                    min="1"
                    placeholder={type === 'counter' ? 'Ex: 12' : 'Ex: 200'}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !category.trim() || (requiresTarget && !targetValue)}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Création...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Créer l'objectif
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
