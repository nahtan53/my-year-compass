import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Goal {
  id: string;
  user_id: string | null;
  title: string;
  type: 'one-shot' | 'counter' | 'habit';
  category: string;
  icon: string;
  target_value: number | null;
  current_value: number;
  status: 'todo' | 'in-progress' | 'done';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGoals(data as Goal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les objectifs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => [...prev, data as Goal]);
      toast({
        title: 'Objectif ajouté',
        description: `"${goal.title}" a été créé`,
      });
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter l'objectif",
        variant: 'destructive',
      });
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'objectif",
        variant: 'destructive',
      });
    }
  };

  const incrementGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal || !goal.target_value) return;

    const newValue = Math.min(goal.current_value + 1, goal.target_value);
    const isCompleted = newValue >= goal.target_value;

    await updateGoal(id, {
      current_value: newValue,
      is_completed: isCompleted,
      status: isCompleted ? 'done' : 'in-progress',
    });
  };

  const decrementGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newValue = Math.max(goal.current_value - 1, 0);

    await updateGoal(id, {
      current_value: newValue,
      is_completed: false,
      status: newValue === 0 ? 'todo' : 'in-progress',
    });
  };

  const toggleGoalComplete = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const isCompleted = !goal.is_completed;

    await updateGoal(id, {
      is_completed: isCompleted,
      status: isCompleted ? 'done' : 'todo',
      current_value: isCompleted ? 1 : 0,
    });
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({
        title: 'Objectif supprimé',
        description: "L'objectif a été supprimé",
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'objectif",
        variant: 'destructive',
      });
    }
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    incrementGoal,
    decrementGoal,
    toggleGoalComplete,
    deleteGoal,
    refetch: fetchGoals,
  };
};
