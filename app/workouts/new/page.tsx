"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { createWorkout } from "@/services/workouts";
import { getUserExercises } from "@/services/exercises";
import { Exercise, WorkoutExercise, WorkoutSet, DayOfWeek } from "@/types";
import { cn, DAYS_PT } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  type: z.enum([
    "A",
    "B",
    "C",
    "D",
    "full_body",
    "upper_lower",
    "push_pull_legs",
    "custom",
  ]),
  level: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  daysOfWeek: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function WorkoutExerciseItem({
  item,
  exercises,
  index,
  total,
  onRemove,
  onUpdate,
  onMoveUp,
  onMoveDown,
}: {
  item: WorkoutExercise;
  exercises: Exercise[];
  index: number;
  total: number;
  onRemove: () => void;
  onUpdate: (item: WorkoutExercise) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const ex = exercises.find((e) => e.id === item.exerciseId);
  const [expanded, setExpanded] = useState(false);

  function addSet() {
    const lastSet = item.sets[item.sets.length - 1];
    onUpdate({
      ...item,
      sets: [...item.sets, { ...lastSet, id: uuidv4(), completed: false }],
    });
  }
  function removeSet(idx: number) {
    if (item.sets.length <= 1) return;
    onUpdate({ ...item, sets: item.sets.filter((_, i) => i !== idx) });
  }
  function updateSet(idx: number, field: keyof WorkoutSet, val: any) {
    const sets = item.sets.map((s, i) =>
      i === idx ? { ...s, [field]: val } : s,
    );
    onUpdate({ ...item, sets });
  }

  return (
    <div className="card border-zinc-800">
      <div className="flex items-center gap-3 p-4">
        {/* Move buttons */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-zinc-200 text-sm truncate">
            {ex?.name ?? "Exercício"}
          </div>
          <div className="text-xs text-zinc-500">
            {item.sets.length} séries · {item.restSeconds}s descanso
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider w-6">
                  Nº
                </span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex-1">
                  Reps
                </span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex-1">
                  Carga (kg)
                </span>
                <div className="w-7" />
              </div>
              {item.sets.map((set, idx) => (
                <div key={set.id} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 w-6">{idx + 1}</span>
                  <input
                    type="number"
                    value={set.reps ?? ""}
                    onChange={(e) =>
                      updateSet(idx, "reps", Number(e.target.value))
                    }
                    className="input py-1.5 text-sm flex-1"
                    placeholder="12"
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={set.weight ?? ""}
                    onChange={(e) =>
                      updateSet(idx, "weight", Number(e.target.value))
                    }
                    className="input py-1.5 text-sm flex-1"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(idx)}
                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addSet}
                  className="btn-ghost text-xs flex items-center gap-1 py-1.5"
                >
                  <Plus size={12} /> Adicionar série
                </button>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-zinc-500">Descanso:</span>
                  <input
                    type="number"
                    value={item.restSeconds}
                    onChange={(e) =>
                      onUpdate({ ...item, restSeconds: Number(e.target.value) })
                    }
                    className="w-16 input py-1 text-xs"
                  />
                  <span className="text-xs text-zinc-500">seg</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewWorkoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [],
  );
  const [showExSearch, setShowExSearch] = useState(false);
  const [exSearch, setExSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "A",
      level: "beginner",
      daysOfWeek: [],
      isPublic: false,
    },
  });

  useEffect(() => {
    if (user) getUserExercises(user.uid).then(setAllExercises);
  }, [user]);

  function addExercise(ex: Exercise) {
    const defaultSets: WorkoutSet[] = Array.from(
      { length: ex.defaultSets ?? 3 },
      () => ({
        id: uuidv4(),
        reps: ex.defaultReps ?? 12,
        weight: ex.defaultWeight ?? 0,
        completed: false,
      }),
    );
    setWorkoutExercises((prev) => [
      ...prev,
      {
        id: uuidv4(),
        exerciseId: ex.id,
        exercise: ex,
        order: prev.length,
        sets: defaultSets,
        restSeconds: ex.defaultRestSeconds ?? 60,
      },
    ]);
    setShowExSearch(false);
    setExSearch("");
  }

  function removeExercise(id: string) {
    setWorkoutExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExercise(id: string, updated: WorkoutExercise) {
    setWorkoutExercises((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  function moveExercise(index: number, direction: "up" | "down") {
    const newList = [...workoutExercises];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newList.length) return;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
    setWorkoutExercises(newList);
  }

  async function onSubmit(data: FormData) {
    if (!user) return;
    if (workoutExercises.length === 0) {
      toast.error("Adicione ao menos um exercício");
      return;
    }
    try {
      const totalMinutes = workoutExercises.reduce((acc, we) => {
        const setsTime = we.sets.length * 0.75;
        const rest = (we.sets.length - 1) * (we.restSeconds / 60);
        return acc + setsTime + rest;
      }, 0);

      await createWorkout(user.uid, {
        ...data,
        daysOfWeek: data.daysOfWeek as DayOfWeek[],
        exercises: workoutExercises.map((e, i) => ({ ...e, order: i })),
        estimatedDuration: Math.round(totalMinutes),
        isTemplate: false,
        tags: [],
      });
      toast.success("Treino criado! 🔥");
      router.push("/workouts");
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro: ${err?.message ?? "Falha ao salvar treino"}`);
    }
  }

  const filteredEx = allExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
      (e.muscleGroup ?? "").toLowerCase().includes(exSearch.toLowerCase()),
  );

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/workouts"
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="section-title">Nova ficha de treino</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-zinc-200 text-sm uppercase tracking-wider">
            Informações
          </h2>
          <div>
            <label className="label">Nome do treino *</label>
            <input
              {...register("name")}
              placeholder="Ex: Treino A — Peito e Tríceps"
              className="input"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Objetivo, observações..."
              className="input resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select {...register("type")} className="input">
                {[
                  ["A", "Treino A"],
                  ["B", "Treino B"],
                  ["C", "Treino C"],
                  ["D", "Treino D"],
                  ["full_body", "Full Body"],
                  ["upper_lower", "Upper/Lower"],
                  ["push_pull_legs", "PPL"],
                  ["custom", "Personalizado"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nível</label>
              <select {...register("level")} className="input">
                {[
                  ["beginner", "Iniciante"],
                  ["intermediate", "Intermediário"],
                  ["advanced", "Avançado"],
                  ["elite", "Elite"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="card p-5">
          <label className="label mb-3">Dias da semana</label>
          <Controller
            name="daysOfWeek"
            control={control}
            render={({ field }) => (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {DAYS.map((day) => {
                  const active = field.value?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const curr = field.value ?? [];
                        field.onChange(
                          active
                            ? curr.filter((d) => d !== day)
                            : [...curr, day],
                        );
                      }}
                      className={cn(
                        "flex-shrink-0 w-9 h-9 rounded-xl text-xs font-semibold transition-all",
                        active
                          ? "bg-orange-500 text-white"
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700",
                      )}
                    >
                      {DAYS_PT[day]}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-200">
              Exercícios ({workoutExercises.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowExSearch(true)}
              className="btn-primary text-sm py-2 flex items-center gap-1.5"
            >
              <Plus size={15} /> Adicionar
            </button>
          </div>

          {workoutExercises.length === 0 ? (
            <div className="card p-8 text-center border-dashed">
              <p className="text-zinc-500 text-sm">
                Nenhum exercício adicionado
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                Clique em "Adicionar" para incluir exercícios
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workoutExercises.map((item, index) => (
                <WorkoutExerciseItem
                  key={item.id}
                  item={item}
                  exercises={allExercises}
                  index={index}
                  total={workoutExercises.length}
                  onRemove={() => removeExercise(item.id)}
                  onUpdate={(updated) => updateExercise(item.id, updated)}
                  onMoveUp={() => moveExercise(index, "up")}
                  onMoveDown={() => moveExercise(index, "down")}
                />
              ))}
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="card p-4">
          <Controller
            name="isPublic"
            control={control}
            render={({ field }) => (
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    Tornar público
                  </div>
                  <div className="text-xs text-zinc-500">
                    Outros usuários poderão copiar este treino
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    field.value ? "bg-orange-500" : "bg-zinc-700",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                      field.value ? "left-5" : "left-0.5",
                    )}
                  />
                </button>
              </label>
            )}
          />
        </div>

        <div className="flex gap-3 pb-6">
          <Link href="/workouts" className="btn-secondary flex-1 text-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} />
                Salvar treino
              </>
            )}
          </button>
        </div>
      </form>

      {/* Exercise Search Modal */}
      <AnimatePresence>
        {showExSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setShowExSearch(false)
            }
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                <Search size={16} className="text-zinc-500" />
                <input
                  autoFocus
                  value={exSearch}
                  onChange={(e) => setExSearch(e.target.value)}
                  placeholder="Buscar exercícios..."
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />
                <button
                  onClick={() => setShowExSearch(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {filteredEx.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    Nenhum exercício encontrado
                    <br />
                    <Link
                      href="/exercises/new"
                      className="text-orange-500 text-xs mt-1 inline-block"
                    >
                      Criar novo exercício
                    </Link>
                  </div>
                ) : (
                  filteredEx.map((ex) => {
                    const alreadyAdded = workoutExercises.some(
                      (w) => w.exerciseId === ex.id,
                    );
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => !alreadyAdded && addExercise(ex)}
                        disabled={alreadyAdded}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                          alreadyAdded
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-zinc-800",
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-400 text-xs font-bold">
                            {ex.name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">
                            {ex.name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {ex.category} · {ex.muscleGroup}
                          </div>
                        </div>
                        {alreadyAdded && (
                          <span className="ml-auto text-xs text-zinc-600">
                            adicionado
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
