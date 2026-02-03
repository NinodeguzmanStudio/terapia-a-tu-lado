import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Suggestion } from "@/types/therapy";
import { useToast } from "@/hooks/use-toast";

export function useSuggestions(userId: string | null) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const { toast } = useToast();

    const loadSuggestions = useCallback(async (uid: string) => {
        const today = new Date().toISOString().split('T')[0];
        const { data: savedSuggestions } = await supabase
            .from("daily_suggestions")
            .select("*")
            .eq("user_id", uid)
            .gte("created_at", today);

        if (savedSuggestions && savedSuggestions.length > 0) {
            setSuggestions(savedSuggestions.map(s => ({
                id: s.id,
                text: s.suggestion_text,
                category: s.category || "reflexión",
                isCompleted: s.is_completed || false,
                completedAt: s.completed_at ? new Date(s.completed_at) : undefined,
                notes: s.notes || undefined,
                confirmed: s.confirmed || false,
            })));
        }
    }, []);

    const handleSuggestionToggle = async (id: string, requireNote: boolean = true) => {
        const suggestion = suggestions.find(s => s.id === id);
        if (!suggestion) return;

        if (!suggestion.isCompleted && requireNote && !suggestion.notes) {
            toast({
                title: "Confirmación requerida",
                description: "Por favor, añade una breve nota explicando qué hiciste o qué cambió antes de marcar como completada.",
            });
            return;
        }

        const isConfirmed = !suggestion.isCompleted && suggestion.notes && suggestion.notes.trim().length > 0;

        setSuggestions((prev) =>
            prev.map((s) =>
                s.id === id
                    ? {
                        ...s,
                        isCompleted: !s.isCompleted,
                        completedAt: !s.isCompleted ? new Date() : undefined,
                        confirmed: isConfirmed,
                    }
                    : s
            )
        );

        if (userId) {
            await supabase
                .from("daily_suggestions")
                .update({
                    is_completed: !suggestion.isCompleted,
                    completed_at: !suggestion.isCompleted ? new Date().toISOString() : null,
                    confirmed: isConfirmed,
                })
                .eq("id", id);
        }
    };

    const handleAddNote = async (id: string, note: string) => {
        setSuggestions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, notes: note } : s))
        );

        if (userId) {
            await supabase
                .from("daily_suggestions")
                .update({ notes: note })
                .eq("id", id);
        }
    };

    const resetSuggestions = useCallback(async () => {
        if (!userId) return;
        await supabase.from("daily_suggestions").delete().eq("user_id", userId);
        setSuggestions([]);
    }, [userId]);

    return {
        suggestions,
        setSuggestions,
        loadSuggestions,
        handleSuggestionToggle,
        handleAddNote,
        resetSuggestions,
    };
}
