'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy } from 'lucide-react';
import { LEVEL_NAMES } from '@/lib/utils';

interface XpGainProps {
  xp: number;
  show: boolean;
}

export function XpGain({ xp, show }: XpGainProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -10, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3"
        >
          <Zap size={18} className="text-yellow-500" />
          <span className="font-display font-bold text-yellow-400">+{xp} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LevelUpProps {
  level: number;
  show: boolean;
  onClose: () => void;
}

export function LevelUpModal({ level, show, onClose }: LevelUpProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-8xl mb-6"
            >
              🏆
            </motion.div>
            <div className="font-display text-4xl font-extrabold text-yellow-400 mb-2">
              NÍVEL {level}!
            </div>
            <div className="text-2xl font-bold text-zinc-200 mb-1">{LEVEL_NAMES[level]}</div>
            <p className="text-zinc-400 mb-8">Você evoluiu! Continue assim! 💪</p>
            <button onClick={onClose} className="btn-primary px-8">
              Continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface WorkoutCompleteBannerProps {
  xpEarned: number;
  calories: number;
  duration: number;
  show: boolean;
}

export function WorkoutCompleteBanner({ xpEarned, calories, duration, show }: WorkoutCompleteBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-orange-600 to-orange-500 p-4 safe-area-inset-top"
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-white" />
              <span className="font-display font-bold text-white">Treino concluído!</span>
            </div>
            <div className="flex gap-4 text-sm text-orange-100">
              <span>+{xpEarned} XP</span>
              <span>{calories} kcal</span>
              <span>{Math.round(duration / 60)}min</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
