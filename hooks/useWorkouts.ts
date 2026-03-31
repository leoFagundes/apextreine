'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import { getUserWorkouts, getWorkoutById } from '@/services/workouts';
import { Workout } from '@/types';

export function useWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserWorkouts(user.uid);
      setWorkouts(data);
    } catch (e) {
      setError('Erro ao carregar treinos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workouts, loading, error, refresh };
}

export function useWorkout(id: string | null) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getWorkoutById(id).then(setWorkout).finally(() => setLoading(false));
  }, [id]);

  return { workout, loading };
}
