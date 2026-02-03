import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmotionData, AnalysisData, Message, Suggestion } from "@/types/therapy";

export function useAnalysis(userId: string | null) {
    const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const runFullAnalysis = useCallback(async (messages: Message[], onSuggestionsGenerated: (suggestions: Suggestion[]) => void) => {
        if (messages.length < 3) return;

        setIsAnalyzing(true);
        const chatHistory = messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const [emotionResponse, suggestionsResponse] = await Promise.all([
                supabase.functions.invoke("therapy-chat", {
                    body: { messages: chatHistory, type: "analyze_emotions" },
                }),
                supabase.functions.invoke("therapy-chat", {
                    body: { messages: chatHistory, type: "generate_suggestions" },
                }),
            ]);

            if (emotionResponse.data?.result) {
                try {
                    const parsed = JSON.parse(emotionResponse.data.result);
                    setEmotionData({
                        anxiety: parsed.anxiety || 0,
                        anger: parsed.anger || 0,
                        sadness: parsed.sadness || 0,
                        stability: parsed.stability || 0,
                        joy: parsed.joy || 0,
                        recommendations: parsed.recommendations || [],
                    });
                    setAnalysisData({
                        main_trigger: parsed.main_trigger || "",
                        core_belief: parsed.core_belief || "",
                        evolution: parsed.evolution || "",
                    });
                } catch (e) {
                    console.error("Error parsing emotion analysis:", e);
                }
            }

            if (suggestionsResponse.data?.result && userId) {
                try {
                    const parsed = JSON.parse(suggestionsResponse.data.result);
                    if (parsed.suggestions) {
                        const newSuggestions: Suggestion[] = parsed.suggestions.map((s: { text: string; category: string }, i: number) => ({
                            id: `suggestion-${Date.now()}-${i}`,
                            text: s.text,
                            category: s.category,
                            isCompleted: false,
                            confirmed: false,
                        }));

                        onSuggestionsGenerated(newSuggestions);

                        // Save to database
                        for (const s of newSuggestions) {
                            await supabase.from("daily_suggestions").insert({
                                id: s.id,
                                user_id: userId,
                                suggestion_text: s.text,
                                category: s.category,
                                is_completed: false,
                                confirmed: false,
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error parsing suggestions:", e);
                }
            }
        } catch (error) {
            console.error("Analysis error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [userId]);

    const resetAnalysis = useCallback(() => {
        setEmotionData(null);
        setAnalysisData(null);
    }, []);

    return {
        emotionData,
        analysisData,
        isAnalyzing,
        runFullAnalysis,
        resetAnalysis,
    };
}
