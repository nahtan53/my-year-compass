import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type SportStatus = 'rest' | 'running' | 'muscu' | 'other';
export type MeatType = 'none' | 'chicken' | 'red';

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  sport_status: SportStatus;
  meat_type: MeatType;
  alcohol: boolean;
  screen_limit: boolean;
  reading: boolean;
  daily_phrase: string;
  created_at: string;
  updated_at: string;
}

export const useDailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setLogs(data as DailyLog[]);
    } catch (error) {
      console.error('Error fetching daily logs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les logs quotidiens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find(log => log.date === today);
  };

  const getLogByDate = (date: string) => {
    return logs.find(log => log.date === date);
  };

  const saveLog = async (logData: Omit<DailyLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const existingLog = getLogByDate(logData.date);

    try {
      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('daily_logs')
          .update(logData)
          .eq('id', existingLog.id);

        if (error) throw error;
        setLogs(prev => prev.map(l => l.id === existingLog.id ? { ...l, ...logData } : l));
      } else {
        // Insert new log
        const { data, error } = await supabase
          .from('daily_logs')
          .insert(logData)
          .select()
          .single();

        if (error) throw error;
        setLogs(prev => [data as DailyLog, ...prev]);
      }

      toast({
        title: 'Journée enregistrée ! 🎉',
        description: 'Tes données ont été sauvegardées',
      });
    } catch (error) {
      console.error('Error saving daily log:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le log',
        variant: 'destructive',
      });
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLogs(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Log supprimé',
        description: 'Le log a été supprimé',
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le log',
        variant: 'destructive',
      });
    }
  };

  // Get stats for heatmap
  const getSportDays = () => {
    return logs
      .filter(log => log.sport_status !== 'rest')
      .map(log => log.date);
  };

  const getReadingDays = () => {
    return logs
      .filter(log => log.reading)
      .map(log => log.date);
  };

  return {
    logs,
    loading,
    getTodayLog,
    getLogByDate,
    saveLog,
    deleteLog,
    getSportDays,
    getReadingDays,
    refetch: fetchLogs,
  };
};
