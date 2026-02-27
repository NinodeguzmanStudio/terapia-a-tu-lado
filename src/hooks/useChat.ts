import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message, UserProfile } from "@/types/therapy";
import { useToast } from "@/hooks/use-toast";
import { callGemini } from "@/lib/gemini";

export function useChat(userId: string | null, userProfile: UserProfile | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversationsToday, setConversationsToday] = useState(0);
    const [userMessageCount, setUserMessageCount] = useState(0);
    const [totalConversations, setTotalConversations] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const lastAnalyzedCountRef = useRef(0);
    const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
            const exchanges = Math.min(userMsgCount, assistantMsgCount);
            setConversationsToday(Math.min(Math.floor(exchanges / 3), 3));

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

        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
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

        const recentMessages = [...messages, userMessage].slice(-10);
        const chatHistory = recentMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

        const userContext = userProfile?.name
            ? `[Contexto: El usuario se llama ${userProfile.name}${userProfile.age ? `, tiene ${userProfile.age} años` : ''}. Total de conversaciones previas: ${totalConversations}]`
            : '';

        try {
            // Llama a /api/therapy-chat (Vercel serverless)
            // La API key está segura en el servidor
            const fullContent = await callGemini(
                chatHistory,
                "chat",
                userContext,
                totalConversations
            );

            setIsLoading(false);
            setIsStreaming(true);

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Typing animation
            await new Promise<void>((resolve) => {
                let charIndex = 0;
                const charsPerTick = 3;
                const intervalMs = 20;

                typingIntervalRef.current = setInterval(() => {
                    charIndex = Math.min(charIndex + charsPerTick, fullContent.length);
                    const partial = fullContent.slice(0, charIndex);

                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessage.id
                                ? { ...m, content: partial }
                                : m
                        )
                    );

                    if (charIndex >= fullContent.length) {
                        if (typingIntervalRef.current) {
                            clearInterval(typingIntervalRef.current);
                            typingIntervalRef.current = null;
                        }
                        resolve();
                    }
                }, intervalMs);
            });

            await saveMessage({ ...assistantMessage, content: fullContent });
            setIsStreaming(false);
            setTotalConversations((prev) => prev + 1);

            if (!isModerator) {
                const allMessages = [...messages, userMessage, { ...assistantMessage, content: fullContent }];
                const uCount = allMessages.filter(m => m.role === "user").length;
                const aCount = allMessages.filter(m => m.role === "assistant" && m.content.trim().length > 0).length;
                const exchanges = Math.min(uCount, aCount);
                setConversationsToday(Math.min(Math.floor(exchanges / 3), 3));
            }

        } catch (error) {
            console.error("Chat error:", error);
            setUserMessageCount((prev) => Math.max(prev - 1, 0));
            toast({
                title: "Error de conexión",
                description: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
            }
        }
    }, [messages, conversationsToday, userMessageCount, toast, userId, userProfile, totalConversations, saveMessage, isModerator]);

    const shouldTriggerAnalysis = useCallback((): boolean => {
        if (userMessageCount < 2) return false;
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
