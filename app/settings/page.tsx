"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/store/AuthContext";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth } from "@/firebase/config";
import {
  Bell,
  Shield,
  Globe,
  LogOut,
  Trash2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SettingRowProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string | ReactNode;
  desc?: string;
  children?: React.ReactNode;
}
function SettingRow({ icon: Icon, label, desc, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-zinc-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-200">{label}</div>
          {desc && <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-11 h-6 rounded-full transition-colors relative",
        value ? "bg-orange-500" : "bg-zinc-700",
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
          value ? "left-5.5" : "left-0.5",
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, profile, logOut } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    publicProfile: profile?.isPublic ?? true,
    workoutReminders: false,
  });

  async function updateSetting(key: string, value: boolean) {
    if (!user) return;
    setSettings((s) => ({ ...s, [key]: value }));
    if (key === "publicProfile") {
      await updateDoc(doc(db, "users", user.uid), {
        isPublic: value,
        updatedAt: serverTimestamp(),
      });
    }
    toast.success("Configuração salva");
  }

  async function handleLogout() {
    await logOut();
    router.replace("/auth/login");
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        "Tem certeza? Esta ação não pode ser desfeita e todos os seus dados serão apagados.",
      )
    )
      return;
    if (!confirm("Confirma exclusão definitiva da conta?")) return;
    try {
      if (user) {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(auth.currentUser!);
      }
      router.replace("/auth/login");
    } catch {
      toast.error("Erro ao excluir conta. Faça login novamente e tente.");
    }
  }

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-lg">
      <h1 className="section-title mb-6">Configurações</h1>

      <div className="space-y-4">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card px-5"
        >
          <h2 className="font-semibold text-zinc-400 text-xs uppercase tracking-wider pt-4 pb-2">
            Notificações
          </h2>
          <SettingRow
            icon={Bell}
            label="Notificações push"
            desc="Lembretes e conquistas"
          >
            <Toggle
              value={settings.notifications}
              onChange={(v) => updateSetting("notifications", v)}
            />
          </SettingRow>
          <SettingRow
            icon={Zap}
            label="Lembretes de treino"
            desc="Aviso diário para não perder o streak"
          >
            <Toggle
              value={settings.workoutReminders}
              onChange={(v) => updateSetting("workoutReminders", v)}
            />
          </SettingRow>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card px-5"
        >
          <h2 className="font-semibold text-zinc-400 text-xs uppercase tracking-wider pt-4 pb-2">
            Privacidade
          </h2>
          <SettingRow
            icon={Globe}
            label="Perfil público"
            desc="Outros usuários podem ver seu perfil"
          >
            <Toggle
              value={settings.publicProfile}
              onChange={(v) => updateSetting("publicProfile", v)}
            />
          </SettingRow>
          <SettingRow icon={Shield} label="Segurança" desc="Alterar senha">
            <ChevronRight size={16} className="text-zinc-600" />
          </SettingRow>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card px-5"
        >
          <h2 className="font-semibold text-zinc-400 text-xs uppercase tracking-wider pt-4 pb-2">
            Conta
          </h2>
          <button onClick={handleLogout} className="w-full">
            <SettingRow
              icon={LogOut}
              label="Sair da conta"
              desc="Encerrar sessão atual"
            >
              <ChevronRight size={16} className="text-zinc-600" />
            </SettingRow>
          </button>
          <button onClick={handleDeleteAccount} className="w-full text-left">
            <SettingRow
              icon={Trash2}
              label={<span className="text-red-400">Excluir conta</span>}
              desc="Remover permanentemente todos os dados"
            >
              <ChevronRight size={16} className="text-zinc-600" />
            </SettingRow>
          </button>
        </motion.div>

        {/* App info */}
        <div className="text-center pt-2">
          <p className="text-xs text-zinc-600">APEX Workout Tracker v1.0.0</p>
          <p className="text-xs text-zinc-700 mt-0.5">
            Feito com 💪 para atletas
          </p>
        </div>
      </div>
    </div>
  );
}
