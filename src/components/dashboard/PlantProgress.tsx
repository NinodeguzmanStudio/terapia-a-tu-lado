import { motion } from "framer-motion";
import { Circle, Compass, Layers, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlantProgressProps {
  confirmedSuggestions: number;
  totalSuggestions: number;
  streakDays: number;
  totalSessions: number;
  isLoading?: boolean;
}

const progressStages = [
  { 
    name: "Inicio", 
    icon: Circle, 
    minProgress: 0, 
    description: "Observando tu proceso",
    color: "from-muted to-muted/80",
    visualElement: "○"
  },
  { 
    name: "Exploración", 
    icon: Compass, 
    minProgress: 15, 
    description: "Conociendo tus patrones",
    color: "from-sage-light/50 to-sage-light",
    visualElement: "◎"
  },
  { 
    name: "Claridad", 
    icon: Layers, 
    minProgress: 35, 
    description: "Integrando comprensiones",
    color: "from-sage-light to-sage",
    visualElement: "◉"
  },
  { 
    name: "Integración", 
    icon: Target, 
    minProgress: 60, 
    description: "Consolidando cambios",
    color: "from-terracotta-light to-terracotta",
    visualElement: "●"
  },
  { 
    name: "Transformación", 
    icon: Sparkles, 
    minProgress: 85, 
    description: "Evolución visible",
    color: "from-terracotta to-earth",
    visualElement: "✦"
  },
];

function calculateProgress(
  confirmedSuggestions: number,
  streakDays: number,
  totalSessions: number
): number {
  const suggestionScore = Math.min(confirmedSuggestions * 5, 50);
  const streakScore = Math.min(streakDays * 6, 30);
  const sessionScore = Math.min(totalSessions * 4, 20);
  
  return Math.min(suggestionScore + streakScore + sessionScore, 100);
}

function getCurrentStage(progress: number) {
  let currentStage = progressStages[0];
  for (const stage of progressStages) {
    if (progress >= stage.minProgress) {
      currentStage = stage;
    }
  }
  return currentStage;
}

function getNextStage(currentStage: typeof progressStages[0]) {
  const currentIndex = progressStages.findIndex(s => s.name === currentStage.name);
  return progressStages[Math.min(currentIndex + 1, progressStages.length - 1)];
}

export function PlantProgress({ 
  confirmedSuggestions, 
  totalSuggestions, 
  streakDays, 
  totalSessions,
  isLoading 
}: PlantProgressProps) {
  const progress = calculateProgress(confirmedSuggestions, streakDays, totalSessions);
  const currentStage = getCurrentStage(progress);
  const nextStage = getNextStage(currentStage);
  const isMaxStage = currentStage.name === nextStage.name;
  
  const progressToNext = isMaxStage 
    ? 100 
    : ((progress - currentStage.minProgress) / (nextStage.minProgress - currentStage.minProgress)) * 100;

  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Estado de tu proceso</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  const StageIcon = currentStage.icon;
  const isInitialStage = currentStage.name === "Inicio";

  return (
    <div className="therapy-card">
      {/* 1. Informative message first */}
      <div className="mb-6">
        <h3 className="text-xl font-serif mb-2">Estado de tu proceso</h3>
        <p className="text-sm text-muted-foreground">
          Revisa tu progreso para observar cómo te estás sintiendo ahora.
        </p>
      </div>

      {/* 2. Patterns and suggestions info */}
      <div className="p-4 bg-muted/30 rounded-lg mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Reflexiones confirmadas</span>
          <span className="font-medium">{confirmedSuggestions}</span>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Días de constancia</span>
            <span className="font-medium">{streakDays}</span>
          </div>
        )}
        {totalSessions > 0 && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Sesiones completadas</span>
            <span className="font-medium">{totalSessions}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isInitialStage && !isMaxStage && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Hacia: {nextStage.name}</span>
            <span className="font-medium">{Math.round(progressToNext)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-warm rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* 3. Visual reference - secondary, at the end */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "relative p-4 rounded-xl overflow-hidden bg-gradient-to-br",
          currentStage.color
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isInitialStage ? "bg-muted/50" : "bg-white/20"
          )}>
            <StageIcon className={cn(
              "h-5 w-5",
              isInitialStage ? "text-muted-foreground" : "text-foreground/80"
            )} />
          </div>
          <div>
            <p className="text-sm font-medium">{currentStage.name}</p>
            <p className="text-xs opacity-70">{currentStage.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Stage indicators - discrete */}
      <div className="flex justify-between items-center mt-4 px-2">
        {progressStages.map((stage, index) => {
          const isPast = progress >= stage.minProgress;
          const isCurrent = stage.name === currentStage.name;
          const Icon = stage.icon;
          
          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex flex-col items-center gap-1",
                isCurrent ? "text-foreground" : isPast ? "text-primary/70" : "text-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                isCurrent ? "bg-primary/20" : isPast ? "bg-primary/10" : "bg-muted/50"
              )}>
                <Icon className="h-3 w-3" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
