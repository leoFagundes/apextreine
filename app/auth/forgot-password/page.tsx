'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

const schema = z.object({ email: z.string().email('Email inválido') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch {
      toast.error('Erro ao enviar email de recuperação');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/auth/login" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors mb-8">
          <ArrowLeft size={16} /> Voltar
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="text-orange-500" size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-zinc-100 mb-2">Email enviado!</h2>
            <p className="text-zinc-400 mb-6">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
            <Link href="/auth/login" className="btn-primary inline-flex">Voltar ao login</Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold text-zinc-100 mb-2">Recuperar senha</h2>
            <p className="text-zinc-400 mb-8">Digite seu email para receber o link de recuperação</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" placeholder="seu@email.com" className="input" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
