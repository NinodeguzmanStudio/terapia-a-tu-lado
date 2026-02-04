import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [noteText, setNoteText] = useState("");

  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Sugerencias del Día</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-5 h-5 bg-muted-foreground/20 rounded" />
              <div className="flex-1 h-4 bg-muted-foreground/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="therapy-card text-center py-8">
        <Sparkles className="h-10 w-10 mx-auto mb-3 text-accent" />
        <p className="text-muted-foreground">
          Las sugerencias aparecerán después de tu primera conversación
        </p>
      </div>
    );
  }

  const completedCount = suggestions.filter((s) => s.isCompleted).length;
  const progress = (completedCount / suggestions.length) * 100;

  return (
    <div className="therapy-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif">Sugerencias del Día</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{suggestions.length} completadas
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track mb-6">
        <motion.div
          className="progress-fill bg-gradient-warm"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "border rounded-xl transition-all overflow-hidden",
                suggestion.isCompleted && suggestion.confirmed
                  ? "bg-[hsl(var(--suggestion-confirmed))] border-[hsl(var(--suggestion-confirmed)/0.5)]"
                  : suggestion.isCompleted
                    ? "bg-[hsl(var(--suggestion-completed))] border-[hsl(var(--suggestion-completed)/0.5)]"
                    : "bg-background border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() => onToggle(suggestion.id)}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center border transition-all",
                      suggestion.isCompleted
                        ? "bg-primary border-primary text-white"
                        : "bg-background border-border hover:border-primary/50"
                    )}
                  >
                    <Check className={cn("h-4 w-4", !suggestion.isCompleted && "opacity-0")} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{categoryIcons[suggestion.category] || "✨"}</span>
                    <span
                      className={cn(
                        "text-sm transition-all",
                        suggestion.isCompleted && "line-through text-muted-foreground"
                      )}
                    >
                      {suggestion.text}
                    </span>
                  </div>
                  {suggestion.completedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(suggestion.completedAt).toLocaleTimeString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {suggestion.isCompleted && !suggestion.confirmed && (
                        <span className="text-warning text-[10px]">• sin confirmar</span>
                      )}
                      {suggestion.confirmed && (
                        <span className="text-primary text-[10px]">• confirmada ✓</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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
                          ? "Nota sobre tu experiencia:"
                          : "Añade una nota para poder marcar como completada:"}
                      </p>
                      <Textarea
                        placeholder="¿Qué hiciste? ¿Qué cambió en ti?"
                        value={suggestion.notes || noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onBlur={() => {
                          if (noteText.trim()) {
                            onAddNote(suggestion.id, noteText);
                            setNoteText("");
                          }
                        }}
                        className="min-h-[60px] text-sm bg-background/50"
                      />
                      {!suggestion.isCompleted && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => onToggle(suggestion.id)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            Sí, lo hice
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-muted-foreground hover:text-foreground px-3 py-1 rounded-md text-xs font-medium transition-colors"
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
    </div>
  );
}
