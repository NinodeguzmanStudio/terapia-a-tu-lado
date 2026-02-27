import { motion } from "framer-motion";

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
  anxiety: { label: "Ansiedad", color: "bg-emotion-anxiety", emoji: "😰", gradient: "from-orange-400 to-amber-500" },
  anger: { label: "Enojo", color: "bg-emotion-anger", emoji: "😤", gradient: "from-red-400 to-rose-500" },
  sadness: { label: "Tristeza", color: "bg-emotion-sadness", emoji: "😢", gradient: "from-blue-400 to-indigo-500" },
  stability: { label: "Estabilidad", color: "bg-emotion-stability", emoji: "🧘", gradient: "from-emerald-400 to-green-500" },
  joy: { label: "Alegría", color: "bg-emotion-joy", emoji: "😊", gradient: "from-yellow-400 to-amber-400" },
};

export function EmotionStats({ data, isLoading }: EmotionStatsProps) {
  if (isLoading) {
    return (
      <div className="therapy-card">
        <h3 className="text-xl font-serif mb-4">Tu Estado Emocional</h3>
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
      <div className="therapy-card text-center py-10">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-serif mb-2">Estado emocional</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Tus estadísticas emocionales aparecerán aquí después de tu primera conversación profunda.
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
        <h3 className="text-xl font-serif">Tu Estado Emocional</h3>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-sm"
        >
          <span>{dominantEmotion.emoji}</span>
          <span className="font-medium text-primary">{dominantEmotion.label}</span>
        </motion.span>
      </div>

      <div className="space-y-4">
        {emotions.map((emotion, index) => (
          <motion.div
            key={emotion.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">{emotion.emoji}</span>
                <span className="text-sm font-medium">{emotion.label}</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{emotion.value}%</span>
            </div>
            <div className="progress-track h-3 rounded-full">
              <motion.div
                className={`progress-fill ${emotion.color} h-3 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${emotion.value}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {data.recommendations && data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 pt-4 border-t border-border"
        >
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span>💡</span>
            Observaciones
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-5 relative">
                <span className="absolute left-0 top-0 text-primary">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
