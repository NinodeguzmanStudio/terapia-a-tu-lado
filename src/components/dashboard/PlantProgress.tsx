import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PlantProgressProps {
  confirmedSuggestions: number;
  totalSuggestions: number;
  streakDays: number;
  totalSessions: number;
  isLoading?: boolean;
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

  // Regression: no streak → plant quietly returns toward seed
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

function getNextStage(current: (typeof progressStages)[0]) {
  const i = progressStages.findIndex((s) => s.name === current.name);
  return progressStages[Math.min(i + 1, progressStages.length - 1)];
}

function PlantSVG({ stage }: { stage: number }) {
  if (stage === 0)
    return (
      <svg width="160" height="140" viewBox="0 0 160 140" className="mx-auto">
        <defs>
          <radialGradient id="sg0" cx="50%" cy="75%"><stop offset="0%" stopColor="hsl(25,30%,50%)" stopOpacity=".12" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <linearGradient id="e0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(25,25%,35%)" /><stop offset="100%" stopColor="hsl(25,20%,25%)" /></linearGradient>
        </defs>
        <rect x="15" y="90" width="130" height="40" rx="6" fill="url(#e0)" opacity=".25" />
        <ellipse cx="80" cy="90" rx="60" ry="5" fill="hsl(25,20%,30%)" opacity=".12" />
        <ellipse cx="80" cy="108" rx="14" ry="9" fill="hsl(30,25%,45%)" opacity=".35" transform="rotate(-12,80,108)" />
        <ellipse cx="80" cy="108" rx="10" ry="6.5" fill="hsl(30,30%,55%)" opacity=".25" transform="rotate(-12,80,108)" />
        <line x1="76" y1="105" x2="83" y2="112" stroke="hsl(25,20%,40%)" strokeWidth=".8" opacity=".2" />
        <circle cx="80" cy="108" r="30" fill="url(#sg0)" />
      </svg>
    );

  if (stage === 1)
    return (
      <svg width="160" height="140" viewBox="0 0 160 140" className="mx-auto">
        <defs>
          <linearGradient id="ss1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,30%,30%)" /><stop offset="100%" stopColor="hsl(140,35%,50%)" /></linearGradient>
          <radialGradient id="sg1" cx="50%" cy="50%"><stop offset="0%" stopColor="hsl(140,30%,50%)" stopOpacity=".08" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        </defs>
        <rect x="15" y="95" width="130" height="35" rx="6" fill="hsl(25,20%,30%)" opacity=".18" />
        <path d="M80,95 Q78,78 80,58" stroke="url(#ss1)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M78,72 Q62,60 65,48 Q72,55 78,72Z" fill="hsl(140,35%,45%)" opacity=".7" />
        <path d="M82,64 Q96,52 93,40 Q86,48 82,64Z" fill="hsl(140,40%,50%)" opacity=".65" />
        <circle cx="80" cy="65" r="32" fill="url(#sg1)" />
      </svg>
    );

  if (stage === 2)
    return (
      <svg width="160" height="150" viewBox="0 0 160 150" className="mx-auto">
        <defs>
          <linearGradient id="ss2" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,28%,25%)" /><stop offset="100%" stopColor="hsl(140,32%,42%)" /></linearGradient>
        </defs>
        <rect x="15" y="110" width="130" height="32" rx="5" fill="hsl(25,20%,28%)" opacity=".15" />
        <path d="M80,110 Q78,85 76,55 Q75,38 78,22" stroke="url(#ss2)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M78,94 Q48,84 44,70 Q58,76 78,94Z" fill="hsl(140,32%,42%)" opacity=".55" />
        <path d="M79,78 Q112,66 118,50 Q102,62 79,78Z" fill="hsl(140,35%,48%)" opacity=".6" />
        <path d="M77,58 Q46,46 42,30 Q56,40 77,58Z" fill="hsl(140,32%,42%)" opacity=".5" />
        <path d="M78,42 Q98,32 102,18 Q90,28 78,42Z" fill="hsl(140,40%,52%)" opacity=".45" />
        <ellipse cx="78" cy="20" rx="5" ry="6.5" fill="hsl(140,35%,45%)" opacity=".5" />
        <ellipse cx="78" cy="19" rx="3" ry="4" fill="hsl(140,40%,52%)" opacity=".4" />
      </svg>
    );

  if (stage === 3)
    return (
      <svg width="180" height="165" viewBox="0 0 180 165" className="mx-auto">
        <defs>
          <linearGradient id="ss3" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,28%,22%)" /><stop offset="100%" stopColor="hsl(140,30%,35%)" /></linearGradient>
        </defs>
        <rect x="10" y="125" width="160" height="32" rx="5" fill="hsl(25,18%,26%)" opacity=".12" />
        <path d="M90,125 Q88,95 86,65 Q84,45 86,22" stroke="url(#ss3)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M88,108 Q42,94 30,72 Q52,84 88,108Z" fill="hsl(140,30%,35%)" opacity=".5" />
        <path d="M90,106 Q138,90 152,68 Q128,86 90,106Z" fill="hsl(140,35%,40%)" opacity=".45" />
        <path d="M87,82 Q34,68 22,44 Q48,60 87,82Z" fill="hsl(140,35%,40%)" opacity=".5" />
        <path d="M89,78 Q140,60 155,35 Q128,55 89,78Z" fill="hsl(140,30%,35%)" opacity=".42" />
        <path d="M86,58 Q45,42 38,18 Q56,34 86,58Z" fill="hsl(140,38%,48%)" opacity=".48" />
        <path d="M88,52 Q128,36 138,12 Q118,32 88,52Z" fill="hsl(140,35%,40%)" opacity=".42" />
        <ellipse cx="86" cy="20" rx="9" ry="12" fill="hsl(140,35%,40%)" opacity=".55" />
        <path d="M86,8 Q83,14 86,20 Q89,14 86,8Z" fill="hsl(140,40%,48%)" opacity=".45" />
      </svg>
    );

  // Stage 4: SUNFLOWER
  const petals = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5) * Math.PI / 180, cx = 100, cy = 44, l = 24, w = 7;
    const tx = cx + Math.cos(a) * l, ty = cy + Math.sin(a) * l;
    const c1x = cx + Math.cos(a - .3) * l * .6 + Math.cos(a + Math.PI / 2) * w;
    const c1y = cy + Math.sin(a - .3) * l * .6 + Math.sin(a + Math.PI / 2) * w;
    const c2x = cx + Math.cos(a + .3) * l * .6 - Math.cos(a + Math.PI / 2) * w;
    const c2y = cy + Math.sin(a + .3) * l * .6 - Math.sin(a + Math.PI / 2) * w;
    const c = ["hsl(38,65%,55%)", "hsl(35,60%,50%)", "hsl(30,55%,48%)"][i % 3];
    return <path key={`o${i}`} d={`M${cx},${cy} Q${c1x},${c1y} ${tx},${ty} Q${c2x},${c2y} ${cx},${cy}Z`} fill={c} opacity={.55 + (i % 2) * .15} />;
  });
  const inner = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 + 15) * Math.PI / 180, cx = 100, cy = 44, l = 16, w = 4.5;
    const tx = cx + Math.cos(a) * l, ty = cy + Math.sin(a) * l;
    const c1x = cx + Math.cos(a - .25) * l * .5 + Math.cos(a + Math.PI / 2) * w;
    const c1y = cy + Math.sin(a - .25) * l * .5 + Math.sin(a + Math.PI / 2) * w;
    const c2x = cx + Math.cos(a + .25) * l * .5 - Math.cos(a + Math.PI / 2) * w;
    const c2y = cy + Math.sin(a + .25) * l * .5 - Math.sin(a + Math.PI / 2) * w;
    return <path key={`i${i}`} d={`M${cx},${cy} Q${c1x},${c1y} ${tx},${ty} Q${c2x},${c2y} ${cx},${cy}Z`} fill="hsl(42,70%,62%)" opacity=".45" />;
  });
  const seeds = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45) * Math.PI / 180;
    return <circle key={`s${i}`} cx={100 + Math.cos(a) * 4.5} cy={44 + Math.sin(a) * 4.5} r="1" fill="hsl(38,50%,55%)" opacity=".3" />;
  });

  return (
    <svg width="200" height="190" viewBox="0 0 200 190" className="mx-auto">
      <defs>
        <linearGradient id="ss4" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="hsl(140,28%,22%)" /><stop offset="100%" stopColor="hsl(140,30%,32%)" /></linearGradient>
        <radialGradient id="sc4" cx="50%" cy="50%"><stop offset="0%" stopColor="hsl(25,40%,22%)" /><stop offset="40%" stopColor="hsl(30,45%,30%)" /><stop offset="100%" stopColor="hsl(25,35%,18%)" /></radialGradient>
        <radialGradient id="sg4" cx="50%" cy="28%"><stop offset="0%" stopColor="hsl(38,60%,60%)" stopOpacity=".1" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <rect x="10" y="155" width="180" height="28" rx="5" fill="hsl(25,18%,24%)" opacity=".1" />
      <path d="M100,155 Q98,125 96,90 Q94,70 96,52" stroke="url(#ss4)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M98,140 Q50,124 35,98 Q60,114 98,140Z" fill="hsl(140,28%,32%)" opacity=".45" />
      <path d="M100,138 Q150,120 165,92 Q138,112 100,138Z" fill="hsl(140,30%,35%)" opacity=".4" />
      <path d="M97,108 Q52,92 40,64 Q62,82 97,108Z" fill="hsl(140,33%,38%)" opacity=".42" />
      <path d="M99,102 Q146,84 158,55 Q134,78 99,102Z" fill="hsl(140,28%,32%)" opacity=".38" />
      {petals}
      {inner}
      <circle cx="100" cy="44" r="12" fill="url(#sc4)" />
      <circle cx="100" cy="44" r="8.5" fill="hsl(25,35%,18%)" opacity=".45" />
      {seeds}
      <circle cx="100" cy="44" r="50" fill="url(#sg4)" />
    </svg>
  );
}

export function PlantProgress({ confirmedSuggestions, totalSuggestions, streakDays, totalSessions, isLoading }: PlantProgressProps) {
  const progress = calculateProgress(confirmedSuggestions, streakDays, totalSessions);
  const currentStage = getCurrentStage(progress);
  const nextStage = getNextStage(currentStage);
  const isMaxStage = currentStage.name === nextStage.name;
  const progressToNext = isMaxStage ? 100 : ((progress - currentStage.minProgress) / (nextStage.minProgress - currentStage.minProgress)) * 100;
  const stageIndex = progressStages.findIndex((s) => s.name === currentStage.name);

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
