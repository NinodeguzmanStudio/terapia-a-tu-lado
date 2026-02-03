import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BarChart2, MessageCircle, LogOut, RotateCcw, Settings, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/types/therapy";

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
    handleResetChat: () => void;
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
}: AppSidebarProps) {
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
                            </button>
                        </nav>

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

                        <div className="p-4 border-t border-sidebar-border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Configuración
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tema</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="h-8 w-8 p-0"
                                    >
                                        {theme === "dark" ? (
                                            <Sun className="h-4 w-4" />
                                        ) : (
                                            <Moon className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground hover:text-foreground"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Cerrar sesión
                            </Button>

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

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
}
