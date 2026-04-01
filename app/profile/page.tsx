'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import { getUserSessions } from '@/services/sessions';
import { WorkoutSession } from '@/types';
import { motion } from 'framer-motion';
import { Camera, Edit, Flame, Zap, Dumbbell, Clock, Trophy, Star, Save, X } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '@/firebase/config';
import { formatMinutes, getLevelFromXp, LEVEL_NAMES, GOAL_LABELS, calcBMI, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';

const BADGES = [
  { id: 'first_workout', name: 'Primeiro Treino', icon: '🏋️', rarity: 'common', desc: 'Complete seu primeiro treino' },
  { id: 'week_streak', name: 'Semana Perfeita', icon: '🔥', rarity: 'rare', desc: '7 dias consecutivos' },
  { id: 'centurion', name: 'Centurião', icon: '💯', rarity: 'epic', desc: '100 treinos concluídos' },
  { id: 'iron_will', name: 'Vontade de Ferro', icon: '⚡', rarity: 'legendary', desc: '30 dias seguidos' },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'border-zinc-600 bg-zinc-800/50',
  rare: 'border-blue-500/50 bg-blue-500/5',
  epic: 'border-purple-500/50 bg-purple-500/5',
  legendary: 'border-yellow-500/50 bg-yellow-500/5',
};

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: '', bio: '', age: '', height: '', weight: '',
    goal: '', level: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getUserSessions(user.uid, 10).then(setSessions);
  }, [user]);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? '',
        bio: profile.bio ?? '',
        age: profile.age?.toString() ?? '',
        height: profile.height?.toString() ?? '',
        weight: profile.weight?.toString() ?? '',
        goal: profile.goal ?? '',
        level: profile.level ?? '',
      });
    }
  }, [profile]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser!, { photoURL: url });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url, updatedAt: serverTimestamp() });
      await refreshProfile();
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao atualizar foto');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName,
        bio: form.bio,
        age: form.age ? Number(form.age) : null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        goal: form.goal || null,
        level: form.level || null,
        updatedAt: serverTimestamp(),
      });
      await updateProfile(auth.currentUser!, { displayName: form.displayName });
      await refreshProfile();
      setEditing(false);
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;
  const levelInfo = getLevelFromXp(profile.xp);
  const bmi = profile.weight && profile.height ? calcBMI(profile.weight, profile.height) : null;
  const earnedBadges = new Set(profile.badges?.map(b => b.id) ?? []);

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Meu Perfil</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
            <Edit size={14} /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-ghost text-sm py-2"><X size={14} /></button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-1.5">
              <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      {/* Avatar + name */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center overflow-hidden">
              {profile.photoURL ? (
                <Image src={profile.photoURL} alt="" width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-black text-orange-400">{profile.displayName?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg hover:bg-orange-400 transition-colors"
            >
              {uploading ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={13} className="text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="input text-lg font-bold mb-2" placeholder="Seu nome" />
            ) : (
              <h2 className="font-display text-xl font-bold text-zinc-100 mb-0.5">{profile.displayName}</h2>
            )}
            <div className="text-sm text-zinc-500">{profile.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Nível {levelInfo.level} — {LEVEL_NAMES[levelInfo.level]}
              </span>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span className="flex items-center gap-1"><Zap size={11} className="text-yellow-500" />{profile.xp} XP</span>
            <span>{levelInfo.nextXp} XP para nível {levelInfo.level + 1}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ delay: 0.3, duration: 1 }}
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          {editing ? (
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="input resize-none text-sm" rows={2} placeholder="Escreva algo sobre você..." />
          ) : (
            profile.bio ? <p className="text-sm text-zinc-400">{profile.bio}</p> :
              <p className="text-sm text-zinc-600 italic">Sem bio ainda</p>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Dumbbell, label: 'Treinos', value: profile.totalWorkouts ?? 0, color: 'text-orange-500' },
          { icon: Flame, label: 'Streak', value: `${profile.streak}d`, color: 'text-red-500' },
          { icon: Clock, label: 'Horas', value: formatMinutes(profile.totalMinutes ?? 0), color: 'text-blue-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={18} className={cn('mx-auto mb-2', color)} />
            <div className="font-display text-lg font-bold text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Body metrics */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 mb-5">
        <h3 className="font-semibold text-zinc-200 mb-4 text-sm uppercase tracking-wider">Métricas corporais</h3>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'age', label: 'Idade', placeholder: '25', unit: 'anos' },
              { key: 'height', label: 'Altura', placeholder: '175', unit: 'cm' },
              { key: 'weight', label: 'Peso', placeholder: '70', unit: 'kg' },
            ].map(({ key, label, placeholder, unit }) => (
              <div key={key}>
                <label className="label">{label} ({unit})</label>
                <input type="number" value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input" placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="label">Objetivo</label>
              <select value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} className="input">
                <option value="">Selecionar</option>
                {Object.entries(GOAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Idade', value: profile.age ? `${profile.age} anos` : '—' },
              { label: 'Altura', value: profile.height ? `${profile.height} cm` : '—' },
              { label: 'Peso', value: profile.weight ? `${profile.weight} kg` : '—' },
              { label: 'IMC', value: bmi ?? '—' },
              { label: 'Objetivo', value: profile.goal ? GOAL_LABELS[profile.goal] : '—' },
              { label: 'Nível', value: profile.level ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
                <span className="text-sm text-zinc-500">{label}</span>
                <span className="text-sm font-medium text-zinc-200">{value}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
        <h3 className="font-semibold text-zinc-200 mb-4 text-sm uppercase tracking-wider">Conquistas</h3>
        <div className="grid grid-cols-2 gap-3">
          {BADGES.map(badge => {
            const earned = earnedBadges.has(badge.id);
            return (
              <div key={badge.id} className={cn(
                'rounded-xl p-3 border transition-all',
                earned ? RARITY_COLORS[badge.rarity] : 'border-zinc-800 bg-zinc-800/20 opacity-40'
              )}>
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="text-xs font-semibold text-zinc-200">{badge.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{badge.desc}</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
