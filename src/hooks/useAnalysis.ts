import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmotionData, AnalysisData, Message, Suggestion, HistoricalEmotion } from "@/types/therapy";

export function useAnalysis(userId: string | null) {
    const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [historicalAnalysis, setHistoricalAnalysis] = useState<HistoricalEmotion[]>([]);

    const fetchHistory = useCallback(async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from("emotional_analysis")
            .select("*")
            .eq("user_id", userId)
            .order("analysis_date", { ascending: true })
            .limit(30);

        if (!error && data) {
            setHistoricalAnalysis(data);
        }
    }, [userId]);

    const runFullAnalysis = useCallback(async (messages: Message[], onSuggestionsGenerated: (suggestions: Suggestion[]) => void) => {
        if (messages.length < 3 || !userId) return;

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
                    const newEmotionData = {
                        anxiety: parsed.anxiety || 0,
                        anger: parsed.anger || 0,
                        sadness: parsed.sadness || 0,
                        stability: parsed.stability || 0,
                        joy: parsed.joy || 0,
                        recommendations: parsed.recommendations || [],
                    };

                    setEmotionData(newEmotionData);
                    setAnalysisData({
                        main_trigger: parsed.main_trigger || "",
                        core_belief: parsed.core_belief || "",
                        evolution: parsed.evolution || "",
                    });

                    // Save to database for trends
                    await supabase.from("emotional_analysis").insert({
                        user_id: userId,
                        anxiety_percentage: newEmotionData.anxiety,
                        anger_percentage: newEmotionData.anger,
                        sadness_percentage: newEmotionData.sadness,
                        stability_percentage: newEmotionData.stability,
                        joy_percentage: newEmotionData.joy,
                        main_trigger: parsed.main_trigger,
                        core_belief: parsed.core_belief,
                        evolution_notes: parsed.evolution,
                    });

                    fetchHistory(); // Refresh history after new analysis

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
    }, [userId, fetchHistory]);

    // Initial load of history
    useEffect(() => {
        if (userId) {
            fetchHistory();
        }
    }, [userId, fetchHistory]);

    const resetAnalysis = useCallback(() => {
        setEmotionData(null);
        setAnalysisData(null);
    }, []);

    return {
        emotionData,
        analysisData,
        historicalAnalysis, // Return history
        isAnalyzing,
        runFullAnalysis,
        fetchHistory, // Return fetch function
        resetAnalysis,
    };
}
