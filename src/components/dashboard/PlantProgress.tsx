import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface PlantProgressProps {
  confirmedSuggestions: number;
  totalSuggestions: number;
  streakDays: number;
  totalSessions: number;
  isLoading?: boolean;
  compact?: boolean;
}

const progressStages = [
  { name: "Semilla", minProgress: 0, description: "El inicio de tu camino" },
  { name: "Brote", minProgress: 15, description: "Algo nuevo está naciendo en ti" },
  { name: "Tallo", minProgress: 35, description: "Creciendo con fuerza interior" },
  { name: "Planta", minProgress: 60, description: "Floreciendo por dentro" },
  { name: "Girasol", minProgress: 85, description: "Tu luz interior brilla" },
];

function calculateProgress(confirmed: number, streak: number, sessions: number): number {
  const suggestionScore = Math.min(confirmed * 4, 40);
  const streakScore = Math.min(streak * 5, 35);
  const sessionScore = Math.min(sessions * 3, 25);
  let progress = Math.min(suggestionScore + streakScore + sessionScore, 100);

  if (streak === 0 && sessions > 0) {
    progress = Math.max(progress * 0.3, 0);
  } else if (streak === 1) {
    progress = Math.max(progress * 0.6, 5);
  }
  return progress;
}

function getCurrentStage(progress: number) {
  let current = progressStages[0];
  for (const s of progressStages) {
    if (progress >= s.minProgress) current = s;
  }
  return current;
}

