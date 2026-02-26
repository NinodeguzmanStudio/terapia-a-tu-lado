import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmotionData, AnalysisData, Message, Suggestion, HistoricalEmotion } from "@/types/therapy";

export interface Achievement {
    id: string;
    type: string;
    name: string;
    icon: string;
    earnedAt: Date;
    level: number;
    progressPercentage: number;
}

export function useAnalysis(userId: string | null) {
    const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [historicalAnalysis, setHistoricalAnalysis] = useState<HistoricalEmotion[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    // Fetch historical emotion analysis
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

            // Also populate current emotion/analysis data from the latest entry
            if (data.length > 0) {
                const latest = data[data.length - 1];
                setEmotionData({
                    anxiety: latest.anxiety_percentage || 0,
                    anger: latest.anger_percentage || 0,
                    sadness: latest.sadness_percentage || 0,
                    stability: latest.stability_percentage || 0,
                    joy: latest.joy_percentage || 0,
                });
                setAnalysisData({
                    main_trigger: latest.main_trigger || "",
                    core_belief: latest.core_belief || "",
                    evolution: latest.evolution_notes || "",
                });
            }
        }
    }, [userId]);

    // Fetch achievements from user_achievements table
    const fetchAchievements = useCallback(async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from("user_achievements")
            .select("*")
            .eq("user_id", userId)
            .order("earned_at", { ascending: false });

        if (!error && data) {
            setAchievements(data.map(a => ({
                id: a.id,
                type: a.achievement_type,
                name: a.achievement_name,
                icon: a.badge_icon || "award",
                earnedAt: new Date(a.earned_at),
                level: a.level || 1,
                progressPercentage: a.progress_percentage || 0,
            })));
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
                    let rawResult = emotionResponse.data.result;
                    // Clean markdown fences if present
                    rawResult = rawResult.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                    const parsed = JSON.parse(rawResult);
                    const newEmotionData: EmotionData = {
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
                        analysis_date: new Date().toISOString().split('T')[0],
                        anxiety_percentage: newEmotionData.anxiety,
                        anger_percentage: newEmotionData.anger,
                        sadness_percentage: newEmotionData.sadness,
                        stability_percentage: newEmotionData.stability,
                        joy_percentage: newEmotionData.joy,
                        main_trigger: parsed.main_trigger,
                        core_belief: parsed.core_belief,
                        evolution_notes: parsed.evolution,
                    });

                    // Refresh history after new analysis
                    fetchHistory();

                } catch (e) {
                    console.error("Error parsing emotion analysis:", e, "Raw:", emotionResponse.data.result);
                }
            }

            if (suggestionsResponse.data?.result && userId) {
                try {
                    let rawResult = suggestionsResponse.data.result;
                    rawResult = rawResult.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                    const parsed = JSON.parse(rawResult);
                    if (parsed.suggestions) {
                        const newSuggestions: Suggestion[] = parsed.suggestions.map((s: { text: string; category: string }) => ({
                            id: crypto.randomUUID(),
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
                    console.error("Error parsing suggestions:", e, "Raw:", suggestionsResponse.data.result);
                }
            }
        } catch (error) {
            console.error("Analysis error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [userId, fetchHistory]);

    // Initial load of history + achievements
    useEffect(() => {
        if (userId) {
            fetchHistory();
            fetchAchievements();
        }
    }, [userId, fetchHistory, fetchAchievements]);

    const resetAnalysis = useCallback(() => {
        setEmotionData(null);
        setAnalysisData(null);
    }, []);

    return {
        emotionData,
        analysisData,
        historicalAnalysis,
        achievements,
        isAnalyzing,
        runFullAnalysis,
        fetchHistory,
        fetchAchievements,
        resetAnalysis,
    };
}
