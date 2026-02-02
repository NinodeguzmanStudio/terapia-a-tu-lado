import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BarChart2, MessageCircle, Sparkles, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { EmotionStats } from "@/components/dashboard/EmotionStats";
import { PatternAnalysis } from "@/components/dashboard/PatternAnalysis";
import { DailySuggestions } from "@/components/dashboard/DailySuggestions";
import { PlantProgress } from "@/components/dashboard/PlantProgress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface EmotionData {
  anxiety: number;
  anger: number;
  sadness: number;
  stability: number;
  joy: number;
  recommendations?: string[];
}

interface AnalysisData {
  main_trigger: string;
  core_belief: string;
  evolution: string;
}

interface Suggestion {
  id: string;
  text: string;
  category: string;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  confirmed: boolean;
}

interface UserProfile {
  name: string | null;
  age: number | null;
  is_moderator: boolean;
  streak_days: number;
  total_sessions: number;
}

export function TherapyApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "stats">("chat");
  const [conversationsToday, setConversationsToday] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Analysis states
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user profile and chat history on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, age, is_moderator, streak_days, total_sessions")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Load today's messages
      const today = new Date().toISOString().split('T')[0];
      const { data: chatMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("session_date", today)
        .order("created_at", { ascending: true });

      if (chatMessages && chatMessages.length > 0) {
        setMessages(chatMessages.map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })));

        // Count user messages for conversation tracking
        const userMsgCount = chatMessages.filter(m => m.role === "user").length;
        setMessageCount(userMsgCount);
        setConversationsToday(Math.min(Math.floor(userMsgCount / 3), 3));
      }

      // Load suggestions
      const { data: savedSuggestions } = await supabase
        .from("daily_suggestions")
        .select("*")
        .eq("user_id", user.id)
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

      // Count total conversations for action vs chat logic
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user");

      setTotalConversations(count || 0);

      setIsLoadingHistory(false);
    };

    loadUserData();
  }, []);

  // Trigger analysis after message #3
  useEffect(() => {
    if (messageCount === 3 && messages.length >= 3) {
      runFullAnalysis();
    }
  }, [messageCount, messages.length]);

  const runFullAnalysis = async () => {
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
            const newSuggestions = parsed.suggestions.map((s: any, i: number) => ({
              id: `suggestion-${Date.now()}-${i}`,
              text: s.text,
              category: s.category,
              isCompleted: false,
              confirmed: false,
            }));

            setSuggestions(newSuggestions);

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
  };

  const saveMessage = async (message: Message) => {
    if (!userId) return;

    await supabase.from("chat_messages").insert({
      id: message.id,
      user_id: userId,
      content: message.content,
      role: message.role,
    });
  };

  const sendMessage = useCallback(async (content: string) => {
    if (conversationsToday >= 3) {
      toast({
        title: "Límite diario alcanzado",
        description: "Has llegado a tu límite de 3 conversaciones hoy. Vuelve mañana para continuar.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);
    setIsLoading(true);

    // Include user context for personalization
    const chatHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user context as system context
    const userContext = userProfile?.name
      ? `[Contexto: El usuario se llama ${userProfile.name}${userProfile.age ? `, tiene ${userProfile.age} años` : ''}. Total de conversaciones previas: ${totalConversations}]`
      : '';

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    console.log("Diagnostic - Env Check:", {
      urlExists: !!supabaseUrl,
      keyExists: !!pubKey,
      tokenType: session?.access_token ? "session" : "anon_key",
      urlHeader: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : "missing"
    });

    console.log("Calling therapy-chat function...");

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/therapy-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "x-client-info": "supabase-js-antigravity",
          },
          body: JSON.stringify({
            messages: chatHistory,
            type: "chat",
            userContext,
            totalConversations,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Function Error Full Object:", errorData);
        const detailMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
        throw new Error(`${errorData.error || "Error"}: ${detailMessage || ""}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se pudo iniciar la lectura");

      setIsLoading(false);
      setIsStreaming(true);

      let assistantContent = "";
      const decoder = new TextDecoder();
      let buffer = "";

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save assistant message
      await saveMessage({ ...assistantMessage, content: assistantContent });

      setIsStreaming(false);
      setMessageCount((prev) => prev + 1);
      setTotalConversations((prev) => prev + 1);

      if (messageCount === 0) {
        setConversationsToday((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsLoading(false);
      setIsStreaming(false);
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  }, [messages, conversationsToday, messageCount, toast, userId, userProfile, totalConversations]);

  const handleSuggestionToggle = async (id: string, requireNote: boolean = true) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    // If marking as complete and no note exists, require confirmation
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

    // Update in database
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

  const handleResetChat = async () => {
    if (!userId || !userProfile?.is_moderator) return;

    // Delete all messages for this user
    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId);

    // Delete all suggestions
    await supabase
      .from("daily_suggestions")
      .delete()
      .eq("user_id", userId);

    // Reset local state
    setMessages([]);
    setSuggestions([]);
    setMessageCount(0);
    setConversationsToday(0);
    setEmotionData(null);
    setAnalysisData(null);

    toast({
      title: "Chat reiniciado",
      description: "El historial ha sido borrado para pruebas.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const confirmedSuggestions = suggestions.filter(s => s.confirmed).length;
  const welcomeMessage = userProfile?.name
    ? `Hola, ${userProfile.name}. `
    : "";

  return (
    <div className="min-h-screen bg-gradient-sunset flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card rounded-lg shadow-soft"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== "undefined" && window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={cn(
              "fixed lg:relative z-40 w-[280px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col",
              sidebarOpen ? "block" : "hidden lg:flex"
            )}
          >
            {/* Logo with close button */}
            <div className="p-6 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-serif text-sidebar-foreground">
                    Terapia a Tu Lado
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu espacio de bienestar
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-sidebar-foreground" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab("chat");
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  activeTab === "chat"
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <MessageCircle className="h-5 w-5" />
                <span>Chat Terapéutico</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("stats");
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  activeTab === "stats"
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <BarChart2 className="h-5 w-5" />
                <span>Mi Progreso</span>
              </button>
            </nav>

            {/* Conversations counter */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversaciones hoy</span>
                <span className="font-medium">{conversationsToday}/3</span>
              </div>
              <div className="progress-track mt-2">
                <div
                  className="progress-fill bg-gradient-warm"
                  style={{ width: `${(conversationsToday / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Logout and moderator options */}
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>

              {/* Moderator reset option - only visible for moderators */}
              {userProfile?.is_moderator && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleResetChat}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar chat (modo prueba)
                </Button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {activeTab === "chat" ? (
          <>
            {/* Chat header */}
            <header className="px-4 lg:px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-warm flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-lg">Tu Terapeuta</h2>
                  <p className="text-xs text-muted-foreground">
                    {isStreaming ? "Escribiendo..." : "En línea"}
                  </p>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
              <div className="max-w-3xl mx-auto">
                {isLoadingHistory ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse text-muted-foreground">
                      Cargando tu historial...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex flex-col items-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-warm flex items-center justify-center mb-6 shadow-glow">
                        <Sparkles className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif mb-2">
                        {welcomeMessage}Bienvenido
                      </h3>
                      <p className="text-muted-foreground max-w-sm">
                        Este es tu espacio seguro. Cuéntame, ¿cómo te sientes hoy?
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id && message.role === "assistant"}
                      />
                    ))}

                    {/* Gentle nudge after 6+ conversations */}
                    {totalConversations >= 6 && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-sage-light/30 rounded-xl text-center"
                      >
                        <p className="text-sm text-muted-foreground">
                          💫 Has tenido varias conversaciones profundas.
                          <button
                            onClick={() => setActiveTab("stats")}
                            className="text-primary hover:underline ml-1"
                          >
                            Revisa tu progreso
                          </button>
                          {" "}para ver cómo ha crecido tu planta.
                        </p>
                      </motion.div>
                    )}
                  </>
                )}

                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="max-w-3xl mx-auto w-full">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading || isStreaming}
                disabled={conversationsToday >= 3}
                placeholder={
                  conversationsToday >= 3
                    ? "Límite diario alcanzado. Vuelve mañana."
                    : "Escribe cómo te sientes..."
                }
              />
            </div>
          </>
        ) : (
          /* Dashboard view */
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-serif mb-2">Mi Progreso</h2>
                <p className="text-muted-foreground">
                  {userProfile?.name ? `${userProfile.name}, este es tu` : 'Tu'} análisis basado en tus conversaciones
                </p>
              </motion.div>

              <div className="grid gap-6 lg:grid-cols-2">
                <PlantProgress
                  confirmedSuggestions={confirmedSuggestions}
                  totalSuggestions={suggestions.length}
                  streakDays={userProfile?.streak_days || 0}
                  totalSessions={userProfile?.total_sessions || 0}
                  isLoading={false}
                />
                <EmotionStats data={emotionData} isLoading={isAnalyzing} />
                <PatternAnalysis data={analysisData} isLoading={isAnalyzing} />
                <DailySuggestions
                  suggestions={suggestions}
                  onToggle={handleSuggestionToggle}
                  onAddNote={handleAddNote}
                  isLoading={isAnalyzing}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