function PlantSVG({ stage, size = "normal" }: { stage: number; size?: "compact" | "normal" }) {
  const s = size === "compact" ? 0.5 : 1;
  const w = size === "compact" ? 80 : 160;
  const h = size === "compact" ? 70 : 140;

  if (stage === 0)
    return (
      <svg width={w} height={h} viewBox="0 0 160 140" className="mx-auto">
        <defs>
          <radialGradient id="sg0c" cx="50%" cy="75%"><stop offset="0%" stopColor="hsl(25,30%,50%)" stopOpacity=".12" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <linearGradient id="e0c" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(25,25%,35%)" /><stop offset="100%" stopColor="hsl(25,20%,25%)" /></linearGradient>
        </defs>
        <rect x="15" y="90" width="130" height="40" rx="6" fill="url(#e0c)" opacity=".25" />
        <ellipse cx="80" cy="108" rx="14" ry="9" fill="hsl(30,25%,45%)" opacity=".35" />
        <circle cx="80" cy="108" r="30" fill="url(#sg0c)" />
      </svg>
    );

  if (stage === 1)
    return (
      <svg width={w} height={h} viewBox="0 0 160 140" className="mx-auto">
        <defs>
          <linearGradient id="ss1c" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,30%,30%)" /><stop offset="100%" stopColor="hsl(140,35%,50%)" /></linearGradient>
        </defs>
        <rect x="15" y="95" width="130" height="35" rx="6" fill="hsl(25,20%,30%)" opacity=".18" />
        <path d="M80,95 Q78,78 80,58" stroke="url(#ss1c)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M78,72 Q62,60 65,48 Q72,55 78,72Z" fill="hsl(140,35%,45%)" opacity=".7" />
        <path d="M82,64 Q96,52 93,40 Q86,48 82,64Z" fill="hsl(140,40%,50%)" opacity=".65" />
      </svg>
    );

  if (stage === 2)
    return (
      <svg width={w} height={h} viewBox="0 0 160 150" className="mx-auto">
        <defs>
          <linearGradient id="ss2c" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,28%,25%)" /><stop offset="100%" stopColor="hsl(140,32%,42%)" /></linearGradient>
        </defs>
        <rect x="15" y="110" width="130" height="32" rx="5" fill="hsl(25,20%,28%)" opacity=".15" />
        <path d="M80,110 Q78,85 76,55 Q75,38 78,22" stroke="url(#ss2c)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M78,94 Q48,84 44,70 Q58,76 78,94Z" fill="hsl(140,32%,42%)" opacity=".55" />
        <path d="M79,78 Q112,66 118,50 Q102,62 79,78Z" fill="hsl(140,35%,48%)" opacity=".6" />
        <path d="M77,58 Q46,46 42,30 Q56,40 77,58Z" fill="hsl(140,32%,42%)" opacity=".5" />
        <ellipse cx="78" cy="20" rx="5" ry="6.5" fill="hsl(140,35%,45%)" opacity=".5" />
      </svg>
    );

  if (stage === 3)
    return (
      <svg width={w} height={h} viewBox="0 0 180 165" className="mx-auto">
        <defs>
          <linearGradient id="ss3c" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,28%,22%)" /><stop offset="100%" stopColor="hsl(140,30%,35%)" /></linearGradient>
        </defs>
        <rect x="10" y="125" width="160" height="32" rx="5" fill="hsl(25,18%,26%)" opacity=".12" />
        <path d="M90,125 Q88,95 86,65 Q84,45 86,22" stroke="url(#ss3c)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M88,108 Q42,94 30,72 Q52,84 88,108Z" fill="hsl(140,30%,35%)" opacity=".5" />
        <path d="M90,106 Q138,90 152,68 Q128,86 90,106Z" fill="hsl(140,35%,40%)" opacity=".45" />
        <path d="M87,82 Q34,68 22,44 Q48,60 87,82Z" fill="hsl(140,35%,40%)" opacity=".5" />
        <ellipse cx="86" cy="20" rx="9" ry="12" fill="hsl(140,35%,40%)" opacity=".55" />
      </svg>
    );

  // Stage 4: SUNFLOWER
  const petals = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5) * Math.PI / 180, cx = 100, cy = 44, l = 24, ww = 7;
    const tx = cx + Math.cos(a) * l, ty = cy + Math.sin(a) * l;
    const c1x = cx + Math.cos(a - .3) * l * .6 + Math.cos(a + Math.PI / 2) * ww;
    const c1y = cy + Math.sin(a - .3) * l * .6 + Math.sin(a + Math.PI / 2) * ww;
    const c2x = cx + Math.cos(a + .3) * l * .6 - Math.cos(a + Math.PI / 2) * ww;
    const c2y = cy + Math.sin(a + .3) * l * .6 - Math.sin(a + Math.PI / 2) * ww;
    const c = ["hsl(38,65%,55%)", "hsl(35,60%,50%)", "hsl(30,55%,48%)"][i % 3];
    return <path key={`o${i}`} d={`M${cx},${cy} Q${c1x},${c1y} ${tx},${ty} Q${c2x},${c2y} ${cx},${cy}Z`} fill={c} opacity={.55 + (i % 2) * .15} />;
  });

  return (
    <svg width={w} height={h} viewBox="0 0 200 190" className="mx-auto">
      <defs>
        <linearGradient id="ss4c" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,28%,22%)" /><stop offset="100%" stopColor="hsl(140,30%,32%)" /></linearGradient>
        <radialGradient id="sc4c" cx="50%" cy="50%"><stop offset="0%" stopColor="hsl(25,40%,22%)" /><stop offset="100%" stopColor="hsl(25,35%,18%)" /></radialGradient>
      </defs>
      <rect x="10" y="155" width="180" height="28" rx="5" fill="hsl(25,18%,24%)" opacity=".1" />
      <path d="M100,155 Q98,125 96,90 Q94,70 96,52" stroke="url(#ss4c)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M98,140 Q50,124 35,98 Q60,114 98,140Z" fill="hsl(140,28%,32%)" opacity=".45" />
      <path d="M100,138 Q150,120 165,92 Q138,112 100,138Z" fill="hsl(140,30%,35%)" opacity=".4" />
      {petals}
      <circle cx="100" cy="44" r="12" fill="url(#sc4c)" />
    </svg>
  );
}

