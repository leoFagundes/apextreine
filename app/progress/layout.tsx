"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Dumbbell,
  ListChecks,
  BarChart3,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Zap,
  Flame,
  Search,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { cn, getLevelFromXp, LEVEL_NAMES } from "@/lib/utils";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exercises", label: "Exercícios", icon: Dumbbell },
  { href: "/workouts", label: "Treinos", icon: ListChecks },
  { href: "/progress", label: "Progresso", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: User },
];

// Full-page skeleton shown while Firebase restores the session
function AppSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="font-display font-black text-white text-sm">
              A
            </span>
          </div>
          <span className="font-display font-bold text-zinc-100">APEX</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon }) => (
            <div
              key={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            >
              <Icon size={18} className="text-zinc-700" />
              <div className="h-3 w-20 bg-zinc-800 rounded shimmer" />
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800">
          <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-700 shimmer" />
              <div className="space-y-1">
                <div className="h-3 w-24 bg-zinc-700 rounded shimmer" />
                <div className="h-2 w-16 bg-zinc-800 rounded shimmer" />
              </div>
            </div>
            <div className="h-1 bg-zinc-700 rounded-full shimmer" />
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="h-14 border-b border-zinc-800/50 px-4 flex items-center gap-4">
          <div className="h-8 w-8 bg-zinc-800 rounded-xl shimmer lg:hidden" />
          <div className="hidden md:block h-8 flex-1 max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shimmer" />
          <div className="ml-auto flex gap-2">
            <div className="h-8 w-16 bg-zinc-900 border border-zinc-800 rounded-lg shimmer" />
            <div className="h-8 w-12 bg-zinc-900 border border-zinc-800 rounded-lg shimmer" />
          </div>
        </header>
        <main className="flex-1 p-6 space-y-4">
          <div className="h-8 w-48 bg-zinc-800 rounded-xl shimmer" />
          <div className="h-28 bg-zinc-900 border border-zinc-800 rounded-2xl shimmer" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-zinc-900 border border-zinc-800 rounded-2xl shimmer"
              />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="h-48 bg-zinc-900 border border-zinc-800 rounded-2xl shimmer" />
            <div className="h-48 bg-zinc-900 border border-zinc-800 rounded-2xl shimmer" />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav skeleton */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-zinc-900/95 border-t border-zinc-800" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extra grace period — give Firebase time to restore session from localStorage
  // before deciding the user is logged out
  const [grace, setGrace] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setGrace(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // Redirect only after both loading AND grace period are done
  useEffect(() => {
    if (!loading && !grace && !user) {
      router.replace("/auth/login");
    }
  }, [loading, grace, user, router]);

  // Show skeleton while loading OR during grace period (no flash / black screen)
  if (loading || grace || !user) return <AppSkeleton />;

  const levelInfo = getLevelFromXp(profile?.xp ?? 0);

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-white text-sm">
              A
            </span>
          </div>
          <span className="font-display font-bold text-zinc-100">APEX</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
                )}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        {profile && (
          <div className="p-3 border-t border-zinc-800">
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-400 text-sm font-bold">
                      {profile.displayName?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 truncate">
                    {profile.displayName}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Nível {levelInfo.level} · {LEVEL_NAMES[levelInfo.level]}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-orange-500 flex-shrink-0" />
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">{profile.xp} XP</span>
              </div>
            </div>
            <button
              onClick={() => {
                logOut();
                router.replace("/auth/login");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl text-sm transition-all"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                    <span className="font-display font-black text-white text-sm">
                      A
                    </span>
                  </div>
                  <span className="font-display font-bold text-zinc-100">
                    APEX
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href ||
                    (href !== "/dashboard" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
                      )}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    logOut();
                    router.replace("/auth/login");
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-zinc-500 hover:text-zinc-300 rounded-xl text-sm"
                >
                  <LogOut size={15} /> Sair da conta
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-zinc-100 p-1"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex-1 max-w-sm">
            <Search size={16} className="text-zinc-500" />
            <input
              placeholder="Buscar exercícios, treinos..."
              className="bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none flex-1"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {profile && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-zinc-300 font-semibold">
                    {profile.streak}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                  <Zap size={14} className="text-yellow-500" />
                  <span className="text-zinc-300 font-semibold">
                    {profile.xp}
                  </span>
                </div>
              </div>
            )}
            <Link
              href="/settings"
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 z-20 flex items-center justify-around px-2 pt-2 bottom-nav-safe">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  active ? "text-orange-500" : "text-zinc-500",
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
