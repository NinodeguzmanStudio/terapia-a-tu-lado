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

    // Track the last threshold at which analysis was triggered
    const lastAnalyzedThresholdRef = useRef(0);

    const { toast } = useToast();

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

        // Load today's messages
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
            setUserMessageCount(userMsgCount);
            setConversationsToday(Math.min(Math.floor(userMsgCount / 3), 3));

            // Mark already-analyzed thresholds so we don't re-trigger on reload
            if (userMsgCount >= 3) {
                lastAnalyzedThresholdRef.current = Math.floor(userMsgCount / 3) * 3;
            }
        }

        // Count total user messages across all time
        const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("user_id", uid)
            .eq("role", "user");

        setTotalConversations(count || 0);
        setIsLoadingHistory(false);
    }, []);

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
            id: crypto.randomUUID(),
            role: "user",
            content,
        };

        // Optimistically update user message count BEFORE sending
        const newUserMsgCount = userMessageCount + 1;
        setUserMessageCount(newUserMsgCount);
        setMessages((prev) => [...prev, userMessage]);
        await saveMessage(userMessage);
        setIsLoading(true);

        const chatHistory = [...messages, userMessage].map((m) => ({
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

            // Update conversations-today based on complete 3-message cycles
            setConversationsToday(Math.min(Math.floor(newUserMsgCount / 3), 3));

        } catch (error) {
            console.error("Chat error:", error);
            // Rollback optimistic count on error
            setUserMessageCount((prev) => Math.max(prev - 1, 0));
            setIsLoading(false);
            setIsStreaming(false);
            toast({
                title: "Error de conexión",
                description: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
                variant: "destructive",
            });
        }
    }, [messages, conversationsToday, userMessageCount, toast, userId, userProfile, totalConversations, saveMessage]);

    /**
     * Returns true every time userMessageCount crosses a new multiple of 3
     * (3rd, 6th, 9th user message). Only fires once per threshold.
     */
    const shouldTriggerAnalysis = useCallback((): boolean => {
        if (userMessageCount < 3) return false;
        const currentThreshold = Math.floor(userMessageCount / 3) * 3;
        if (currentThreshold > lastAnalyzedThresholdRef.current) {
            lastAnalyzedThresholdRef.current = currentThreshold;
            return true;
        }
        return false;
    }, [userMessageCount]);

    const resetChat = useCallback(async () => {
        if (!userId) return;
        const today = new Date().toISOString().split('T')[0];
        // FIXED: Only delete TODAY's messages — preserve historical data
        await supabase
            .from("chat_messages")
            .delete()
            .eq("user_id", userId)
            .eq("session_date", today);
        setMessages([]);
        setUserMessageCount(0);
        setConversationsToday(0);
        lastAnalyzedThresholdRef.current = 0;
    }, [userId]);

    return {
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
    };
}
