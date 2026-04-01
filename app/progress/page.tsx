'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/store/AuthContext';
import { getUserSessions } from '@/services/sessions';
import { getUserMetrics, saveBodyMetric } from '@/services/sessions';
import { WorkoutSession, BodyMetric } from '@/types';
import { formatDuration, formatMinutes, calcBMI } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, eachWeekOfInterval, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scale, Ruler, TrendingUp, Dumbbell, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface TooltipPayloadEntry { name: string; value: number | string; color: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }
const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>{p.value} {p.name}</p>
      ))}
    </div>
  );
};

export default function ProgressPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [metricForm, setMetricForm] = useState({ weight: '', bodyFat: '', waist: '' });

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserSessions(user.uid, 50), getUserMetrics(user.uid)]).then(([s, m]) => {
      setSessions(s);
      setMetrics(m);
    });
  }, [user]);

  async function handleSaveMetric() {
    if (!user || !metricForm.weight) return;
    try {
      const weight = Number(metricForm.weight);
      await saveBodyMetric(user.uid, {
        weight,
        bodyFat: metricForm.bodyFat ? Number(metricForm.bodyFat) : undefined,
        waist: metricForm.waist ? Number(metricForm.waist) : undefined,
        date: new Date(),
      });
      const updated = await getUserMetrics(user.uid);
      setMetrics(updated);
      setShowMetricForm(false);
      setMetricForm({ weight: '', bodyFat: '', waist: '' });
      toast.success('Métrica salva!');
    } catch {
      toast.error('Erro ao salvar');
    }
  }

  // Weekly chart data (last 8 weeks)
  const now = new Date();
  const weeks = eachWeekOfInterval({ start: subDays(now, 56), end: now }).map(weekStart => {
    const weekSessions = sessions.filter(s => isSameWeek(s.startedAt, weekStart));
    return {
      semana: format(weekStart, "'S'w", { locale: ptBR }),
      treinos: weekSessions.length,
      minutos: Math.round(weekSessions.reduce((a, s) => a + (s.durationSeconds ?? 0) / 60, 0)),
    };
  });

  // Weight chart
  const weightData = [...metrics].reverse().map(m => ({
    data: format(m.date, 'dd/MM'),
    peso: m.weight,
    gordura: m.bodyFat,
  }));

  const totalTime = sessions.reduce((a, s) => a + (s.durationSeconds ?? 0), 0);
  const totalCalories = sessions.reduce((a, s) => a + (s.estimatedCalories ?? 0), 0);
  const lastMetric = metrics[0];

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Progresso</h1>
        <button onClick={() => setShowMetricForm(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
          <Plus size={15} /> Registrar métrica
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Treinos', value: sessions.length, icon: Dumbbell, color: 'orange' },
          { label: 'Tempo total', value: formatDuration(totalTime), icon: Clock, color: 'blue' },
          { label: 'Calorias', value: `${totalCalories}`, icon: TrendingUp, color: 'red' },
          { label: 'Peso atual', value: lastMetric?.weight ? `${lastMetric.weight}kg` : '—', icon: Scale, color: 'green' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-${color}-500/10`}>
              <Icon size={16} className={`text-${color}-500`} />
            </div>
            <div className="font-display text-xl font-bold text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Weekly activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <h3 className="font-semibold text-zinc-200 mb-4">Treinos por semana</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeks} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="semana" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#27272a' }} />
              <Bar dataKey="treinos" fill="#f97316" radius={[4, 4, 0, 0]} name="treinos" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Time per week */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <h3 className="font-semibold text-zinc-200 mb-4">Minutos treinados</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeks} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="semana" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#27272a' }} />
              <Bar dataKey="minutos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="min" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Weight chart */}
      {weightData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 mb-5">
          <h3 className="font-semibold text-zinc-200 mb-4">Evolução do peso</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="data" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={35} domain={['auto', 'auto']} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="kg" />
              {weightData.some(d => d.gordura) && (
                <Line type="monotone" dataKey="gordura" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="%" strokeDasharray="5 5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent sessions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
        <h3 className="font-semibold text-zinc-200 mb-4">Histórico de treinos</h3>
        {sessions.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">Nenhum treino registrado ainda</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-zinc-800/40 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={15} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200">Treino</div>
                  <div className="text-xs text-zinc-500">
                    {format(s.startedAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{formatMinutes(Math.round((s.durationSeconds ?? 0) / 60))}</span>
                  <span className="text-orange-500 font-semibold">+{s.xpEarned ?? 0} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Metric form modal */}
      {showMetricForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6"
          >
            <h3 className="font-semibold text-zinc-100 mb-4">Registrar medidas</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="label">Peso (kg) *</label>
                <input type="number" step="0.1" value={metricForm.weight}
                  onChange={e => setMetricForm(f => ({ ...f, weight: e.target.value }))}
                  className="input" placeholder="70.5" />
              </div>
              <div>
                <label className="label">% Gordura corporal</label>
                <input type="number" step="0.1" value={metricForm.bodyFat}
                  onChange={e => setMetricForm(f => ({ ...f, bodyFat: e.target.value }))}
                  className="input" placeholder="15" />
              </div>
              <div>
                <label className="label">Cintura (cm)</label>
                <input type="number" step="0.5" value={metricForm.waist}
                  onChange={e => setMetricForm(f => ({ ...f, waist: e.target.value }))}
                  className="input" placeholder="80" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMetricForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSaveMetric} className="btn-primary flex-1">Salvar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
