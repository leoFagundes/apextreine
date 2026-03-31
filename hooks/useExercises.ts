'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import { getUserExercises, getPublicExercises } from '@/services/exercises';
import { Exercise } from '@/types';

export function useExercises() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserExercises(user.uid);
      setExercises(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { exercises, loading, refresh };
}

export function usePublicExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicExercises().then(setExercises).finally(() => setLoading(false));
  }, []);

  return { exercises, loading };
}
