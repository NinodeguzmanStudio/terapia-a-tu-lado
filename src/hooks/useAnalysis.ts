import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmotionData, AnalysisData, Message, Suggestion, HistoricalEmotion } from "@/types/therapy";
import { callGemini } from "@/lib/gemini";

export interface Achievement {
    id: string;
    type: string;
    name: string;
    icon: string;
    earnedAt: Date;
    level: number;
    progressPercentage: number;
}

const ACHIEVEMENT_DEFINITIONS = [
    { type: "first_session", name: "Primera Sesión", icon: "heart", check: (stats: AchievementStats) => stats.totalSessions >= 1 },
    { type: "deep_talk", name: "Conversación Profunda", icon: "zap", check: (stats: AchievementStats) => stats.totalMessages >= 6 },
    { type: "self_aware", name: "Autoconocimiento", icon: "star", check: (stats: AchievementStats) => stats.analysisCount >= 2 },
    { type: "consistent", name: "Constancia", icon: "flame", check: (stats: AchievementStats) => stats.streak >= 3 },
    { type: "growth_steps", name: "Pasos de Crecimiento", icon: "trophy", check: (stats: AchievementStats) => stats.completedSuggestions >= 3 },
    { type: "weekly_warrior", name: "Guerrero Semanal", icon: "award", check: (stats: AchievementStats) => stats.streak >= 7 },
];

interface AchievementStats {
    totalSessions: number;
    totalMessages: number;
    analysisCount: number;
    streak: number;
    completedSuggestions: number;
}

export function useAnalysis(userId: string | null) {
    const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [historicalAnalysis, setHistoricalAnalysis] = useState<HistoricalEmotion[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

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

    const checkAchievements = useCallback(async (stats: AchievementStats) => {
        if (!userId) return;

        const { data: existing } = await supabase
            .from("user_achievements")
            .select("achievement_type")
            .eq("user_id", userId);

        const earnedTypes = new Set((existing || []).map(a => a.achievement_type));

        for (const def of ACHIEVEMENT_DEFINITIONS) {
            if (!earnedTypes.has(def.type) && def.check(stats)) {
                await supabase.from("user_achievements").insert({
                    user_id: userId,
                    achievement_type: def.type,
                    achievement_name: def.name,
                    badge_icon: def.icon,
                    level: 1,
                    progress_percentage: 100,
                    earned_at: new Date().toISOString(),
                });
            }
        }

        await fetchAchievements();
    }, [userId, fetchAchievements]);

    const runFullAnalysis = useCallback(async (
        messages: Message[],
        onSuggestionsGenerated: (suggestions: Suggestion[]) => void
    ) => {
        if (messages.length < 2 || !userId) return;

        setIsAnalyzing(true);
        const chatHistory = messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

        try {
            // STEP 1: Analyze emotions via Vercel serverless
            try {
                const emotionResult = await callGemini(chatHistory, "analyze_emotions");
                const cleaned = emotionResult.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                const parsed = JSON.parse(cleaned);

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

                await fetchHistory();
            } catch (e) {
                console.error("Error in emotion analysis:", e);
            }

            // STEP 2: Generate suggestions via Vercel serverless
            try {
                const sugResult = await callGemini(chatHistory, "generate_suggestions");
                const cleaned = sugResult.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                const parsed = JSON.parse(cleaned);

                if (parsed.suggestions) {
                    const newSuggestions: Suggestion[] = parsed.suggestions.map((s: { text: string; category: string }) => ({
                        id: crypto.randomUUID(),
                        text: s.text,
                        category: s.category,
                        isCompleted: false,
                        confirmed: false,
                    }));

                    onSuggestionsGenerated(newSuggestions);

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
                console.error("Error in suggestions:", e);
            }

            // STEP 3: Check achievements
            const { count: msgCount } = await supabase
                .from("chat_messages")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId);

            const { count: sugCount } = await supabase
                .from("daily_suggestions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("confirmed", true);

            const { data: profile } = await supabase
                .from("profiles")
                .select("streak_days, total_sessions")
                .eq("user_id", userId)
                .single();

            await checkAchievements({
                totalSessions: profile?.total_sessions || 0,
                totalMessages: msgCount || 0,
                analysisCount: historicalAnalysis.length + 1,
                streak: profile?.streak_days || 0,
                completedSuggestions: sugCount || 0,
            });

        } catch (error) {
            console.error("Analysis error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [userId, fetchHistory, checkAchievements, historicalAnalysis.length]);

    useEffect(() => {
        if (userId) {
            fetchHistory();
            fetchAchievements();
        }
    }, [userId, fetchHistory, fetchAchievements]);

    const resetAnalysis = useCallback(() => {
        setEmotionData(null);
        setAnalysisData(null);
        setHistoricalAnalysis([]);
        setAchievements([]);
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
