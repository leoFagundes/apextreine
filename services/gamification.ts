import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Badge, WorkoutSession } from '@/types';

// ─── XP thresholds ────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  complete_workout: 50,
  per_minute: 1,       // 1 XP per minute of workout
  new_exercise: 10,
  new_workout: 20,
  streak_bonus: 25,    // bonus for maintaining streak
  personal_record: 100,
} as const;

// ─── Badge definitions ────────────────────────────────────────────────────────

export const BADGE_DEFINITIONS: Record<string, Omit<Badge, 'earnedAt'>> = {
  first_workout: {
    id: 'first_workout',
    name: 'Primeiro Passo',
    description: 'Complete seu primeiro treino',
    icon: '🏋️',
    rarity: 'common',
  },
  week_streak: {
    id: 'week_streak',
    name: 'Semana Perfeita',
    description: '7 dias consecutivos treinando',
    icon: '🔥',
    rarity: 'rare',
  },
  month_streak: {
    id: 'month_streak',
    name: 'Mês de Ferro',
    description: '30 dias consecutivos treinando',
    icon: '⚡',
    rarity: 'legendary',
  },
  ten_workouts: {
    id: 'ten_workouts',
    name: 'Consistente',
    description: '10 treinos concluídos',
    icon: '💪',
    rarity: 'common',
  },
  fifty_workouts: {
    id: 'fifty_workouts',
    name: 'Dedicado',
    description: '50 treinos concluídos',
    icon: '🎯',
    rarity: 'rare',
  },
  centurion: {
    id: 'centurion',
    name: 'Centurião',
    description: '100 treinos concluídos',
    icon: '👑',
    rarity: 'epic',
  },
  heavy_lifter: {
    id: 'heavy_lifter',
    name: 'Levantador Pesado',
    description: 'Treino com mais de 10 toneladas de volume total',
    icon: '🏆',
    rarity: 'epic',
  },
  marathon: {
    id: 'marathon',
    name: 'Maratonista',
    description: 'Mais de 2 horas em um único treino',
    icon: '🏃',
    rarity: 'rare',
  },
};

// ─── Check and award badges ───────────────────────────────────────────────────

export async function checkAndAwardBadges(
  uid: string,
  totalWorkouts: number,
  streak: number,
  session: WorkoutSession,
  existingBadgeIds: string[]
): Promise<Badge[]> {
  const newBadges: Badge[] = [];
  const existing = new Set(existingBadgeIds);

  function award(id: string) {
    if (!existing.has(id) && BADGE_DEFINITIONS[id]) {
      const badge: Badge = { ...BADGE_DEFINITIONS[id], earnedAt: new Date() };
      newBadges.push(badge);
      existing.add(id);
    }
  }

  // First workout
  if (totalWorkouts === 1) award('first_workout');

  // Workout count milestones
  if (totalWorkouts >= 10) award('ten_workouts');
  if (totalWorkouts >= 50) award('fifty_workouts');
  if (totalWorkouts >= 100) award('centurion');

  // Streak milestones
  if (streak >= 7) award('week_streak');
  if (streak >= 30) award('month_streak');

  // Session-based
  const durationMinutes = (session.durationSeconds ?? 0) / 60;
  if (durationMinutes >= 120) award('marathon');

  const volume = session.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((a, s) => a + ((s.reps ?? 0) * (s.weight ?? 0)), 0);
  }, 0);
  if (volume >= 10000) award('heavy_lifter'); // 10 tons

  // Save new badges to Firestore
  if (newBadges.length > 0) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      badges: arrayUnion(...newBadges),
      updatedAt: serverTimestamp(),
    });
  }

  return newBadges;
}

// ─── Calculate XP for session ────────────────────────────────────────────────

export function calculateSessionXP(session: WorkoutSession, streak: number): number {
  let xp = XP_REWARDS.complete_workout;
  const minutes = Math.round((session.durationSeconds ?? 0) / 60);
  xp += minutes * XP_REWARDS.per_minute;

  // Streak bonus
  if (streak > 1) {
    xp += Math.min(streak, 30) * XP_REWARDS.streak_bonus / 10;
  }

  return Math.round(xp);
}

// ─── Leaderboard helpers ─────────────────────────────────────────────────────

export function getLevelTier(level: number): string {
  if (level >= 9) return 'Lendário';
  if (level >= 7) return 'Elite';
  if (level >= 5) return 'Avançado';
  if (level >= 3) return 'Intermediário';
  return 'Iniciante';
}
