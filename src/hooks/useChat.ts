import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message, UserProfile } from "@/types/therapy";
import { useToast } from "@/hooks/use-toast";

export function useChat(userId: string | null, userProfile: UserProfile | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversationsToday, setConversationsToday] = useState(0);
    const [userMessageCount, setUserMessageCount] = useState(0);
    const [totalConversations, setTotalConversations] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const lastAnalyzedCountRef = useRef(0);
    const { toast } = useToast();

    const isModerator = userProfile?.is_moderator ?? false;

    const saveMessage = useCallback(async (message: Message) => {
        if (!userId) return;
        const today = new Date().toISOString().split('T')[0];
        await supabase.from("chat_messages").insert({
            id: message.id,
            user_id: userId,
            content: message.content,
            role: message.role,
            session_date: today
        });
    }, [userId]);

    const loadChatHistory = useCallback(async (uid: string) => {
        setIsLoadingHistory(true);
        const today = new Date().toISOString().split('T')[0];

        const { data: chatMessages } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("user_id", uid)
            .eq("session_date", today)
            .order("created_at", { ascending: true });

        if (chatMessages && chatMessages.length > 0) {
            setMessages(chatMessages.map(m => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
            })));

            const userMsgCount = chatMessages.filter(m => m.role === "user").length;
            const assistantMsgCount = chatMessages.filter(
                m => m.role === "assistant" && m.content.trim().length > 0
            ).length;

            setUserMessageCount(userMsgCount);

            // Count conversations as complete exchanges (user + assistant)
            const exchanges = Math.min(userMsgCount, assistantMsgCount);
            setConversationsToday(Math.min(Math.floor(exchanges / 3), 3));

            // Track last analyzed threshold
            if (userMsgCount >= 2) {
                lastAnalyzedCountRef.current = Math.floor(userMsgCount / 2) * 2;
            }
        }

        const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("user_id", uid)
            .eq("role", "user");

        setTotalConversations(count || 0);
        setIsLoadingHistory(false);
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!isModerator && conversationsToday >= 3) {
            toast({
                title: "Límite diario alcanzado",
                description: "Has llegado a tu límite de 3 conversaciones hoy. Vuelve mañana para continuar.",
                variant: "destructive",
            });
            return;
        }

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content,
        };

        const newUserMsgCount = userMessageCount + 1;
        setUserMessageCount(newUserMsgCount);
        setMessages((prev) => [...prev, userMessage]);
        await saveMessage(userMessage);
        setIsLoading(true);

        // Only send last 10 messages to avoid timeouts
        const recentMessages = [...messages, userMessage].slice(-10);
        const chatHistory = recentMessages.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        const userContext = userProfile?.name
            ? `[Contexto: El usuario se llama ${userProfile.name}${userProfile.age ? `, tiene ${userProfile.age} años` : ''}. Total de conversaciones previas: ${totalConversations}]`
            : '';

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

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
                throw new Error(`${errorData.error || "Error"}: ${JSON.stringify(errorData.detail) || ""}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No se pudo iniciar la lectura");

            setIsLoading(false);
            setIsStreaming(true);

            let assistantContent = "";
            const decoder = new TextDecoder();
            let buffer = "";

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
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

            await saveMessage({ ...assistantMessage, content: assistantContent });
            setIsStreaming(false);
            setTotalConversations((prev) => prev + 1);

            if (!isModerator) {
                // Count real exchanges for conversation limit
                const allMessages = [...messages, userMessage, { ...assistantMessage, content: assistantContent }];
                const uCount = allMessages.filter(m => m.role === "user").length;
                const aCount = allMessages.filter(m => m.role === "assistant" && m.content.trim().length > 0).length;
                const exchanges = Math.min(uCount, aCount);
                setConversationsToday(Math.min(Math.floor(exchanges / 3), 3));
            }

        } catch (error) {
            console.error("Chat error:", error);
            setUserMessageCount((prev) => Math.max(prev - 1, 0));
            setIsLoading(false);
            setIsStreaming(false);
            toast({
                title: "Error de conexión",
                description: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
                variant: "destructive",
            });
        }
    }, [messages, conversationsToday, userMessageCount, toast, userId, userProfile, totalConversations, saveMessage, isModerator]);

    // Trigger analysis after every 2 user messages (2 complete exchanges)
    const shouldTriggerAnalysis = useCallback((): boolean => {
        if (userMessageCount < 2) return false;

        // Check there are real assistant responses
        const assistantResponses = messages.filter(
            m => m.role === "assistant" && m.content.trim().length > 0
        ).length;
        if (assistantResponses < 1) return false;

        const currentThreshold = Math.floor(userMessageCount / 2) * 2;
        if (currentThreshold > lastAnalyzedCountRef.current) {
            lastAnalyzedCountRef.current = currentThreshold;
            return true;
        }
        return false;
    }, [userMessageCount, messages]);

    const resetChat = useCallback(async () => {
        if (!userId) return;
        const today = new Date().toISOString().split('T')[0];
        await supabase
            .from("chat_messages")
            .delete()
            .eq("user_id", userId)
            .eq("session_date", today);
        setMessages([]);
        setUserMessageCount(0);
        setConversationsToday(0);
        lastAnalyzedCountRef.current = 0;
    }, [userId]);

    const fullReset = useCallback(async () => {
        if (!userId) return;
        await supabase.from("chat_messages").delete().eq("user_id", userId);
        await supabase.from("emotional_analysis").delete().eq("user_id", userId);
        await supabase.from("daily_suggestions").delete().eq("user_id", userId);
        await supabase.from("user_achievements").delete().eq("user_id", userId);
        await supabase.from("profiles").update({ streak_days: 0, total_sessions: 0 }).eq("user_id", userId);

        setMessages([]);
        setUserMessageCount(0);
        setConversationsToday(0);
        setTotalConversations(0);
        lastAnalyzedCountRef.current = 0;
    }, [userId]);

    return {
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
    };
}
