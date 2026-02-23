import { motion } from "framer-motion";
import { PlantProgress } from "@/components/dashboard/PlantProgress";
import { EmotionStats } from "@/components/dashboard/EmotionStats";
import { PatternAnalysis } from "@/components/dashboard/PatternAnalysis";
import { DailySuggestions } from "@/components/dashboard/DailySuggestions";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { StreakRewards } from "@/components/dashboard/StreakRewards";
import { EmotionTrendChart } from "@/components/dashboard/EmotionTrendChart";
import { UserProfile, EmotionData, AnalysisData, Suggestion, HistoricalEmotion } from "@/types/therapy";

interface DashboardSectionProps {
    userProfile: UserProfile | null;
    emotionData: EmotionData | null;
    analysisData: AnalysisData | null;
    historicalAnalysis: HistoricalEmotion[];
    suggestions: Suggestion[];
    isAnalyzing: boolean;
    activeDates: Date[];
    confirmedSuggestions: number;
    handleSuggestionToggle: (id: string, requireNote?: boolean) => void;
    handleAddNote: (id: string, note: string) => void;
}

export function DashboardSection({
    userProfile,
    emotionData,
    analysisData,
    historicalAnalysis,
    suggestions,
    isAnalyzing,
    activeDates,
    confirmedSuggestions,
    handleSuggestionToggle,
    handleAddNote,
}: DashboardSectionProps) {
    return (
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-serif mb-2">Mi Progreso</h2>
                    <p className="text-muted-foreground">
                        {userProfile?.name ? `${userProfile.name}, esta es tu` : 'Tu'} evaluación emocional y pasos de crecimiento
                    </p>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* 1. Situación emocional — lo primero que ve */}
                    <PatternAnalysis data={analysisData} isLoading={isAnalyzing} />
                    <EmotionStats data={emotionData} isLoading={isAnalyzing} />

                    {/* 2. Pasos de crecimiento — qué puede hacer hoy */}
                    <DailySuggestions
                        suggestions={suggestions}
                        onToggle={handleSuggestionToggle}
                        onAddNote={handleAddNote}
                        isLoading={isAnalyzing}
                    />

                    {/* 3. Evolución — su progreso en el tiempo */}
                    <EmotionTrendChart data={historicalAnalysis} isLoading={isAnalyzing} />

                    {/* 4. Calendario y racha */}
                    <StreakCalendar activeDates={activeDates} />
                    <StreakRewards currentStreak={userProfile?.streak_days || 0} />

                    {/* 5. Planta AL FINAL — la recompensa visual */}
                    <PlantProgress
                        confirmedSuggestions={confirmedSuggestions}
                        totalSuggestions={suggestions.length}
                        streakDays={userProfile?.streak_days || 0}
                        totalSessions={userProfile?.total_sessions || 0}
                        isLoading={false}
                    />
                </div>
            </div>
        </div>
    );
}
