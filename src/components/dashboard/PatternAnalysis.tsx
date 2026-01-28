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
        <h3 className="text-xl font-serif mb-4">Análisis de Patrones</h3>
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
      <div className="therapy-card text-center py-8">
        <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          Los patrones se revelarán con más conversaciones
        </p>
      </div>
    );
  }

  const insights = [
    {
      icon: Target,
      title: "Trigger Principal",
      content: data.main_trigger,
      color: "text-emotion-anxiety",
      bg: "bg-emotion-anxiety/10",
    },
    {
      icon: Lightbulb,
      title: "Creencia Central",
      content: data.core_belief,
      color: "text-emotion-sadness",
      bg: "bg-emotion-sadness/10",
    },
    {
      icon: TrendingUp,
      title: "Evolución",
      content: data.evolution,
      color: "text-emotion-stability",
      bg: "bg-emotion-stability/10",
    },
  ];

  return (
    <div className="therapy-card">
      <h3 className="text-xl font-serif mb-6">Análisis de Patrones</h3>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`p-4 rounded-xl ${insight.bg}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <insight.icon className={`h-4 w-4 ${insight.color}`} />
              <span className="text-sm font-semibold">{insight.title}</span>
            </div>
            <p className="text-sm text-foreground/80">{insight.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
