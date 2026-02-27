import { motion } from "framer-motion";
import { Lightbulb, Target, TrendingUp } from "lucide-react";

interface AnalysisData {
  main_trigger: string;
  core_belief: string;
  evolution: string;
}

interface PatternAnalysisProps {
  data: AnalysisData | null;
  isLoading?: boolean;
}

export function PatternAnalysis({ data, isLoading }: PatternAnalysisProps) {
  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Patrones Detectados</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-4 bg-muted/50 rounded-lg">
              <div className="h-4 bg-muted-foreground/20 rounded w-20 mb-2" />
              <div className="h-3 bg-muted-foreground/10 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="therapy-card text-center py-10">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-lg font-serif mb-2">Patrones detectados</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Los patrones se revelan mientras conversas. Sigue compartiendo lo que sientes.
        </p>
      </div>
    );
  }

  const insights = [
    {
      icon: Target,
      title: "Lo que te activa",
      content: data.main_trigger,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      border: "border-orange-200 dark:border-orange-500/20",
    },
    {
      icon: Lightbulb,
      title: "Tu creencia central",
      content: data.core_belief,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-200 dark:border-blue-500/20",
    },
    {
      icon: TrendingUp,
      title: "Cómo vas evolucionando",
      content: data.evolution,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
    },
  ];

  return (
    <div className="therapy-card">
      <h3 className="text-xl font-serif mb-6">Patrones Detectados</h3>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`p-4 rounded-xl ${insight.bg} border ${insight.border}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <insight.icon className={`h-4 w-4 ${insight.color}`} />
              <span className="text-sm font-semibold">{insight.title}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{insight.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
