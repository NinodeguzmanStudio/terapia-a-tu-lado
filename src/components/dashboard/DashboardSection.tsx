import { motion } from "framer-motion";
import { PlantProgress } from "@/components/dashboard/PlantProgress";
import { EmotionStats } from "@/components/dashboard/EmotionStats";
import { PatternAnalysis } from "@/components/dashboard/PatternAnalysis";
import { DailySuggestions } from "@/components/dashboard/DailySuggestions";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { StreakRewards } from "@/components/dashboard/StreakRewards";
import { EmotionTrendChart } from "@/components/dashboard/EmotionTrendChart";
import { Achievements } from "@/components/dashboard/Achievements";
import { UserProfile, EmotionData, AnalysisData, Suggestion, HistoricalEmotion } from "@/types/therapy";
import { Achievement } from "@/hooks/useAnalysis";

interface DashboardSectionProps {
    userProfile: UserProfile | null;
    emotionData: EmotionData | null;
    analysisData: AnalysisData | null;
    historicalAnalysis: HistoricalEmotion[];
    suggestions: Suggestion[];
    achievements: Achievement[];
    isAnalyzing: boolean;
    activeDates: Date[];
    confirmedSuggestions: number;
    handleSuggestionToggle: (id: string, requireNote?: boolean) => void;
    handleAddNote: (id: string, note: string) => void;
}

function calculateOverallProgress(
    streak: number,
    totalSessions: number,
    confirmedSuggestions: number,
    analysisCount: number,
) {
    const streakScore = Math.min(streak * 3, 30);
    const sessionScore = Math.min(totalSessions * 2, 25);
    const suggestionScore = Math.min(confirmedSuggestions * 5, 25);
    const analysisScore = Math.min(analysisCount * 4, 20);
    const total = Math.min(streakScore + sessionScore + suggestionScore + analysisScore, 100);

    let level = 1;
    if (total >= 80) level = 5;
    else if (total >= 60) level = 4;
    else if (total >= 40) level = 3;
    else if (total >= 20) level = 2;

    return { totalProgress: total, currentLevel: level };
}

export function DashboardSection({
    userProfile,
    emotionData,
    analysisData,
    historicalAnalysis,
    suggestions,
    achievements,
    isAnalyzing,
    activeDates,
    confirmedSuggestions,
    handleSuggestionToggle,
    handleAddNote,
}: DashboardSectionProps) {
    const { totalProgress, currentLevel } = calculateOverallProgress(
        userProfile?.streak_days || 0,
        userProfile?.total_sessions || 0,
        confirmedSuggestions,
        historicalAnalysis.length,
    );

    const hasData = emotionData || analysisData || suggestions.length > 0;

    return (
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 relative">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-serif mb-2">Mi Progreso</h2>
                    <p className="text-muted-foreground">
                        {userProfile?.name ? `${userProfile.name}, esta` : 'Esta'} es tu evaluación emocional y plan de acción
                    </p>
                </motion.div>

                {/* Empty state for first-time users */}
                {!hasData && !isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 px-8"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-warm flex items-center justify-center opacity-60">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-serif mb-3">Tu camino empieza aquí</h3>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Conversa con tu terapeuta. Después de 2 intercambios, analizaremos tus patrones emocionales
                            y crearemos un plan de acción personalizado para ti.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground/70">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-lg">💬</span>
                                </div>
                                <span>Conversa</span>
                            </div>
                            <div className="text-muted-foreground/30">→</div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-lg">📊</span>
                                </div>
                                <span>Analiza</span>
                            </div>
                            <div className="text-muted-foreground/30">→</div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-lg">🌱</span>
                                </div>
                                <span>Crece</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Main content grid */}
                {(hasData || isAnalyzing) && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* 1. Estado emocional — lo primero y más importante */}
                        <EmotionStats data={emotionData} isLoading={isAnalyzing} />

                        {/* 2. Patrones detectados */}
                        <PatternAnalysis data={analysisData} isLoading={isAnalyzing} />

                        {/* 3. Plan de acción — ocupa ancho completo para protagonismo */}
                        <div className="lg:col-span-2">
                            <DailySuggestions
                                suggestions={suggestions}
                                onToggle={handleSuggestionToggle}
                                onAddNote={handleAddNote}
                                isLoading={isAnalyzing}
                            />
                        </div>

                        {/* 4. Evolución emocional */}
                        <div className="lg:col-span-2">
                            <EmotionTrendChart data={historicalAnalysis} isLoading={isAnalyzing} />
                        </div>

                        {/* 5. Logros e insignias */}
                        <Achievements
                            achievements={achievements}
                            currentLevel={currentLevel}
                            totalProgress={totalProgress}
                            streak={userProfile?.streak_days || 0}
                            isLoading={isAnalyzing}
                        />

                        {/* 6. Calendario */}
                        <StreakCalendar activeDates={activeDates} />

                        {/* 7. Logros por constancia */}
                        <div className="lg:col-span-2">
                            <StreakRewards currentStreak={userProfile?.streak_days || 0} />
                        </div>
                    </div>
                )}
            </div>

            {/* Planta — esquina inferior derecha, flotante */}
            <div className="fixed bottom-6 right-6 z-30">
                <PlantProgress
                    confirmedSuggestions={confirmedSuggestions}
                    totalSuggestions={suggestions.length}
                    streakDays={userProfile?.streak_days || 0}
                    totalSessions={userProfile?.total_sessions || 0}
                    isLoading={false}
                    compact={true}
                />
            </div>
        </div>
    );
}
