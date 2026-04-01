'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, GripVertical, Search, Save, X, Play } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import { getWorkoutById, updateWorkout } from '@/services/workouts';
import { getUserExercises } from '@/services/exercises';
import { Exercise, WorkoutExercise, WorkoutSet, DayOfWeek } from '@/types';
import { cn, DAYS_PT } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['A','B','C','D','full_body','upper_lower','push_pull_legs','custom']),
  level: z.enum(['beginner','intermediate','advanced','elite']),
  daysOfWeek: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const DAYS: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [showExSearch, setShowExSearch] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([getWorkoutById(id as string), getUserExercises(user.uid)]).then(([w, exs]) => {
      if (!w) { router.push('/workouts'); return; }
      const exMap = new Map(exs.map(e => [e.id, e]));
      setWorkoutExercises(w.exercises.map(we => ({ ...we, exercise: exMap.get(we.exerciseId) })));
      reset({ name: w.name, description: w.description ?? '', type: w.type, level: w.level, daysOfWeek: w.daysOfWeek ?? [], isPublic: w.isPublic });
      setAllExercises(exs);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  function addExercise(ex: Exercise) {
    const sets: WorkoutSet[] = Array.from({ length: ex.defaultSets ?? 3 }, () => ({
      id: uuidv4(), reps: ex.defaultReps ?? 12, weight: ex.defaultWeight ?? 0, completed: false,
    }));
    setWorkoutExercises(prev => [...prev, { id: uuidv4(), exerciseId: ex.id, exercise: ex, order: prev.length, sets, restSeconds: ex.defaultRestSeconds ?? 60 }]);
    setShowExSearch(false);
  }

  async function onSubmit(data: FormData) {
    if (!id || workoutExercises.length === 0) { toast.error('Adicione exercícios'); return; }
    try {
      await updateWorkout(id as string, { ...data, daysOfWeek: data.daysOfWeek as DayOfWeek[], exercises: workoutExercises.map((e, i) => ({ ...e, order: i })) });
      toast.success('Salvo!');
      router.push('/workouts');
    } catch { toast.error('Erro ao salvar'); }
  }

  const filteredEx = allExercises.filter(e => e.name.toLowerCase().includes(exSearch.toLowerCase()));

  if (loading) return <div className="page-container"><div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}</div></div>;

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/workouts" className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="section-title">Editar treino</h1>
        <Link href={`/train/${id}`} className="ml-auto btn-primary text-sm py-2 flex items-center gap-1.5">
          <Play size={14} fill="currentColor" /> Iniciar
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input {...register('name')} className="input" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea {...register('description')} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select {...register('type')} className="input">
                {[['A','Treino A'],['B','Treino B'],['C','Treino C'],['D','Treino D'],['full_body','Full Body'],['custom','Personalizado']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nível</label>
              <select {...register('level')} className="input">
                {[['beginner','Iniciante'],['intermediate','Intermediário'],['advanced','Avançado'],['elite','Elite']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <label className="label mb-3">Dias da semana</label>
          <Controller name="daysOfWeek" control={control} render={({ field }) => (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {DAYS.map(day => {
                const active = field.value?.includes(day);
                return (
                  <button key={day} type="button"
                    onClick={() => { const curr = field.value ?? []; field.onChange(active ? curr.filter(d => d !== day) : [...curr, day]); }}
                    className={cn('flex-shrink-0 w-9 h-9 rounded-xl text-xs font-semibold transition-all', active ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700')}
                  >{DAYS_PT[day]}</button>
                );
              })}
            </div>
          )} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-200">Exercícios ({workoutExercises.length})</h2>
            <button type="button" onClick={() => setShowExSearch(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
              <Plus size={15} /> Adicionar
            </button>
          </div>
          <Reorder.Group axis="y" values={workoutExercises} onReorder={setWorkoutExercises} className="space-y-2">
            {workoutExercises.map(item => {
              const ex = allExercises.find(e => e.id === item.exerciseId);
              return (
                <Reorder.Item key={item.id} value={item}>
                  <div className="card border-zinc-800 p-4 flex items-center gap-3">
                    <GripVertical size={18} className="text-zinc-600 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{ex?.name ?? 'Exercício'}</div>
                      <div className="text-xs text-zinc-500">{item.sets.length} séries · {item.restSeconds}s</div>
                    </div>
                    <button onClick={() => setWorkoutExercises(prev => prev.filter(e => e.id !== item.id))} className="p-1.5 text-zinc-600 hover:text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        <div className="flex gap-3 pb-6">
          <Link href="/workouts" className="btn-secondary flex-1 text-center">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} />Salvar</>}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showExSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowExSearch(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                <Search size={16} className="text-zinc-500" />
                <input autoFocus value={exSearch} onChange={e => setExSearch(e.target.value)} placeholder="Buscar..." className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none" />
                <button onClick={() => setShowExSearch(false)} className="text-zinc-500"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {filteredEx.map(ex => {
                  const added = workoutExercises.some(w => w.exerciseId === ex.id);
                  return (
                    <button key={ex.id} onClick={() => !added && addExercise(ex)} disabled={added}
                      className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors', added ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-800')}>
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-400 text-xs font-bold">{ex.name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate">{ex.name}</div>
                        <div className="text-xs text-zinc-500">{ex.category} · {ex.muscleGroup}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
