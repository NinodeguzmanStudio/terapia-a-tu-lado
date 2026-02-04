import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmotionTrendChartProps {
    data: any[];
    isLoading?: boolean;
}

const emotionColors = {
    anxiety_percentage: "#FF8080", // Anxiety - Soft Red
    anger_percentage: "#FFB080",   // Anger - Orange
    sadness_percentage: "#80B0FF", // Sadness - Blue
    stability_percentage: "#80FFB0", // Stability - Green
    joy_percentage: "#FFE080",     // Joy - Yellow
};

const emotionLabels: Record<string, string> = {
    anxiety_percentage: "Ansiedad",
    anger_percentage: "Enojo",
    sadness_percentage: "Tristeza",
    stability_percentage: "Estabilidad",
    joy_percentage: "Alegría",
};

export function EmotionTrendChart({ data, isLoading }: EmotionTrendChartProps) {
    if (isLoading) {
        return (
            <div className="therapy-card h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="therapy-card h-[400px] flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">No hay suficientes datos históricos aún.</p>
                <p className="text-sm text-muted-foreground mt-2">Continúa conversando para ver tu evolución emocional.</p>
            </div>
        );
    }

    const formattedData = data.map(item => ({
        ...item,
        date: format(new Date(item.analysis_date), "dd MMM", { locale: es }),
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="therapy-card h-[400px] flex flex-col pt-6"
        >
            <h3 className="text-xl font-serif mb-6 px-2">Evolución Emocional</h3>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "currentColor" }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "currentColor" }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "12px",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                        {Object.entries(emotionColors).map(([key, color]) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={emotionLabels[key]}
                                stroke={color}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1000}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
