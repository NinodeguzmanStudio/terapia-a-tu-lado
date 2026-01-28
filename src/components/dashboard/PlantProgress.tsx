import { motion } from "framer-motion";
import { Sprout, Leaf, TreeDeciduous, Flower2, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlantProgressProps {
  confirmedSuggestions: number;
  totalSuggestions: number;
  streakDays: number;
  totalSessions: number;
  isLoading?: boolean;
}

const plantStages = [
  { 
    name: "Semilla", 
    icon: Sun, 
    minProgress: 0, 
    description: "Tu viaje acaba de empezar",
    color: "from-sand to-cream",
    plantImage: "🌱"
  },
  { 
    name: "Brote", 
    icon: Sprout, 
    minProgress: 15, 
    description: "Estás echando raíces",
    color: "from-sage-light to-sage",
    plantImage: "🌿"
  },
  { 
    name: "Tallo con hojas", 
    icon: Leaf, 
    minProgress: 35, 
    description: "Tu crecimiento es visible",
    color: "from-sage to-sage-dark",
    plantImage: "🪴"
  },
  { 
    name: "Crecimiento", 
    icon: TreeDeciduous, 
    minProgress: 60, 
    description: "Estás floreciendo",
    color: "from-terracotta-light to-terracotta",
    plantImage: "🌳"
  },
  { 
    name: "Pronto a florecer", 
    icon: Flower2, 
    minProgress: 85, 
    description: "Tu transformación brilla",
    color: "from-terracotta to-earth",
    plantImage: "🌸"
  },
];

function calculateProgress(
  confirmedSuggestions: number,
  streakDays: number,
  totalSessions: number
): number {
  // Weight: 50% confirmed suggestions, 30% streak, 20% sessions
  const suggestionScore = Math.min(confirmedSuggestions * 5, 50);
  const streakScore = Math.min(streakDays * 6, 30);
  const sessionScore = Math.min(totalSessions * 4, 20);
  
  return Math.min(suggestionScore + streakScore + sessionScore, 100);
}

function getCurrentStage(progress: number) {
  let currentStage = plantStages[0];
  for (const stage of plantStages) {
    if (progress >= stage.minProgress) {
      currentStage = stage;
    }
  }
  return currentStage;
}

function getNextStage(currentStage: typeof plantStages[0]) {
  const currentIndex = plantStages.findIndex(s => s.name === currentStage.name);
  return plantStages[Math.min(currentIndex + 1, plantStages.length - 1)];
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
        <h3 className="text-xl font-serif mb-4">Tu Planta de Crecimiento</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  const StageIcon = currentStage.icon;

  return (
    <div className="therapy-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif">Tu Planta de Crecimiento</h3>
        <div className="text-sm text-muted-foreground">
          {confirmedSuggestions} confirmadas
        </div>
      </div>

      {/* Plant visualization */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "relative p-8 rounded-xl mb-6 overflow-hidden bg-gradient-to-br text-center",
          currentStage.color
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-7xl mb-4"
        >
          {currentStage.plantImage}
        </motion.div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <StageIcon className="h-5 w-5" />
            <h4 className="text-2xl font-serif">{currentStage.name}</h4>
          </div>
          <p className="text-sm opacity-80">{currentStage.description}</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
      </motion.div>

      {/* Progress to next stage */}
      {!isMaxStage && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso hacia {nextStage.name}</span>
            <span className="font-medium">{Math.round(progressToNext)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-warm rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Stage indicators */}
      <div className="flex justify-between items-center">
        {plantStages.map((stage, index) => {
          const isPast = progress >= stage.minProgress;
          const isCurrent = stage.name === currentStage.name;
          const Icon = stage.icon;
          
          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex flex-col items-center gap-1",
                isCurrent ? "text-foreground" : isPast ? "text-primary" : "text-muted-foreground/40"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isCurrent ? "bg-gradient-warm shadow-soft" : isPast ? "bg-primary/20" : "bg-muted"
              )}>
                <Icon className={cn("h-4 w-4", isCurrent && "text-white")} />
              </div>
              <span className="text-[10px] text-center max-w-[50px] leading-tight">
                {stage.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Growth tips */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          💡 Tu planta crece con sugerencias confirmadas, constancia y reflexión genuina
        </p>
      </div>
    </div>
  );
}
