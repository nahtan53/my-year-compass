import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type MedicalEventType = 'dentist' | 'blood-donation' | 'doctor' | 'other';

export interface MedicalEvent {
  id: string;
  user_id: string | null;
  type: MedicalEventType;
  label: string;
  last_date: string;
  next_due_date: string;
  interval_months: number;
  created_at: string;
  updated_at: string;
}

export const useMedicalEvents = () => {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_events')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setEvents(data as MedicalEvent[]);
    } catch (error) {
      console.error('Error fetching medical events:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements médicaux',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (event: Omit<MedicalEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('medical_events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      setEvents(prev => [...prev, data as MedicalEvent]);
      toast({
        title: 'Événement ajouté',
        description: `"${event.label}" a été créé`,
      });
    } catch (error) {
      console.error('Error adding medical event:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter l'événement",
        variant: 'destructive',
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<MedicalEvent>) => {
    try {
      const { error } = await supabase
        .from('medical_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      toast({
        title: 'Événement mis à jour',
        description: 'Les informations ont été sauvegardées',
      });
    } catch (error) {
      console.error('Error updating medical event:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'événement",
        variant: 'destructive',
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medical_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      toast({
        title: 'Événement supprimé',
        description: "L'événement a été supprimé",
      });
    } catch (error) {
      console.error('Error deleting medical event:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'événement",
        variant: 'destructive',
      });
    }
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
