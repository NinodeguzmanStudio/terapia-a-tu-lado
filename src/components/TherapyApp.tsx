import { useState, useEffect } from "react";
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

  const { userProfile, userId, activeDates, updateProfile, deleteAccount, handleLogout } = useUserProfile();
  const {
    messages,
    isLoading,
    isStreaming,
    conversationsToday,
    messageCount,
    totalConversations,
    isLoadingHistory,
    sendMessage,
    loadChatHistory,
    resetChat,
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
    isAnalyzing,
    runFullAnalysis,
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

  // Trigger analysis after message #3
  useEffect(() => {
    if (messageCount === 3 && messages.length >= 3) {
      runFullAnalysis(messages, (newSuggestions) => {
        setSuggestions(newSuggestions);
        toast.success("Evaluación completada", {
          description: "Tu situación emocional y pasos de crecimiento han sido actualizados.",
        });
      });
    }
  }, [messageCount, messages.length, messages, runFullAnalysis, setSuggestions]);

  // Branching invitation after 2nd user message
  useEffect(() => {
    if (messageCount === 2) {
      toast.info("Tu evaluación está lista", {
        description: "Hemos analizado tus patrones emocionales y preparado pasos de crecimiento personalizados para ti. Si tienes dudas, pregúntale a tu terapeuta.",
        action: {
          label: "Ver Mi Progreso",
          onClick: () => setActiveTab("stats"),
        },
      });
    }
  }, [messageCount]);

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
