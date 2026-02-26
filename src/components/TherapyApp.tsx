import { useState, useEffect, useCallback } from "react";
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
    sendMessage,
    loadChatHistory,
    resetChat,
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
    resetAnalysis,
  } = useAnalysis(userId);

  const { theme, setTheme } = useTheme() || { theme: "light", setTheme: () => { } };

  // Initial load
  useEffect(() => {
    if (userId) {
      loadChatHistory(userId);
      loadSuggestions(userId);
    }
  }, [userId, loadChatHistory, loadSuggestions]);

  // ──────────────────────────────────────────────
  // FIXED: Analysis trigger — fires every 3rd user message,
  // survives page reloads, and works across sessions.
  // ──────────────────────────────────────────────
  useEffect(() => {
    // Only check after streaming is done (assistant has responded)
    if (isStreaming || isLoading) return;
    if (messages.length < 3) return;

    if (shouldTriggerAnalysis()) {
      runFullAnalysis(messages, (newSuggestions) => {
        setSuggestions(newSuggestions);
        // Refresh profile to pick up streak/session updates from DB trigger
        refreshProfile();
        toast.success("Tu evaluación está lista", {
          description: "Tus patrones emocionales y pasos de crecimiento han sido actualizados.",
          action: {
            label: "Ver Mi Progreso",
            onClick: () => setActiveTab("stats"),
          },
        });
      });
    }
  }, [userMessageCount, isStreaming, isLoading, messages, shouldTriggerAnalysis, runFullAnalysis, setSuggestions]);

  // Heads-up before analysis triggers (at message #2)
  useEffect(() => {
    if (userMessageCount === 2 && !isStreaming && !isLoading) {
      toast.info("Estamos preparando tu evaluación", {
        description: "Sigue conversando. En tu próximo mensaje analizaremos tus patrones emocionales.",
      });
    }
  }, [userMessageCount, isStreaming, isLoading]);

  const handleResetChat = async () => {
    if (!userId || !userProfile?.is_moderator) return;
    await resetChat();
    await resetSuggestions();
    resetAnalysis();
  };

  const confirmedSuggestions = suggestions.filter(s => s.confirmed).length;

  // Celebrate milestones
  useEffect(() => {
    if (userProfile?.streak_days) {
      if (userProfile.streak_days === 7) {
        toast.success("¡Semana de Constancia!", {
          description: "Has completado 7 días seguidos cuidando tu bienestar. ⭐",
        });
      } else if (userProfile.streak_days === 14) {
        toast.success("¡Quincena de Bienestar!", {
          description: "¡14 días de racha! Tu compromiso es admirable. 🔥",
        });
      } else if (userProfile.streak_days === 30) {
        toast.success("¡Mes de Transformación!", {
          description: "¡30 días! Has creado un hábito poderoso de autocuidado. 👑",
        });
      }
    }
  }, [userProfile?.streak_days]);

  const welcomeMessage = userProfile?.name
    ? `Hola, ${userProfile.name}. `
    : "";

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
