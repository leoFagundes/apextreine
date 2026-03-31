import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import { getUserExercises } from '@/services/exercises';
import { getUserWorkouts } from '@/services/workouts';
import { Exercise, Workout } from '@/types';

// ─── useExercises ────────────────────────────────────────────────────────────

export function useExercises() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserExercises(user.uid);
      setExercises(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { exercises, loading, error, refresh, setExercises };
}

// ─── useWorkouts ─────────────────────────────────────────────────────────────

export function useWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserWorkouts(user.uid);
      setWorkouts(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { workouts, loading, refresh };
}

// ─── useTimer ────────────────────────────────────────────────────────────────

export function useTimer(initialSeconds = 0, autoStart = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  return {
    seconds,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => { setRunning(false); setSeconds(initialSeconds); },
    toggle: () => setRunning(r => !r),
  };
}

// ─── useCountdown ────────────────────────────────────────────────────────────

export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  return {
    seconds,
    running,
    progress: initialSeconds > 0 ? (seconds / initialSeconds) * 100 : 0,
    start: () => { setSeconds(initialSeconds); setRunning(true); },
    startFrom: (s: number) => { setSeconds(s); setRunning(true); },
    pause: () => setRunning(false),
    reset: () => { setRunning(false); setSeconds(initialSeconds); },
    skip: () => { setRunning(false); setSeconds(0); onCompleteRef.current?.(); },
  };
}

// ─── useLocalStorage ─────────────────────────────────────────────────────────

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((val: T | ((prev: T) => T)) => {
    try {
      const valueToStore = val instanceof Function ? val(value) : val;
      setValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch {}
  }, [key, value]);

  return [value, setStoredValue] as const;
}

// ─── useDebounce ─────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}
