'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Flame, Zap, Dumbbell, Clock, TrendingUp, Plus,
  Play, Trophy, Target, Calendar, ChevronRight, BarChart2
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { getUserWorkouts } from '@/services/workouts';
import { getUserSessions } from '@/services/sessions';
import { getUserExercises } from '@/services/exercises';
import { Workout, WorkoutSession } from '@/types';
import { cn, formatMinutes, getLevelFromXp, LEVEL_NAMES } from '@/lib/utils';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatCardProps {
  icon: React.ElementType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
}
function StatCard({ icon: Icon, label, value, sub, color = 'orange', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card"
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3',
        color === 'orange' ? 'bg-orange-500/10' : color === 'blue' ? 'bg-blue-500/10' : color === 'green' ? 'bg-green-500/10' : 'bg-purple-500/10'
      )}>
        <Icon size={18} className={cn(
          color === 'orange' ? 'text-orange-500' : color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : 'text-purple-400'
        )} />
      </div>
      <div className="font-display text-2xl font-bold text-zinc-100">{value}</div>
      <div className="text-sm text-zinc-400">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function Heatmap({ sessions }: { sessions: WorkoutSession[] }) {
  const days = Array.from({ length: 84 }, (_, i) => subDays(new Date(), 83 - i));
  const trainedDays = new Set(sessions.map(s => format(s.startedAt, 'yyyy-MM-dd')));

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((day, i) => {
        const key = format(day, 'yyyy-MM-dd');
        const trained = trainedDays.has(key);
        const isToday = isSameDay(day, new Date());
        return (
          <div
            key={i}
            title={format(day, 'dd/MM/yyyy', { locale: ptBR })}
            className={cn(
              'w-3 h-3 rounded-sm transition-colors',
              trained ? 'bg-orange-500' : 'bg-zinc-800',
              isToday && !trained && 'border border-zinc-600'
            )}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserWorkouts(user.uid),
      getUserSessions(user.uid, 50),
      getUserExercises(user.uid),
    ]).then(([w, s, e]) => {
      setWorkouts(w);
      setSessions(s);
      setExerciseCount(e.length);
    }).finally(() => setLoading(false));
  }, [user]);

  const levelInfo = getLevelFromXp(profile?.xp ?? 0);
  const totalMinutes = profile?.totalMinutes ?? 0;
  const recentSessions = sessions.slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="page-container pb-24 lg:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-zinc-500 text-sm">{greeting},</p>
        <h1 className="font-display text-3xl font-extrabold text-zinc-100">
          {profile?.displayName?.split(' ')[0] ?? 'Atleta'} 👋
        </h1>
      </motion.div>

      {/* Level / XP Banner */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-orange-600/20 to-orange-500/5 border border-orange-500/20 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-orange-400 font-semibold uppercase tracking-wider mb-0.5">
                Nível {levelInfo.level} · {LEVEL_NAMES[levelInfo.level]}
              </div>
              <div className="font-display text-xl font-bold text-zinc-100">{profile.xp} XP</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                <Flame size={14} className="text-orange-500" />
                <span className="text-orange-400 font-bold text-sm">{profile.streak} dias</span>
              </div>
            </div>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{profile.xp} XP</span>
            <span>{levelInfo.nextXp} XP para nível {levelInfo.level + 1}</span>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Dumbbell} label="Treinos" value={profile?.totalWorkouts ?? 0} sub="total" color="orange" delay={0.1} />
        <StatCard icon={Clock} label="Horas" value={formatMinutes(totalMinutes)} sub="treinadas" color="blue" delay={0.15} />
        <StatCard icon={Target} label="Exercícios" value={exerciseCount} sub="cadastrados" color="green" delay={0.2} />
        <StatCard icon={Trophy} label="Fichas" value={workouts.length} sub="de treino" color="purple" delay={0.25} />
      </div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
        <h2 className="section-title mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {workouts.slice(0, 2).map(w => (
            <Link key={w.id} href={`/train/${w.id}`}
              className="card-hover p-4 flex flex-col gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Play size={16} className="text-orange-500" />
              </div>
              <div className="text-sm font-semibold text-zinc-100 truncate">{w.name}</div>
              <div className="text-xs text-zinc-500">{w.exercises.length} exercícios</div>
            </Link>
          ))}
          <Link href="/workouts/new" className="card-hover p-4 flex flex-col gap-2 border-dashed">
            <div className="w-8 h-8 rounded-xl bg-zinc-700/50 flex items-center justify-center">
              <Plus size={16} className="text-zinc-400" />
            </div>
            <div className="text-sm font-medium text-zinc-400">Novo treino</div>
          </Link>
          <Link href="/exercises/new" className="card-hover p-4 flex flex-col gap-2 border-dashed">
            <div className="w-8 h-8 rounded-xl bg-zinc-700/50 flex items-center justify-center">
              <Dumbbell size={16} className="text-zinc-400" />
            </div>
            <div className="text-sm font-medium text-zinc-400">Novo exercício</div>
          </Link>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-100">Atividade — 12 semanas</h3>
            <span className="text-xs text-zinc-500">{sessions.length} sessões</span>
          </div>
          <Heatmap sessions={sessions} />
          <div className="flex items-center gap-2 mt-3 text-xs text-zinc-600">
            <span>Menos</span>
            <div className="flex gap-1">
              {['bg-zinc-800','bg-orange-900','bg-orange-700','bg-orange-500'].map(c => (
                <div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </motion.div>

        {/* Recent sessions */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-100">Últimos treinos</h3>
            <Link href="/progress" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl shimmer" />)}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell size={32} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Nenhum treino ainda</p>
              <p className="text-zinc-600 text-xs mt-1">Inicie seu primeiro treino!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={14} className="text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-200 truncate">{s.workoutId}</div>
                    <div className="text-xs text-zinc-500">
                      {format(s.startedAt, "d 'de' MMM", { locale: ptBR })} · {Math.round((s.durationSeconds ?? 0) / 60)}min
                    </div>
                  </div>
                  <div className="text-xs text-orange-500 font-semibold">+{s.xpEarned} XP</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
