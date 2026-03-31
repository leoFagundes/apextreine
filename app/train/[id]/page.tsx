'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, CheckCircle, X, Flame,
  Clock, ChevronRight, Trophy, Volume2, VolumeX, Youtube
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useTrainStore } from '@/store/trainStore';
import { getWorkoutById } from '@/services/workouts';
import { getUserExercises } from '@/services/exercises';
import { saveSession } from '@/services/sessions';
import { Workout } from '@/types';
import { cn, formatDuration, getVideoEmbedUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

function RestTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const progress = total > 0 ? (timeLeft / total) * 100 : 0;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#27272a" strokeWidth="8" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f97316" strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-zinc-100">{timeLeft}</span>
          <span className="text-xs text-zinc-500">seg</span>
        </div>
      </div>
      <p className="text-zinc-400 font-medium">Descansando...</p>
    </div>
  );
}

export default function TrainPage() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const {
    session, currentExerciseIndex, currentSetIndex,
    isResting, restTimeLeft, isRunning, elapsedSeconds, isComplete,
    startSession, completeSet, skipExercise, togglePause,
    tickClock, tickRest, finishSession, resetSession,
  } = useTrainStore();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [finalSession, setFinalSession] = useState<any>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const restAudioRef = useRef<HTMLAudioElement | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      try {
        const w = await getWorkoutById(id as string);
        if (!w) { router.push('/workouts'); return; }
        // Hydrate exercises
        const exercises = await getUserExercises(user.uid);
        const exMap = new Map(exercises.map(e => [e.id, e]));
        w.exercises = w.exercises.map(we => ({ ...we, exercise: exMap.get(we.exerciseId) }));
        setWorkout(w);
        startSession(w, user.uid);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  // Clock tick
  useEffect(() => {
    if (!isRunning || done) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      tickClock();
      if (isResting) tickRest();
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isResting, done]);

  // Check if session complete (only when all exercises are done, not on pause)
  useEffect(() => {
    if (!isComplete || done || savingRef.current) return;
    savingRef.current = true;
    handleFinish();
  }, [isComplete]);

  async function handleFinish() {
    const finished = finishSession();
    if (!finished || !user) return;
    try {
      await saveSession(user.uid, { ...finished, workout: undefined as any });
      await refreshProfile();
    } catch {}
    setFinalSession(finished);
    setDone(true);
  }

  function handleCompleteSet() {
    completeSet();
  }

  if (loading) return (
    <div className="train-fullscreen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 animate-pulse flex items-center justify-center">
          <Flame size={24} className="text-white" />
        </div>
        <p className="text-zinc-400 text-sm">Preparando treino...</p>
      </div>
    </div>
  );

  if (!workout || !session) return null;

  // Done screen
  if (done && finalSession) return (
    <div className="train-fullscreen flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-orange-500/10 border-2 border-orange-500 flex items-center justify-center mx-auto mb-6"
        >
          <Trophy size={40} className="text-orange-500" />
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold text-zinc-100 mb-2">Treino concluído!</h1>
        <p className="text-zinc-400 mb-8">Excelente trabalho! Continue assim! 💪</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            ['⏱', formatDuration(finalSession.durationSeconds ?? 0), 'Duração'],
            ['🔥', `${finalSession.estimatedCalories ?? 0}`, 'Calorias'],
            ['⚡', `+${finalSession.xpEarned ?? 0}`, 'XP ganho'],
          ].map(([icon, val, label]) => (
            <div key={label} className="card p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="font-display text-lg font-bold text-zinc-100">{val}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/progress" className="btn-secondary flex-1 text-center">Ver progresso</Link>
          <Link href="/workouts" onClick={resetSession} className="btn-primary flex-1 text-center">Voltar</Link>
        </div>
      </motion.div>
    </div>
  );

  const currentWE = workout.exercises[currentExerciseIndex];
  const nextWE = workout.exercises[currentExerciseIndex + 1];
  const currentEx = currentWE?.exercise;
  const currentSet = currentWE?.sets[currentSetIndex];
  const progress = ((currentExerciseIndex * 100 + (currentSetIndex / (currentWE?.sets.length || 1)) * 100) / workout.exercises.length);

  return (
    <div className="train-fullscreen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-4">
        <button
          onClick={() => {
            if (confirm('Finalizar treino?')) { handleFinish(); }
          }}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg px-3 py-1.5">
            <Clock size={13} className="text-orange-500" />
            <span className="font-mono text-sm text-zinc-300">{formatDuration(elapsedSeconds)}</span>
          </div>
          <button onClick={() => setSoundOn(!soundOn)} className="p-2 text-zinc-500 hover:text-zinc-300">
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
        <button
          onClick={togglePause}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
          <span>Exercício {currentExerciseIndex + 1} de {workout.exercises.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Rest screen */}
      <AnimatePresence>
        {isResting ? (
          <motion.div
            key="rest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center px-4"
          >
            <RestTimer timeLeft={restTimeLeft} total={currentWE?.restSeconds ?? 60} />
            <button
              onClick={() => useTrainStore.getState().tickRest && (() => { /* force skip rest */ useTrainStore.setState({ isResting: false, restTimeLeft: 0 }); })()}
              className="btn-secondary mt-4"
            >
              Pular descanso
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="exercise"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col flex-1 px-4"
          >
            {/* Exercise name */}
            <div className="text-center mb-6">
              <motion.h1
                key={currentEx?.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-3xl font-extrabold text-zinc-100 mb-1"
              >
                {currentEx?.name ?? 'Exercício'}
              </motion.h1>
              <p className="text-zinc-500 text-sm">{currentEx?.muscleGroup}</p>
            </div>

            {/* Set info */}
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              {currentWE?.sets.map((set, idx) => (
                <div
                  key={set.id}
                  className={cn(
                    'w-10 h-10 rounded-xl font-semibold text-sm flex items-center justify-center border-2 transition-all',
                    idx < currentSetIndex ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                    idx === currentSetIndex ? 'bg-orange-500 border-orange-500 text-white scale-110' :
                    'bg-zinc-800 border-zinc-700 text-zinc-500'
                  )}
                >
                  {idx < currentSetIndex ? '✓' : idx + 1}
                </div>
              ))}
            </div>

            {/* Current set details */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto w-full">
              <div className="card p-4 text-center">
                <div className="font-display text-4xl font-extrabold text-orange-500">{currentSet?.reps ?? '—'}</div>
                <div className="text-xs text-zinc-500 mt-1">Repetições</div>
              </div>
              <div className="card p-4 text-center">
                <div className="font-display text-4xl font-extrabold text-zinc-100">{currentSet?.weight ?? 0}</div>
                <div className="text-xs text-zinc-500 mt-1">kg</div>
              </div>
            </div>

            {/* Série info */}
            <div className="text-center text-zinc-400 text-sm mb-8">
              Série <span className="font-bold text-zinc-200">{currentSetIndex + 1}</span> de <span className="font-bold text-zinc-200">{currentWE?.sets.length}</span>
              {currentWE?.restSeconds && <span className="text-zinc-600"> · {currentWE.restSeconds}s descanso</span>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 max-w-xs mx-auto w-full mb-6">
              <button
                onClick={skipExercise}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <SkipForward size={16} /> Pular
              </button>
              <button
                onClick={handleCompleteSet}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
              >
                <CheckCircle size={20} />
                Concluir série
              </button>
            </div>

            {/* Next exercise */}
            {nextWE && (
              <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 max-w-xs mx-auto w-full">
                <div className="text-xs text-zinc-500 flex-shrink-0">Próximo:</div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate">{nextWE.exercise?.name ?? 'Exercício'}</span>
                </div>
              </div>
            )}

            {/* Instructions + Video */}
            <div className="max-w-xs mx-auto w-full mt-4 space-y-2">
              {currentEx?.description && (
                <details className="group">
                  <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
                    Ver instruções ▾
                  </summary>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{currentEx.description}</p>
                </details>
              )}
              {getVideoEmbedUrl(currentEx?.videoUrl, currentEx?.embedCode) && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Youtube size={14} /> Ver como fazer (vídeo)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video modal */}
      <AnimatePresence>
        {showVideo && (() => {
          const embedUrl = getVideoEmbedUrl(currentEx?.videoUrl, currentEx?.embedCode);
          if (!embedUrl) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
              onClick={() => setShowVideo(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-zinc-900 rounded-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-100 truncate">{currentEx?.name}</span>
                  <button onClick={() => setShowVideo(false)} className="text-zinc-400 hover:text-zinc-100 ml-3 flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