// Compact version for corner placement
function CompactPlant({ confirmedSuggestions, totalSuggestions, streakDays, totalSessions }: Omit<PlantProgressProps, "isLoading" | "compact">) {
  const [expanded, setExpanded] = useState(false);
  const progress = calculateProgress(confirmedSuggestions, streakDays, totalSessions);
  const currentStage = getCurrentStage(progress);
  const stageIndex = progressStages.findIndex((s) => s.name === currentStage.name);

  return (
    <motion.div
      layout
      className={cn(
        "bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-elevated transition-all cursor-pointer overflow-hidden",
        expanded ? "w-56" : "w-16 h-16"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Tu planta</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
          <PlantSVG stage={stageIndex} size="compact" />
          <div className="text-center mt-1">
            <p className="text-sm font-serif">{currentStage.name}</p>
            <p className="text-[10px] text-muted-foreground">{currentStage.description}</p>
          </div>
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-warm rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 text-center">{Math.round(progress)}% completado</p>
          </div>
        </motion.div>
      ) : (
        <div className="w-16 h-16 flex items-center justify-center relative">
          <PlantSVG stage={stageIndex} size="compact" />
          {/* Mini progress ring */}
          <svg className="absolute inset-0" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="2"
              strokeDasharray={`${progress * 1.76} ${176 - progress * 1.76}`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              opacity="0.6"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

// Full version for when not compact
function FullPlant({ confirmedSuggestions, totalSuggestions, streakDays, totalSessions, isLoading }: Omit<PlantProgressProps, "compact">) {
  const progress = calculateProgress(confirmedSuggestions, streakDays, totalSessions);
  const currentStage = getCurrentStage(progress);
  const stageIndex = progressStages.findIndex((s) => s.name === currentStage.name);
  const nextStage = progressStages[Math.min(stageIndex + 1, progressStages.length - 1)];
  const isMaxStage = currentStage.name === nextStage.name;
  const progressToNext = isMaxStage ? 100 : ((progress - currentStage.minProgress) / (nextStage.minProgress - currentStage.minProgress)) * 100;

  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Tu crecimiento</h3>
        <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-xl" /><div className="h-4 bg-muted rounded w-3/4" /></div>
      </div>
    );
  }

  return (
    <div className="therapy-card lg:col-span-2">
      <div className="mb-4">
        <h3 className="text-xl font-serif mb-1">Tu crecimiento</h3>
        <p className="text-sm text-muted-foreground">Completa tus pasos y mantén tu racha para ver florecer tu planta.</p>
      </div>

      <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }} className="flex flex-col items-center py-4">
        <PlantSVG stage={stageIndex} />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }} className="text-lg font-serif mt-3">{currentStage.name}</motion.p>
        <p className="text-xs text-muted-foreground mt-0.5">{currentStage.description}</p>
      </motion.div>

      <div className="p-4 bg-muted/30 rounded-lg mt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pasos completados</span>
          <span className="font-medium">{confirmedSuggestions}/{totalSuggestions}</span>
        </div>
        {streakDays > 0 && <div className="flex items-center justify-between text-sm mt-2"><span className="text-muted-foreground">Días de constancia</span><span className="font-medium">{streakDays}</span></div>}
        {totalSessions > 0 && <div className="flex items-center justify-between text-sm mt-2"><span className="text-muted-foreground">Sesiones completadas</span><span className="font-medium">{totalSessions}</span></div>}
      </div>

      {!isMaxStage && stageIndex > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Hacia: {nextStage.name}</span>
            <span className="font-medium">{Math.round(progressToNext)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-warm rounded-full" initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 1, delay: .3 }} />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-5 px-4">
        {progressStages.map((stage, index) => {
          const isPast = progress >= stage.minProgress;
          const isCurrent = stage.name === currentStage.name;
          return (
            <motion.div key={stage.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * .08 }} className="flex flex-col items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded-full transition-all", isCurrent ? "bg-primary scale-125 ring-2 ring-primary/20" : isPast ? "bg-primary/50" : "bg-muted")} />
              <span className={cn("text-[9px]", isCurrent ? "text-foreground font-medium" : "text-muted-foreground/50")}>{stage.name}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function PlantProgress(props: PlantProgressProps) {
  if (props.compact) {
    return (
      <CompactPlant
        confirmedSuggestions={props.confirmedSuggestions}
        totalSuggestions={props.totalSuggestions}
        streakDays={props.streakDays}
        totalSessions={props.totalSessions}
      />
    );
  }
  return <FullPlant {...props} />;
}
