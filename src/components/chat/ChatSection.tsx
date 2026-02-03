import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Message } from "@/types/therapy";

interface ChatSectionProps {
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    isLoadingHistory: boolean;
    conversationsToday: number;
    totalConversations: number;
    welcomeMessage: string;
    sendMessage: (content: string) => void;
    setActiveTab: (tab: "chat" | "stats") => void;
}

export function ChatSection({
    messages,
    isLoading,
    isStreaming,
    isLoadingHistory,
    conversationsToday,
    totalConversations,
    welcomeMessage,
    sendMessage,
    setActiveTab,
}: ChatSectionProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col min-h-0">
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

            <div className="max-w-3xl mx-auto w-full px-4 lg:px-0">
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
        </div>
    );
}
