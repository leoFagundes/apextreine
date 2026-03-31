'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, UserPlus, UserCheck, Dumbbell, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { getUserProfile, followUser, unfollowUser } from '@/services/users';
import { UserProfile } from '@/types';
import { cn, getLevelFromXp, LEVEL_NAMES, GOAL_LABELS } from '@/lib/utils';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const isOwnProfile = user?.uid === id;

  useEffect(() => {
    if (!id) return;
    getUserProfile(id as string).then((p) => {
      setProfile(p);
      setFollowing(myProfile?.following?.includes(id as string) ?? false);
    }).finally(() => setLoading(false));
  }, [id, myProfile]);

  async function handleFollow() {
    if (!user || !id) return;
    try {
      if (following) {
        await unfollowUser(user.uid, id as string);
        setFollowing(false);
      } else {
        await followUser(user.uid, id as string);
        setFollowing(true);
      }
      await refreshProfile();
    } catch {
      toast.error('Erro ao seguir usuário');
    }
  }

  if (loading) return (
    <div className="page-container max-w-xl">
      <div className="h-40 shimmer rounded-2xl mb-4" />
    </div>
  );

  if (!profile || (!profile.isPublic && !isOwnProfile)) return (
    <div className="page-container text-center py-20">
      <p className="text-zinc-400">{!profile ? 'Perfil não encontrado' : 'Este perfil é privado'}</p>
      <Link href="/dashboard" className="btn-primary mt-4 inline-flex">Voltar</Link>
    </div>
  );

  const levelInfo = getLevelFromXp(profile.xp);

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-6 transition-colors">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl bg-orange-500/20 overflow-hidden flex items-center justify-center flex-shrink-0">
            {profile.photoURL ? (
              <Image src={profile.photoURL} alt="" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-3xl font-black text-orange-400">{profile.displayName?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-zinc-100">{profile.displayName}</h1>
            {profile.bio && <p className="text-sm text-zinc-400 mt-1">{profile.bio}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Nível {levelInfo.level} — {LEVEL_NAMES[levelInfo.level]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4 text-sm text-zinc-400">
          <div><span className="font-bold text-zinc-200">{profile.following?.length ?? 0}</span> seguindo</div>
          <div><span className="font-bold text-zinc-200">{profile.followers?.length ?? 0}</span> seguidores</div>
          <div><span className="font-bold text-zinc-200">{profile.totalWorkouts ?? 0}</span> treinos</div>
        </div>

        {!isOwnProfile && user && (
          <button onClick={handleFollow} className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
            following ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-orange-500 text-white hover:bg-orange-400'
          )}>
            {following ? <><UserCheck size={16} /> Seguindo</> : <><UserPlus size={16} /> Seguir</>}
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Dumbbell, label: 'Treinos', value: profile.totalWorkouts ?? 0, color: 'text-orange-500' },
          { icon: Flame, label: 'Streak', value: `${profile.streak ?? 0}d`, color: 'text-red-500' },
          { icon: Zap, label: 'XP Total', value: profile.xp ?? 0, color: 'text-yellow-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={18} className={cn('mx-auto mb-2', color)} />
            <div className="font-display text-lg font-bold text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
