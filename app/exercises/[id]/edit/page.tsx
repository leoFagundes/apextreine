'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import { updateExercise } from '@/services/exercises';
import { Equipment } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS, EQUIPMENT_LABELS, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  muscleGroup: z.string().min(1),
  type: z.enum(['strength','cardio','flexibility','balance','plyometric','functional']),
  level: z.enum(['beginner','intermediate','advanced','elite']),
  description: z.string().optional(),
  notes: z.string().optional(),
  defaultSets: z.coerce.number().optional(),
  defaultReps: z.coerce.number().optional(),
  defaultWeight: z.coerce.number().optional(),
  defaultRestSeconds: z.coerce.number().optional(),
  equipment: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  embedCode: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

export default function EditExercisePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { equipment: [] },
  });

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'exercises', id as string)).then(snap => {
      if (!snap.exists()) { router.push('/exercises'); return; }
      const d = snap.data();
      reset({ ...d, tags: d.tags?.join(', ') ?? '' });
    });
  }, [id, reset, router]);

  async function onSubmit(data: FormData) {
    if (!id) return;
    try {
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await updateExercise(id as string, { ...data, tags, equipment: (data.equipment ?? []) as Equipment[], embedCode: data.embedCode || undefined });
      toast.success('Exercício atualizado!');
      router.push('/exercises');
    } catch {
      toast.error('Erro ao salvar');
    }
  }

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/exercises" className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="section-title">Editar exercício</h1>
      </div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">Informações básicas</h2>
          <div>
            <label className="label">Nome *</label>
            <input {...register('name')} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria *</label>
              <select {...register('category')} className="input">
                {EXERCISE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Grupo muscular *</label>
              <select {...register('muscleGroup')} className="input">
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select {...register('type')} className="input">
                {[['strength','Força'],['cardio','Cardio'],['flexibility','Flexibilidade'],['balance','Equilíbrio'],['plyometric','Pliométrico'],['functional','Funcional']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
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

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">Configuração</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Séries</label><input {...register('defaultSets')} type="number" className="input" /></div>
            <div><label className="label">Reps</label><input {...register('defaultReps')} type="number" className="input" /></div>
            <div><label className="label">Carga (kg)</label><input {...register('defaultWeight')} type="number" step="0.5" className="input" /></div>
            <div><label className="label">Descanso (seg)</label><input {...register('defaultRestSeconds')} type="number" className="input" /></div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">Equipamentos</h2>
          <Controller name="equipment" control={control} render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {Object.entries(EQUIPMENT_LABELS).map(([v, l]) => {
                const selected = field.value?.includes(v);
                return (
                  <button key={v} type="button"
                    onClick={() => { const curr = field.value ?? []; field.onChange(selected ? curr.filter(x => x !== v) : [...curr, v]); }}
                    className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-all',
                      selected ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    )}
                  >{l}</button>
                );
              })}
            </div>
          )} />
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">Detalhes</h2>
          <div>
            <label className="label">Descrição</label>
            <textarea {...register('description')} rows={3} className="input resize-none" />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" />
          </div>
          <div>
            <label className="label">URL do vídeo (YouTube)</label>
            <input {...register('videoUrl')} className="input" placeholder="https://youtube.com/watch?v=... ou https://youtu.be/..." />
          </div>
          <div>
            <label className="label">Embed do vídeo</label>
            <textarea {...register('embedCode')} rows={3} placeholder={'<iframe src="https://www.youtube.com/embed/..." ...></iframe>'} className="input resize-none font-mono text-xs" />
            <p className="text-xs text-zinc-600 mt-1">Cole aqui o código embed (YouTube › Compartilhar › Incorporar). Se preenchido, o embed tem prioridade.</p>
          </div>
          <div>
            <label className="label">Tags (separadas por vírgula)</label>
            <input {...register('tags')} className="input" />
          </div>
        </div>

        <div className="card p-4">
          <Controller name="isPublic" control={control} render={({ field }) => (
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium text-zinc-200">Tornar público</div>
                <div className="text-xs text-zinc-500">Outros usuários poderão ver este exercício</div>
              </div>
              <button type="button" onClick={() => field.onChange(!field.value)}
                className={cn('w-11 h-6 rounded-full transition-colors relative', field.value ? 'bg-orange-500' : 'bg-zinc-700')}>
                <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', field.value ? 'left-5.5' : 'left-0.5')} />
              </button>
            </label>
          )} />
        </div>

        <div className="flex gap-3 pb-6">
          <Link href="/exercises" className="btn-secondary flex-1 text-center">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} />Salvar</>}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
