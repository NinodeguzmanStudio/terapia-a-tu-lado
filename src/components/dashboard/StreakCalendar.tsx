import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakCalendarProps {
    activeDates: Date[];
    isLoading?: boolean;
}

export function StreakCalendar({ activeDates, isLoading }: StreakCalendarProps) {
    // Convert activeDates to a set of ISO strings (YYYY-MM-DD) for easy comparison
    const activeDateStrings = new Set(
        activeDates.map(d => d.toISOString().split('T')[0])
    );

    return (
        <div className="therapy-card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Calendario de Actividad
                </h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">Los días resaltados indican que tuviste una sesión de reflexión.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex justify-center bg-background/50 rounded-xl p-4">
                {isLoading ? (
                    <div className="h-[300px] w-full animate-pulse bg-muted rounded-lg" />
                ) : (
                    <Calendar
                        mode="multiple"
                        selected={activeDates}
                        className="rounded-md border-none"
                        modifiers={{
                            active: (date) => activeDateStrings.has(date.toISOString().split('T')[0]),
                        }}
                        modifiersStyles={{
                            active: {
                                backgroundColor: "hsl(var(--primary))",
                                color: "hsl(var(--primary-foreground))",
                                fontWeight: "bold",
                                borderRadius: "50%",
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
