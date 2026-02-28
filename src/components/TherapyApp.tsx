import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useChat } from "@/hooks/useChat";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useAnalysis } from "@/hooks/useAnalysis";
import { toast } from "sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatSection } from "@/components/chat/ChatSection";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

export function TherapyApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "stats">("chat");

  const { userProfile, userId, activeDates, updateProfile, deleteAccount, handleLogout, refreshProfile } = useUserProfile();
  const {
    messages,
    isLoading,
    isStreaming,
    conversationsToday,
    userMessageCount,
    totalConversations,
    isLoadingHistory,
    isModerator,
    sendMessage,
    loadChatHistory,
    resetChat,
    fullReset,
    shouldTriggerAnalysis,
  } = useChat(userId, userProfile);

  const {
    suggestions,
    setSuggestions,
    loadSuggestions,
    handleSuggestionToggle,
    handleAddNote,
    resetSuggestions,
  } = useSuggestions(userId);

  const {
    emotionData,
    analysisData,
    historicalAnalysis,
    achievements,
    isAnalyzing,
    runFullAnalysis,
    fetchHistory,
    fetchAchievements,
    resetAnalysis,
  } = useAnalysis(userId);

  const { theme, setTheme } = useTheme() || { theme: "light", setTheme: () => { } };

  useEffect(() => {
    if (userId) {
      loadChatHistory(userId);
      loadSuggestions(userId);
    }
  }, [userId, loadChatHistory, loadSuggestions]);

  // ============================================================
  // ANALYSIS TRIGGER — Simplified and bulletproof
  //
  // Counts completed assistant responses. Every time streaming
  // ends, check if we've hit an even number (2, 4, 6...) and
  // haven't already analyzed at this count. If so, trigger
  // analysis after 5s.
  // ============================================================
  const prevStreamingRef = useRef(false);
  const lastAnalyzedAtResponseCount = useRef(0);
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const streamingJustEnded = prevStreamingRef.current === true && isStreaming === false;
    prevStreamingRef.current = isStreaming;

    if (!streamingJustEnded) return;
    if (isLoading) return;

    const assistantCount = messages.filter(
      (m) => m.role === "assistant" && m.content.trim().length > 0
    ).length;

    console.log(`[TherapyApp] Streaming ended. assistantCount=${assistantCount}, lastAnalyzed=${lastAnalyzedAtResponseCount.current}`);

    if (assistantCount >= 2 && assistantCount % 2 === 0 && assistantCount > lastAnalyzedAtResponseCount.current) {
      lastAnalyzedAtResponseCount.current = assistantCount;

      console.log("[TherapyApp] Analysis trigger fired — scheduling in 5s");

      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);

      analysisTimerRef.current = setTimeout(() => {
        console.log("[TherapyApp] Running analysis NOW");
        runFullAnalysis(messages, (newSuggestions) => {
          setSuggestions(newSuggestions);
          refreshProfile();
          toast.success("Tu evaluación está lista", {
            description: "Revisa tu progreso: patrones emocionales y pasos de crecimiento actualizados.",
            action: {
              label: "Ver Mi Progreso",
              onClick: () => setActiveTab("stats"),
            },
            duration: 6000,
          });
        });
      }, 5000);
    }
  }, [isStreaming, isLoading, messages, runFullAnalysis, setSuggestions, refreshProfile]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
    };
  }, []);

  const handleResetChat = async () => {
    if (!userId || !userProfile?.is_moderator) return;
    await fullReset();
    resetSuggestions();
    resetAnalysis();
    lastAnalyzedAtResponseCount.current = 0;
    await refreshProfile();
    setActiveTab("chat");
    toast.success("Reset completo", { description: "Todos los datos fueron eliminados. Empieza de cero." });
  };

  const confirmedSuggestions = suggestions.filter(s => s.confirmed).length;

  useEffect(() => {
    if (userProfile?.streak_days) {
      if (userProfile.streak_days === 7) {
        toast.success("¡Semana de Constancia!", { description: "Has completado 7 días seguidos cuidando tu bienestar." });
      } else if (userProfile.streak_days === 14) {
        toast.success("¡Quincena de Bienestar!", { description: "¡14 días de racha! Tu compromiso es admirable." });
      } else if (userProfile.streak_days === 30) {
        toast.success("¡Mes de Transformación!", { description: "¡30 días! Has creado un hábito poderoso de autocuidado." });
      }
    }
  }, [userProfile?.streak_days]);

  const welcomeMessage = userProfile?.name ? `Hola, ${userProfile.name}. ` : "";

  return (
    <div className="min-h-screen bg-gradient-sunset flex">
      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversationsToday={conversationsToday}
        userProfile={userProfile}
        theme={theme}
        setTheme={setTheme}
        handleLogout={handleLogout}
        handleResetChat={handleResetChat}
        updateProfile={updateProfile}
        deleteAccount={deleteAccount}
        emotionData={emotionData}
        suggestions={suggestions}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {activeTab === "chat" ? (
          <ChatSection
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isLoadingHistory={isLoadingHistory}
            conversationsToday={conversationsToday}
            totalConversations={totalConversations}
            welcomeMessage={welcomeMessage}
            sendMessage={sendMessage}
            setActiveTab={setActiveTab}
            isModerator={isModerator}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          <DashboardSection
            userProfile={userProfile}
            emotionData={emotionData}
            analysisData={analysisData}
            historicalAnalysis={historicalAnalysis}
            suggestions={suggestions}
            achievements={achievements}
            isAnalyzing={isAnalyzing}
            activeDates={activeDates}
            confirmedSuggestions={confirmedSuggestions}
            handleSuggestionToggle={handleSuggestionToggle}
            handleAddNote={handleAddNote}
          />
        )}
      </main>
    </div>
  );
}
