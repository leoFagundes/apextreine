// ─── User & Auth ───────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  goal?: TrainingGoal;
  level?: FitnessLevel;
  favoriteSport?: string;
  isPublic: boolean;
  followers: string[];
  following: string[];
  createdAt: Date;
  updatedAt: Date;
  // Gamification
  xp: number;
  level_num: number;
  streak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalMinutes: number;
  badges: Badge[];
  personalRecords: PersonalRecord[];
  lastTrainedAt?: Date;
}

export type TrainingGoal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'endurance'
  | 'flexibility'
  | 'maintain'
  | 'performance';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

// ─── Exercise ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  uid: string; // owner
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup | string;
  secondaryMuscles?: string[];
  type: ExerciseType;
  description?: string;
  notes?: string;
  estimatedDuration?: number; // minutes
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number; // kg
  defaultRestSeconds?: number;
  level: FitnessLevel;
  equipment?: Equipment[];
  videoUrl?: string;
  embedCode?: string;
  imageUrl?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ExerciseCategory =
  | 'musculação'
  | 'corrida'
  | 'abdominal'
  | 'natação'
  | 'ciclismo'
  | 'barra fixa'
  | 'mobilidade'
  | 'alongamento'
  | 'hiit'
  | 'crossfit'
  | 'yoga'
  | 'funcional'
  | 'cardio'
  | 'calistenia'
  | 'luta'
  | 'pilates'
  | string;

export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'bíceps'
  | 'tríceps'
  | 'antebraços'
  | 'abdômen'
  | 'glúteos'
  | 'quadríceps'
  | 'isquiotibiais'
  | 'panturrilhas'
  | 'trapézio'
  | 'full body'
  | string;

export type ExerciseType =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'balance'
  | 'plyometric'
  | 'functional';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'resistance_band'
  | 'kettlebell'
  | 'pull_up_bar'
  | 'bench'
  | 'mat'
  | 'none';

// ─── Workout ────────────────────────────────────────────────────────────────

export interface Workout {
  id: string;
  uid: string;
  name: string;
  description?: string;
  type: WorkoutType;
  exercises: WorkoutExercise[];
  daysOfWeek?: DayOfWeek[];
  estimatedDuration?: number; // minutes
  level: FitnessLevel;
  tags?: string[];
  isPublic: boolean;
  isTemplate: boolean;
  version: number;
  likes: string[];
  copies: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkoutType =
  | 'A' | 'B' | 'C' | 'D'
  | 'full_body'
  | 'upper_lower'
  | 'push_pull_legs'
  | 'custom';

export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  order: number;
  sets: WorkoutSet[];
  restSeconds: number;
  notes?: string;
  supersetWith?: string; // workoutExercise id
  isCircuit?: boolean;
}

export interface WorkoutSet {
  id: string;
  reps?: number;
  weight?: number; // kg
  duration?: number; // seconds
  distance?: number; // meters
  completed?: boolean;
  actualReps?: number;
  actualWeight?: number;
}

// ─── Workout Session (Train Mode) ────────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  uid: string;
  workoutId: string;
  workout?: Workout;
  startedAt: Date;
  finishedAt?: Date;
  durationSeconds?: number;
  exercises: SessionExercise[];
  totalVolume?: number; // kg * reps
  estimatedCalories?: number;
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  xpEarned?: number;
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  sets: SessionSet[];
}

export interface SessionSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
}

// ─── Progress & Metrics ──────────────────────────────────────────────────────

export interface BodyMetric {
  id: string;
  uid: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  notes?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight?: number;
  maxReps?: number;
  maxDuration?: number;
  achievedAt: Date;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  target: number;
  unit: string;
  xpReward: number;
  badgeReward?: string;
  endsAt: Date;
  participants: string[];
}

// ─── Store State ──────────────────────────────────────────────────────────────

export interface TrainState {
  session: WorkoutSession | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restTimeLeft: number;
  isRunning: boolean;
  elapsedSeconds: number;
}
