-- Create chat messages table for therapy conversations
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create emotional analysis table for tracking patterns
CREATE TABLE public.emotional_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  anxiety_percentage INTEGER DEFAULT 0,
  anger_percentage INTEGER DEFAULT 0,
  sadness_percentage INTEGER DEFAULT 0,
  stability_percentage INTEGER DEFAULT 0,
  joy_percentage INTEGER DEFAULT 0,
  main_trigger TEXT,
  core_belief TEXT,
  evolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suggestions/tasks table
CREATE TABLE public.daily_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  conversations_today INTEGER DEFAULT 0,
  last_conversation_date DATE,
  total_sessions INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages" 
  ON public.chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for emotional_analysis
CREATE POLICY "Users can view their own analysis" 
  ON public.emotional_analysis FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis" 
  ON public.emotional_analysis FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis" 
  ON public.emotional_analysis FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for daily_suggestions
CREATE POLICY "Users can view their own suggestions" 
  ON public.daily_suggestions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggestions" 
  ON public.daily_suggestions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" 
  ON public.daily_suggestions FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
  ON public.user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
  ON public.user_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_user_date ON public.chat_messages(user_id, session_date);
CREATE INDEX idx_emotional_analysis_user_date ON public.emotional_analysis(user_id, analysis_date);
CREATE INDEX idx_daily_suggestions_user ON public.daily_suggestions(user_id, created_at);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();