'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Play, Copy, Trash2, Clock, Dumbbell, Heart, Edit, Globe, Lock } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { getUserWorkouts, deleteWorkout, copyWorkout } from '@/services/workouts';
import { Workout } from '@/types';
import { cn, formatMinutes, DAYS_PT } from '@/lib/utils';
import toast from 'react-hot-toast';

const WORKOUT_TYPE_COLORS: Record<string, string> = {
  A: 'bg-orange-500/10 text-orange-400',
  B: 'bg-blue-500/10 text-blue-400',
  C: 'bg-green-500/10 text-green-400',
  D: 'bg-purple-500/10 text-purple-400',
  full_body: 'bg-red-500/10 text-red-400',
  custom: 'bg-zinc-700/50 text-zinc-400',
};

function WorkoutCard({ workout, onDelete, onCopy }: { workout: Workout; onDelete: (id: string) => void; onCopy: (id: string) => void }) {
  const typeColor = WORKOUT_TYPE_COLORS[workout.type] ?? WORKOUT_TYPE_COLORS.custom;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover p-5 flex flex-col gap-4"
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0', typeColor)}>
          {workout.type === 'full_body' ? 'FB' : workout.type === 'custom' ? '★' : workout.type}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-100 truncate">{workout.name}</h3>
          {workout.description && <p className="text-xs text-zinc-500 mt-0.5 truncate">{workout.description}</p>}
        </div>
        <div className="flex items-center gap-1">
          {workout.isPublic ? <Globe size={12} className="text-zinc-600" /> : <Lock size={12} className="text-zinc-600" />}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Dumbbell size={11} /> {workout.exercises.length} exercícios
        </span>
        {workout.estimatedDuration && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatMinutes(workout.estimatedDuration)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Heart size={11} /> {workout.likes?.length ?? 0}
        </span>
      </div>

      {workout.daysOfWeek && workout.daysOfWeek.length > 0 && (
        <div className="flex gap-1">
          {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
            const active = workout.daysOfWeek?.includes(day as any);
            return (
              <div key={day} className={cn('w-7 h-7 rounded-lg text-[10px] font-semibold flex items-center justify-center',
                active ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-600'
              )}>
                {DAYS_PT[day]}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
        <Link href={`/train/${workout.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
        >
          <Play size={14} fill="currentColor" /> Iniciar
        </Link>
        <Link href={`/workouts/${workout.id}`}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
          title="Editar"
        >
          <Edit size={15} />
        </Link>
        <button onClick={() => onCopy(workout.id)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors" title="Duplicar">
          <Copy size={15} />
        </button>
        <button onClick={() => onDelete(workout.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Excluir">
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserWorkouts(user.uid).then(w => { setWorkouts(w); setLoading(false); });
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm('Deletar treino?')) return;
    await deleteWorkout(id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
    toast.success('Treino removido');
  }

  async function handleCopy(id: string) {
    if (!user) return;
    try {
      const copy = await copyWorkout(id, user.uid);
      setWorkouts(prev => [copy, ...prev]);
      toast.success('Treino duplicado!');
    } catch {
      toast.error('Erro ao duplicar');
    }
  }

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Meus Treinos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{workouts.length} fichas de treino</p>
        </div>
        <Link href="/workouts/new" className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3 sm:px-6">
          <Plus size={15} /> Nova ficha
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl shimmer" />)}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={28} className="text-zinc-600" />
          </div>
          <h3 className="font-semibold text-zinc-300 mb-1">Nenhuma ficha criada</h3>
          <p className="text-zinc-500 text-sm mb-6">Monte sua primeira ficha de treino</p>
          <Link href="/workouts/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Criar ficha
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workouts.map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} onCopy={handleCopy} />
          ))}
        </div>
      )}
    </div>
  );
}
