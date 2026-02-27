import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BarChart2, MessageCircle, LogOut, Settings, Moon, Sun, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserProfile, EmotionData, Suggestion } from "@/types/therapy";
import { ProfileSettings } from "./ProfileSettings";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeTab: "chat" | "stats";
    setActiveTab: (tab: "chat" | "stats") => void;
    conversationsToday: number;
    userProfile: UserProfile | null;
    theme: string | undefined;
    setTheme: (theme: string) => void;
    handleLogout: () => void;
    handleResetChat: () => Promise<void>;
    updateProfile: (updates: { name?: string; age?: number }) => Promise<{ error: any }>;
    deleteAccount: () => Promise<{ error: any }>;
    emotionData?: EmotionData | null;
    suggestions?: Suggestion[];
}

export function AppSidebar({
    sidebarOpen,
    setSidebarOpen,
    activeTab,
    setActiveTab,
    conversationsToday,
    userProfile,
    theme,
    setTheme,
    handleLogout,
    handleResetChat,
    updateProfile,
    deleteAccount,
    emotionData,
    suggestions = [],
}: AppSidebarProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const isModerator = userProfile?.is_moderator ?? false;

    // Calculate mini progress for sidebar
    const completedSteps = suggestions.filter(s => s.isCompleted).length;
    const totalSteps = suggestions.length;
    const dominantEmotion = emotionData
        ? Object.entries({
            Ansiedad: emotionData.anxiety,
            Enojo: emotionData.anger,
            Tristeza: emotionData.sadness,
            Estabilidad: emotionData.stability,
            Alegría: emotionData.joy,
        }).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])
        : null;

    return (
        <>
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card rounded-lg shadow-soft"
            >
                <Menu className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {(sidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        className={cn(
                            "fixed lg:relative z-40 w-[280px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col",
                            sidebarOpen ? "block" : "hidden lg:flex"
                        )}
                    >
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
                                {/* Mini progress indicator */}
                                {(emotionData || totalSteps > 0) && (
                                    <div className="ml-auto flex items-center gap-1">
                                        {totalSteps > 0 && (
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                                completedSteps === totalSteps && totalSteps > 0
                                                    ? "bg-green-500/20 text-green-600"
                                                    : "bg-primary/15 text-primary"
                                            )}>
                                                {completedSteps}/{totalSteps}
                                            </span>
                                        )}
                                        {!emotionData && !totalSteps && (
                                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
                                        )}
                                    </div>
                                )}
                            </button>

                            {/* Quick emotion summary */}
                            {emotionData && dominantEmotion && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mx-2 mt-3 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-[11px] font-medium text-sidebar-foreground">Estado actual</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {dominantEmotion[0]} dominante ({dominantEmotion[1]}%)
                                    </p>
                                    {totalSteps > 0 && completedSteps < totalSteps && (
                                        <p className="text-[10px] text-primary mt-1">
                                            {totalSteps - completedSteps} paso{totalSteps - completedSteps > 1 ? 's' : ''} pendiente{totalSteps - completedSteps > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </nav>

                        <div className="p-4 border-t border-sidebar-border">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Conversaciones hoy</span>
                                <span className="font-medium">
                                    {isModerator ? `${conversationsToday} ∞` : `${conversationsToday}/3`}
                                </span>
                            </div>
                            {!isModerator && (
                                <div className="progress-track mt-2">
                                    <div
                                        className="progress-fill bg-gradient-warm"
                                        style={{ width: `${(conversationsToday / 3) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-auto p-4 border-t border-sidebar-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-medium text-xs">
                                    {userProfile?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                                        {userProfile?.name || "Usuario"}
                                    </span>
                                    {isModerator && (
                                        <span className="text-[10px] text-orange-500 font-medium">
                                            Desarrollador
                                        </span>
                                    )}
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground">
                                        <Settings className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Configuración</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                        {theme === "dark" ? (
                                            <>
                                                <Sun className="mr-2 h-4 w-4" />
                                                <span>Modo Claro</span>
                                            </>
                                        ) : (
                                            <>
                                                <Moon className="mr-2 h-4 w-4" />
                                                <span>Modo Oscuro</span>
                                            </>
                                        )}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <ProfileSettings
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                userProfile={userProfile}
                onUpdate={updateProfile}
                onDelete={deleteAccount}
                onFullReset={isModerator ? handleResetChat : undefined}
            />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
}
