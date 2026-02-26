import { useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Message } from "@/types/therapy";
import { WeatherBackground, analyzeMessageMood } from "@/components/WeatherBackground";

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
    isModerator?: boolean;
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
    isModerator = false,
}: ChatSectionProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Analyze mood from messages → determine weather automatically
    const currentWeather = useMemo(() => {
        return analyzeMessageMood(messages);
    }, [messages]);

    const isLimitReached = !isModerator && conversationsToday >= 3;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header - always on top */}
            <header className="px-4 lg:px-8 py-4 border-b border-border bg-card/80 backdrop-blur-sm relative z-20">
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

            {/* Chat area: relative container with weather behind + scrollable messages on top */}
            <div className="flex-1 relative overflow-hidden">
                {/* Weather — absolute, fills container, behind everything */}
                <div className="absolute inset-0 z-0">
                    <WeatherBackground weather={currentWeather} />
                </div>

                {/* Scrollable messages — on top of weather */}
                <div className="absolute inset-0 z-10 overflow-y-auto px-4 lg:px-8 py-6">
                    <div className="max-w-3xl mx-auto">
                        {isLoadingHistory ? (
                            <div className="text-center py-12">
                                <div className="animate-pulse text-muted-foreground">
                                    Cargando tu historial...
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-20 lg:py-32">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="inline-flex flex-col items-center"
                                >
                                    <div className="w-24 h-24 rounded-full bg-gradient-warm flex items-center justify-center mb-8 shadow-glow animate-pulse-soft">
                                        <Sparkles className="h-12 w-12 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-serif mb-4 text-foreground">
                                        {welcomeMessage.trim() || "Bienvenido/a"}
                                    </h3>
                                    <div className="h-px w-12 bg-primary/30 mb-6" />
                                    <p className="text-muted-foreground max-w-sm leading-relaxed text-balance text-center">
                                        Este es tu espacio seguro y privado. Cuéntame, ¿qué tienes en mente hoy?
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
                                        className="mt-4 p-4 bg-card/70 backdrop-blur-sm rounded-xl text-center border border-border/50"
                                    >
                                        <p className="text-sm text-muted-foreground">
                                            Has tenido varias conversaciones profundas.
                                            <button
                                                onClick={() => setActiveTab("stats")}
                                                className="text-primary hover:underline ml-1"
                                            >
                                                Revisa tu progreso
                                            </button>
                                            {" "}para ver tus pasos de crecimiento y cómo florece tu planta.
                                        </p>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {isLoading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input - always on bottom */}
            <div className="max-w-3xl mx-auto w-full px-4 lg:px-0 relative z-20">
                <ChatInput
                    onSend={sendMessage}
                    isLoading={isLoading || isStreaming}
                    disabled={isLimitReached}
                    placeholder={
                        isLimitReached
                            ? "Límite diario alcanzado. Vuelve mañana."
                            : "Escribe cómo te sientes..."
                    }
                />
            </div>
        </div>
    );
}
