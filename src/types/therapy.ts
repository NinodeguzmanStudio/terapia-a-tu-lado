export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export interface EmotionData {
    anxiety: number;
    anger: number;
    sadness: number;
    stability: number;
    joy: number;
    recommendations?: string[];
}

export interface AnalysisData {
    main_trigger: string;
    core_belief: string;
    evolution: string;
}

export interface Suggestion {
    id: string;
    text: string;
    category: string;
    isCompleted: boolean;
    completedAt?: Date;
    notes?: string;
    confirmed: boolean;
}

export interface UserProfile {
    name: string | null;
    age: number | null;
    is_moderator: boolean;
    streak_days: number;
    total_sessions: number;
}

export interface HistoricalEmotion {
    id: string;
    analysis_date: string;
    anxiety_percentage: number;
    anger_percentage: number;
    sadness_percentage: number;
    stability_percentage: number;
    joy_percentage: number;
    main_trigger?: string;
    core_belief?: string;
    evolution_notes?: string;
}
