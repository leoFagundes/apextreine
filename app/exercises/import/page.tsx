"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileJson,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useAuth } from "@/store/AuthContext";
import { importExercises, getUserExercises } from "@/services/exercises";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const ExerciseImportSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  muscleGroup: z.string().optional(),
  type: z
    .enum([
      "strength",
      "cardio",
      "flexibility",
      "balance",
      "plyometric",
      "functional",
    ])
    .optional()
    .default("strength"),
  level: z
    .enum(["beginner", "intermediate", "advanced", "elite"])
    .optional()
    .default("beginner"),
  sets: z.number().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  restSeconds: z.number().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
});
type ImportItem = z.infer<typeof ExerciseImportSchema>;

interface ParseResult {
  valid: ImportItem[];
  errors: { index: number; name: string; issues: string[] }[];
  duplicates: string[];
}

export default function ImportExercisesPage() {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importedCount, setImportedCount] = useState(0);

  async function parseFile(file: File) {
    // Step 1: parse JSON — isolated so we can show a clear error
    let arr: Record<string, unknown>[] = [];
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      arr = Array.isArray(json) ? (json as Record<string, unknown>[]) : [json as Record<string, unknown>];
    } catch {
      toast.error("Arquivo JSON inválido — verifique a sintaxe do arquivo");
      return;
    }

    // Step 2: fetch existing exercises (non-fatal)
    let existingNames = new Set<string>();
    try {
      const existing = user ? await getUserExercises(user.uid) : [];
      existingNames = new Set(existing.map(e => e.name.toLowerCase()));
    } catch (e) {
      console.warn("Could not fetch existing exercises:", e);
    }

    // Step 3: validate with Zod
    const valid: ImportItem[] = [];
    const errors: ParseResult["errors"] = [];
    const duplicates: string[] = [];

    arr.forEach((item, index: number) => {
      const result = ExerciseImportSchema.safeParse({
        name: item.name,
        category: item.category,
        muscleGroup: item.muscleGroup ?? item.muscle_group ?? "",
        type: item.type,
        level: item.level,
        sets: item.sets ?? item.defaultSets,
        reps: item.reps ?? item.defaultReps,
        weight: item.weight ?? item.defaultWeight,
        restSeconds: item.restSeconds ?? item.rest,
        description: item.description,
        tags: Array.isArray(item.tags) ? item.tags : [],
        isPublic: item.isPublic ?? false,
      });

      if (result.success) {
        if (existingNames.has(result.data.name.toLowerCase())) {
          duplicates.push(result.data.name);
        }
        valid.push(result.data);
      } else {
        errors.push({
          index,
          name: typeof item.name === 'string' ? item.name : `Item ${index + 1}`,
          issues: result.error.issues.map(i => i.message),
        });
      }
    });

    setParseResult({ valid, errors, duplicates });
    setStep("preview");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".json")) parseFile(file);
    else toast.error("Apenas arquivos .json são aceitos");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  async function handleImport() {
    if (!user || !parseResult) return;
    setImporting(true);
    try {
      const toImport = parseResult.valid.map((item) => {
        const ex: Record<string, unknown> = {
          name: item.name,
          category: item.category,
          muscleGroup: item.muscleGroup ?? "",
          type: item.type ?? "strength",
          level: item.level ?? "beginner",
          description: item.description ?? "",
          notes: "",
          tags: item.tags ?? [],
          isPublic: item.isPublic ?? false,
          secondaryMuscles: [],
          equipment: [],
          videoUrl: "",
          imageUrl: "",
        };
        // Only add optional numeric fields if they have a real value
        if (item.sets != null) ex.defaultSets = item.sets;
        if (item.reps != null) ex.defaultReps = item.reps;
        if (item.weight != null) ex.defaultWeight = item.weight;
        if (item.restSeconds != null) ex.defaultRestSeconds = item.restSeconds;
        return ex;
      });
      const count = await importExercises(user.uid, toImport as Parameters<typeof importExercises>[1], mode);
      setImportedCount(count);
      setStep("done");
    } catch (err: unknown) {
      console.error("Import error:", err);
      toast.error(`Erro: ${err instanceof Error ? err.message : "Falha ao salvar no Firebase"}`);
    } finally {
      setImporting(false);
    }
  }

  const exampleJson = JSON.stringify(
    [
      {
        name: "Supino reto",
        category: "musculação",
        muscleGroup: "peito",
        sets: 4,
        reps: 12,
      },
      {
        name: "Agachamento livre",
        category: "musculação",
        muscleGroup: "quadríceps",
        sets: 4,
        reps: 10,
        weight: 80,
      },
      {
        name: "Corrida 5km",
        category: "corrida",
        muscleGroup: "full body",
        type: "cardio",
      },
    ],
    null,
    2,
  );

  return (
    <div className="page-container pb-24 lg:pb-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/exercises"
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="section-title">Importar exercícios</h1>
      </div>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 mb-6",
                dragging
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-zinc-700 hover:border-zinc-600",
              )}
            >
              <FileJson
                size={40}
                className={cn(
                  "mx-auto mb-4",
                  dragging ? "text-orange-500" : "text-zinc-600",
                )}
              />
              <h3 className="font-semibold text-zinc-300 mb-1">
                Arraste seu arquivo JSON
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                ou clique para selecionar
              </p>
              <label className="btn-primary cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileInput}
                />
                Selecionar arquivo
              </label>
            </div>

            {/* Example */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-200 text-sm">
                  Estrutura esperada
                </h3>
                <button
                  onClick={() => {
                    const blob = new Blob([exampleJson], {
                      type: "application/json",
                    });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "exemplo-exercicios.json";
                    a.click();
                  }}
                  className="btn-ghost text-xs flex items-center gap-1.5 py-1.5"
                >
                  <Download size={13} /> Baixar exemplo
                </button>
              </div>
              <pre className="text-xs text-zinc-400 bg-zinc-950 rounded-xl p-4 overflow-x-auto">
                {exampleJson}
              </pre>
            </div>
          </motion.div>
        )}

        {step === "preview" && parseResult && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="card p-4 text-center">
                <div className="font-display text-2xl font-bold text-green-400">
                  {parseResult.valid.length}
                </div>
                <div className="text-xs text-zinc-500">Válidos</div>
              </div>
              <div className="card p-4 text-center">
                <div className="font-display text-2xl font-bold text-red-400">
                  {parseResult.errors.length}
                </div>
                <div className="text-xs text-zinc-500">Com erro</div>
              </div>
              <div className="card p-4 text-center">
                <div className="font-display text-2xl font-bold text-yellow-400">
                  {parseResult.duplicates.length}
                </div>
                <div className="text-xs text-zinc-500">Duplicados</div>
              </div>
            </div>

            {/* Mode selector */}
            <div className="card p-4 mb-5">
              <label className="text-sm font-medium text-zinc-300 mb-3 block">
                Modo de importação
              </label>
              <div className="flex gap-3">
                {(["add", "replace"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      mode === m
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400",
                    )}
                  >
                    {m === "add" ? "➕ Adicionar" : "🔄 Substituir tudo"}
                  </button>
                ))}
              </div>
              {mode === "replace" && (
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ Todos os exercícios existentes serão removidos
                </p>
              )}
            </div>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <div className="card p-4 mb-4 border-red-500/20">
                <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle size={15} /> Itens com erro (serão ignorados)
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {parseResult.errors.map((e) => (
                    <div
                      key={e.index}
                      className="text-xs text-zinc-500 bg-zinc-900 rounded-lg p-2"
                    >
                      <span className="text-zinc-300">{e.name}</span>:{" "}
                      {e.issues.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid preview */}
            <div className="card p-4 mb-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                Preview ({parseResult.valid.length} exercícios)
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {parseResult.valid.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm py-1.5 border-b border-zinc-800 last:border-0"
                  >
                    <CheckCircle
                      size={14}
                      className="text-green-400 flex-shrink-0"
                    />
                    <span className="text-zinc-200 flex-1 truncate">
                      {ex.name}
                    </span>
                    <span className="text-zinc-500 text-xs">{ex.category}</span>
                    {parseResult.duplicates.includes(ex.name) && (
                      <span className="text-yellow-500 text-xs">duplicado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("upload");
                  setParseResult(null);
                }}
                className="btn-secondary flex-1"
              >
                Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || parseResult.valid.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={16} />
                    Importar {parseResult.valid.length} exercícios
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-zinc-100 mb-2">
              Importação concluída!
            </h2>
            <p className="text-zinc-400 mb-8">
              {importedCount} exercícios importados com sucesso
            </p>
            <Link href="/exercises" className="btn-primary inline-flex">
              Ver exercícios
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
