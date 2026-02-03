import { motion } from "framer-motion";
import { Award, Lock, CheckCircle2, Flame, Star, Crown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
    days: number;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
}

const milestones: Milestone[] = [
    {
        days: 7,
        label: "Semana de Constancia",
        description: "7 días seguidos de reflexión profunda.",
        icon: Star,
        color: "from-amber-400 to-orange-500",
    },
    {
        days: 14,
        label: "Quincena de Bienestar",
        description: "14 días integrando nuevos hábitos.",
        icon: Flame,
        color: "from-orange-500 to-red-600",
    },
    {
        days: 30,
        label: "Mes de Transformación",
        description: "30 días de evolución consciente.",
        icon: Crown,
        color: "from-purple-500 to-blue-600",
    },
];

interface StreakRewardsProps {
    currentStreak: number;
}

export function StreakRewards({ currentStreak }: StreakRewardsProps) {
    return (
        <div className="therapy-card">
            <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Logros por Constancia
            </h3>

            <div className="grid gap-4">
                {milestones.map((milestone, index) => {
                    const isUnlocked = currentStreak >= milestone.days;
                    const progress = Math.min((currentStreak / milestone.days) * 100, 100);
                    const Icon = milestone.icon;

                    return (
                        <motion.div
                            key={milestone.days}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "relative overflow-hidden p-4 rounded-xl border transition-all",
                                isUnlocked
                                    ? "bg-gradient-to-r border-transparent shadow-md"
                                    : "bg-muted/30 border-border"
                            )}
                        >
                            {/* Progress background for locked items */}
                            {!isUnlocked && (
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            )}

                            <div className="flex items-center gap-4 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                    isUnlocked
                                        ? "bg-white/20 text-white"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {isUnlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className={cn(
                                            "font-semibold text-sm",
                                            isUnlocked ? "text-white" : "text-foreground"
                                        )}>
                                            {milestone.label}
                                        </h4>
                                        {isUnlocked && <CheckCircle2 className="h-4 w-4 text-white" />}
                                    </div>
                                    <p className={cn(
                                        "text-xs mt-1",
                                        isUnlocked ? "text-white/80" : "text-muted-foreground"
                                    )}>
                                        {milestone.description}
                                    </p>
                                </div>
                            </div>

                            {/* Gradient background for unlocked items */}
                            {isUnlocked && (
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-r opacity-90 -z-10",
                                    milestone.color
                                )} />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[11px] text-muted-foreground text-center">
                    Tu racha actual es de <span className="font-bold text-primary">{currentStreak} días</span>.
                    ¡Sigue así para desbloquear más logros!
                </p>
            </div>
        </div>
    );
}
