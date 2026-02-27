import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, ChevronDown, ChevronUp, Sparkles, ListChecks } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  text: string;
  category: string;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  confirmed: boolean;
}

interface DailySuggestionsProps {
  suggestions: Suggestion[];
  onToggle: (id: string) => void;
  onAddNote: (id: string, note: string) => void;
  isLoading?: boolean;
}

const categoryIcons: Record<string, string> = {
  mindfulness: "🧘",
  ejercicio: "🏃",
  social: "💬",
  reflexión: "📝",
  creatividad: "🎨",
};

export function DailySuggestions({ suggestions, onToggle, onAddNote, isLoading }: DailySuggestionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Tu Plan de Acción
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
              <div className="flex-1 h-4 bg-muted-foreground/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="therapy-card text-center py-10">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-serif mb-2">Tu Plan de Acción</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Después de tu conversación, recibirás pasos concretos y personalizados para trabajar en tu bienestar hoy.
        </p>
      </div>
    );
  }

  const completedCount = suggestions.filter((s) => s.isCompleted).length;
  const progress = (completedCount / suggestions.length) * 100;
  const allDone = completedCount === suggestions.length;

  return (
    <div className="therapy-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-serif flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Tu Plan de Acción
        </h3>
        <span className={cn(
          "text-sm font-medium px-3 py-1 rounded-full",
          allDone ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-muted text-muted-foreground"
        )}>
          {completedCount}/{suggestions.length} {allDone ? "✓" : ""}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Pasos personalizados basados en tu conversación de hoy.
      </p>

      {/* Progress bar */}
      <div className="progress-track mb-6 h-2.5 rounded-full">
        <motion.div
          className={cn(
            "progress-fill h-2.5 rounded-full",
            allDone ? "bg-green-500" : "bg-gradient-warm"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={cn(
                "border rounded-xl transition-all overflow-hidden",
                suggestion.isCompleted && suggestion.confirmed
                  ? "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20"
                  : suggestion.isCompleted
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"
                    : "bg-background border-border hover:border-primary/30 hover:shadow-sm"
              )}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() => onToggle(suggestion.id)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all",
                      suggestion.isCompleted
                        ? suggestion.confirmed
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-amber-500 border-amber-500 text-white"
                        : "bg-background border-border hover:border-primary/50"
                    )}
                  >
                    <Check className={cn("h-4 w-4", !suggestion.isCompleted && "opacity-0")} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">{categoryIcons[suggestion.category] || "✨"}</span>
                    <div className="flex-1">
                      <span
                        className={cn(
                          "text-sm leading-relaxed transition-all",
                          suggestion.isCompleted && suggestion.confirmed && "line-through text-muted-foreground"
                        )}
                      >
                        {suggestion.text}
                      </span>
                      {suggestion.completedAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(suggestion.completedAt).toLocaleTimeString("es", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {suggestion.isCompleted && !suggestion.confirmed && (
                            <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">pendiente de confirmar</span>
                          )}
                          {suggestion.confirmed && (
                            <span className="text-green-600 dark:text-green-400 text-[10px] font-medium">confirmada ✓</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {expandedId === suggestion.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {expandedId === suggestion.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 border-t border-border/50"
                  >
                    <div className="pt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        {suggestion.isCompleted
                          ? "Tu reflexión sobre esta experiencia:"
                          : "Escribe brevemente qué hiciste para marcar como completada:"}
                      </p>
                      <Textarea
                        placeholder="¿Qué hiciste? ¿Qué cambió en ti?"
                        value={suggestion.notes || noteDrafts[suggestion.id] || ""}
                        onChange={(e) => setNoteDrafts(prev => ({ ...prev, [suggestion.id]: e.target.value }))}
                        onBlur={() => {
                          const draft = noteDrafts[suggestion.id];
                          if (draft && draft.trim()) {
                            onAddNote(suggestion.id, draft);
                            setNoteDrafts(prev => { const next = { ...prev }; delete next[suggestion.id]; return next; });
                          }
                        }}
                        className="min-h-[60px] text-sm bg-background/50"
                      />
                      {!suggestion.isCompleted && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => onToggle(suggestion.id)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            Lo hice ✓
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-xs font-medium transition-colors border border-border"
                          >
                            Aún no
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl text-center border border-green-200 dark:border-green-500/20"
        >
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ¡Completaste todos tus pasos de hoy! Tu planta crece contigo. 🌱
          </p>
        </motion.div>
      )}
    </div>
  );
}
