import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EmotionData {
  anxiety: number;
  anger: number;
  sadness: number;
  stability: number;
  joy: number;
  recommendations?: string[];
}

interface EmotionStatsProps {
  data: EmotionData | null;
  isLoading?: boolean;
}

const emotionConfig = {
  anxiety: { label: "Ansiedad", color: "bg-emotion-anxiety" },
  anger: { label: "Enojo", color: "bg-emotion-anger" },
  sadness: { label: "Tristeza", color: "bg-emotion-sadness" },
  stability: { label: "Estabilidad", color: "bg-emotion-stability" },
  joy: { label: "Alegría", color: "bg-emotion-joy" },
};

export function EmotionStats({ data, isLoading }: EmotionStatsProps) {
  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Estadísticas Emocionales</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="progress-track">
                <div className="h-full bg-muted-foreground/20 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="therapy-card text-center py-8">
        <p className="text-muted-foreground">
          Tus estadísticas emocionales aparecerán automáticamente después de unos mensajes de conversación
        </p>
      </div>
    );
  }

  const emotions = Object.entries(emotionConfig).map(([key, config]) => ({
    key,
    ...config,
    value: data[key as keyof EmotionData] as number,
  }));

  const dominantEmotion = emotions.reduce((a, b) => (a.value > b.value ? a : b));

  return (
    <div className="therapy-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif">Estadísticas Emocionales</h3>
        <span className={`emotion-badge ${`emotion-${dominantEmotion.key}`}`}>
          {dominantEmotion.label} dominante
        </span>
      </div>

      <div className="space-y-4">
        {emotions.map((emotion, index) => (
          <motion.div
            key={emotion.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{emotion.label}</span>
              <span className="text-sm text-muted-foreground">{emotion.value}%</span>
            </div>
            <div className="progress-track">
              <motion.div
                className={`progress-fill ${emotion.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${emotion.value}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold mb-3">Recomendaciones</h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
