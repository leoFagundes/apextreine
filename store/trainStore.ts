import { create } from 'zustand';
import { WorkoutSession, Workout, TrainState } from '@/types';

interface TrainStore extends TrainState {
  isComplete: boolean;
  startSession: (workout: Workout, uid: string) => void;
  completeSet: () => void;
  skipExercise: () => void;
  nextExercise: () => void;
  togglePause: () => void;
  startRest: (seconds: number) => void;
  tickClock: () => void;
  tickRest: () => void;
  finishSession: () => WorkoutSession | null;
  resetSession: () => void;
}

const initialState = {
  session: null as WorkoutSession | null,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  isResting: false,
  restTimeLeft: 0,
  isRunning: false,
  elapsedSeconds: 0,
  isComplete: false,
};

export const useTrainStore = create<TrainStore>((set, get) => ({
  ...initialState,

  startSession(workout, uid) {
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      uid,
      workoutId: workout.id,
      workout,
      startedAt: new Date(),
      exercises: workout.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        exerciseName: we.exercise?.name ?? '',
        sets: we.sets.map((s) => ({ reps: s.reps, weight: s.weight, duration: s.duration, distance: s.distance, completed: false })),
      })),
    };
    set({ session, isRunning: true, currentExerciseIndex: 0, currentSetIndex: 0, elapsedSeconds: 0 });
  },

  completeSet() {
    const { session, currentExerciseIndex, currentSetIndex } = get();
    if (!session) return;
    const exercises = [...session.exercises];
    exercises[currentExerciseIndex].sets[currentSetIndex].completed = true;
    const currentExercise = session.workout!.exercises[currentExerciseIndex];
    const restSec = currentExercise.restSeconds ?? 60;
    const totalSets = exercises[currentExerciseIndex].sets.length;
    if (currentSetIndex < totalSets - 1) {
      set({ session: { ...session, exercises }, currentSetIndex: currentSetIndex + 1, isResting: true, restTimeLeft: restSec });
    } else {
      // move to next exercise
      const nextIdx = currentExerciseIndex + 1;
      if (nextIdx < session.workout!.exercises.length) {
        set({ session: { ...session, exercises }, currentExerciseIndex: nextIdx, currentSetIndex: 0, isResting: true, restTimeLeft: restSec });
      } else {
        // done!
        set({ session: { ...session, exercises }, isRunning: false, isComplete: true });
      }
    }
  },

  skipExercise() {
    const { session, currentExerciseIndex } = get();
    if (!session) return;
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < session.workout!.exercises.length) {
      set({ currentExerciseIndex: nextIdx, currentSetIndex: 0, isResting: false });
    } else {
      set({ isRunning: false });
    }
  },

  nextExercise() {
    get().skipExercise();
  },

  togglePause() {
    set((s) => ({ isRunning: !s.isRunning }));
  },

  startRest(seconds) {
    set({ isResting: true, restTimeLeft: seconds });
  },

  tickClock() {
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },

  tickRest() {
    const { restTimeLeft } = get();
    if (restTimeLeft <= 1) {
      set({ isResting: false, restTimeLeft: 0 });
    } else {
      set({ restTimeLeft: restTimeLeft - 1 });
    }
  },

  finishSession() {
    const { session, elapsedSeconds } = get();
    if (!session) return null;
    const finished: WorkoutSession = {
      ...session,
      finishedAt: new Date(),
      durationSeconds: elapsedSeconds,
      estimatedCalories: Math.round(elapsedSeconds / 60 * 6), // ~6 kcal/min approx
      xpEarned: Math.round(elapsedSeconds / 60) * 5 + 50,
    };
    set({ session: finished, isRunning: false });
    return finished;
  },

  resetSession() {
    set(initialState);
  },
}));
