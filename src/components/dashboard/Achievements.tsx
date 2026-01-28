import { motion } from "framer-motion";
import { Trophy, Star, Flame, Heart, Zap, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  type: string;
  name: string;
  icon: string;
  earnedAt: Date;
  level: number;
  progressPercentage: number;
}

interface AchievementsProps {
  achievements: Achievement[];
  currentLevel: number;
  totalProgress: number;
  streak: number;
  isLoading?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  heart: Heart,
  zap: Zap,
  award: Award,
};

const levelConfig = [
  { name: "Semilla", minProgress: 0, color: "from-sand to-cream" },
  { name: "Brote", minProgress: 20, color: "from-sage-light to-sage" },
  { name: "Raíz", minProgress: 40, color: "from-terracotta-light to-terracotta" },
  { name: "Árbol", minProgress: 60, color: "from-sage to-sage-dark" },
  { name: "Bosque", minProgress: 80, color: "from-terracotta to-earth" },
];

export function Achievements({ achievements, currentLevel, totalProgress, streak, isLoading }: AchievementsProps) {
  const currentLevelConfig = levelConfig[Math.min(currentLevel - 1, levelConfig.length - 1)];
  const nextLevelConfig = levelConfig[Math.min(currentLevel, levelConfig.length - 1)];
  const progressToNext = ((totalProgress - currentLevelConfig.minProgress) / 
    (nextLevelConfig.minProgress - currentLevelConfig.minProgress)) * 100;

  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Logros</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="therapy-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif">Logros</h3>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-terracotta/10 rounded-full">
            <Flame className="h-4 w-4 text-terracotta" />
            <span className="text-sm font-medium text-terracotta">{streak} días</span>
          </div>
        )}
      </div>

      {/* Level progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "relative p-6 rounded-xl mb-6 overflow-hidden bg-gradient-to-br",
          currentLevelConfig.color
        )}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Nivel actual</p>
              <h4 className="text-2xl font-serif">{currentLevelConfig.name}</h4>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider opacity-80">Siguiente</p>
              <p className="font-medium">{nextLevelConfig.name}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{totalProgress}% completado</span>
              <span>{nextLevelConfig.minProgress}%</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-white/5" />
      </motion.div>

      {/* Badges */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Insignias ganadas</h4>
        {achievements.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {achievements.map((achievement, index) => {
              const Icon = iconMap[achievement.icon] || Award;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                  className="group relative"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-warm flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <span className="text-xs bg-foreground text-background px-2 py-1 rounded">
                      {achievement.name}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Completa sesiones para ganar insignias
          </p>
        )}
      </div>
    </div>
  );
}
