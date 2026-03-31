"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Upload,
  Filter,
  Dumbbell,
  ChevronRight,
  Trash2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { getUserExercises, deleteExercise } from "@/services/exercises";
import { Exercise, ExerciseCategory } from "@/types";
import { cn, EXERCISE_CATEGORIES } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORY_COLORS: Record<string, string> = {
  musculação: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  corrida: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cardio: "bg-red-500/10 text-red-400 border-red-500/20",
  yoga: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  hiit: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  default: "bg-zinc-700/50 text-zinc-400 border-zinc-700",
};

function ExerciseCard({
  exercise,
  onDelete,
}: {
  exercise: Exercise;
  onDelete: (id: string) => void;
}) {
  const color = CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.default;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="card-hover p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-100 truncate">
            {exercise.name}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            {exercise.muscleGroup}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/exercises/${exercise.id}/edit`}
            className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <Edit size={13} />
          </Link>
          <button
            onClick={() => onDelete(exercise.id)}
            className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("badge border", color)}>{exercise.category}</span>
        {exercise.level && (
          <span className="badge bg-zinc-800 text-zinc-500 border border-zinc-700">
            {exercise.level}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        {exercise.defaultSets && <span>{exercise.defaultSets} séries</span>}
        {exercise.defaultReps && <span>{exercise.defaultReps} reps</span>}
        {exercise.defaultWeight && <span>{exercise.defaultWeight}kg</span>}
        {exercise.defaultRestSeconds && (
          <span>{exercise.defaultRestSeconds}s descanso</span>
        )}
      </div>

      {exercise.tags && exercise.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {exercise.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-zinc-600 bg-zinc-800/50 rounded-md px-1.5 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    getUserExercises(user.uid).then((e) => {
      setExercises(e);
      setLoading(false);
    });
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm("Deletar exercício?")) return;
    await deleteExercise(id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
    toast.success("Exercício removido");
  }

  const filtered = exercises.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || e.category === filterCat;
    return matchSearch && matchCat;
  });

  const categories = [
    "all",
    ...Array.from(new Set(exercises.map((e) => e.category))),
  ];

  return (
    <div className="page-container pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Exercícios</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {exercises.length} cadastrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/exercises/import"
            className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3 sm:px-6"
          >
            <Upload size={15} />{" "}
            <span className="hidden sm:inline">Importar</span>
          </Link>
          <Link
            href="/exercises/new"
            className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3 sm:px-6"
          >
            <Plus size={15} /> <span className="hidden sm:inline">Novo</span>
          </Link>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex-1">
          <Search size={16} className="text-zinc-500 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercícios..."
            className="bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none flex-1"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={cn(
                "text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0",
                filterCat === cat
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
              )}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={28} className="text-zinc-600" />
          </div>
          <h3 className="font-semibold text-zinc-300 mb-1">
            {search || filterCat !== "all"
              ? "Nenhum resultado"
              : "Sem exercícios ainda"}
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            {search || filterCat !== "all"
              ? "Tente outros filtros"
              : "Cadastre seu primeiro exercício"}
          </p>
          {!search && filterCat === "all" && (
            <Link
              href="/exercises/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> Criar exercício
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {filtered.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
