import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function getLevelFromXp(xp: number): { level: number; nextXp: number; progress: number } {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000];
  let level = 1;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  const currentXp = thresholds[Math.min(level - 1, thresholds.length - 1)];
  const nextXp = thresholds[Math.min(level, thresholds.length - 1)];
  const progress = nextXp > currentXp ? ((xp - currentXp) / (nextXp - currentXp)) * 100 : 100;
  return { level, nextXp, progress };
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Praticante',
  4: 'Dedicado',
  5: 'Avançado',
  6: 'Expert',
  7: 'Elite',
  8: 'Mestre',
  9: 'Lendário',
  10: 'Imortal',
};

export const MUSCLE_GROUPS = [
  'peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'antebraços',
  'abdômen', 'glúteos', 'quadríceps', 'isquiotibiais', 'panturrilhas', 'trapézio', 'full body',
];

export const EXERCISE_CATEGORIES = [
  'musculação', 'corrida', 'abdominal', 'natação', 'ciclismo', 'barra fixa',
  'mobilidade', 'alongamento', 'hiit', 'crossfit', 'yoga', 'funcional',
  'cardio', 'calistenia', 'luta', 'pilates',
];

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra', dumbbell: 'Halteres', machine: 'Máquina', cable: 'Cabo',
  bodyweight: 'Peso corporal', resistance_band: 'Faixa elástica', kettlebell: 'Kettlebell',
  pull_up_bar: 'Barra fixa', bench: 'Banco', mat: 'Tapete', none: 'Nenhum',
};

export const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Emagrecer', gain_muscle: 'Ganhar músculo',
  endurance: 'Resistência', flexibility: 'Flexibilidade',
  maintain: 'Manter forma', performance: 'Performance',
};

export const DAYS_PT: Record<string, string> = {
  monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui',
  friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
};

export function calcBMI(weight: number, heightCm: number): number {
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

// Extracts an embeddable iframe src from a YouTube URL or an embed code snippet.
// Returns null if nothing recognizable is found.
export function getVideoEmbedUrl(videoUrl?: string, embedCode?: string): string | null {
  // 1. Try to extract src from a raw <iframe> embed code
  if (embedCode) {
    const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
    if (srcMatch) return srcMatch[1];
  }

  if (videoUrl) {
    // 2. Already an embed URL
    if (videoUrl.includes('youtube.com/embed/')) return videoUrl;

    // 3. youtube.com/watch?v=ID
    const watchMatch = videoUrl.match(/youtube\.com\/watch\?(?:.*&)?v=([^&\s]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

    // 4. youtu.be/ID
    const shortMatch = videoUrl.match(/youtu\.be\/([^?&\s]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}
