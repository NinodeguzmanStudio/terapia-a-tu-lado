-- Migration: Add streak trigger and user activity tracking
-- This was previously a manual SQL step (streak_trigger.sql).
-- Now integrated into the migration pipeline.

-- 1. Function to handle user activity on new messages
CREATE OR REPLACE FUNCTION public.handle_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
    today DATE := CURRENT_DATE;
BEGIN
    -- Only track user messages (not assistant responses)
    IF NEW.role != 'user' THEN
        RETURN NEW;
    END IF;

    -- Get the user's profile
    SELECT * INTO profile_record FROM public.profiles WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- If this is the first message of a new day
    IF profile_record.last_conversation_date IS NULL OR profile_record.last_conversation_date < today THEN
        -- Calculate streak
        IF profile_record.last_conversation_date = today - INTERVAL '1 day' THEN
            -- Consecutive day: increment streak
            UPDATE public.profiles 
            SET 
                streak_days = streak_days + 1,
                last_conversation_date = today,
                total_sessions = total_sessions + 1,
                conversations_today = 1
            WHERE user_id = NEW.user_id;
        ELSE
            -- Streak broken: reset to 1
            UPDATE public.profiles 
            SET 
                streak_days = 1,
                last_conversation_date = today,
                total_sessions = total_sessions + 1,
                conversations_today = 1
            WHERE user_id = NEW.user_id;
        END IF;
        
        -- Check milestones and award achievements
        -- 7-day streak
        IF (SELECT streak_days FROM public.profiles WHERE user_id = NEW.user_id) = 7 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, badge_icon)
            VALUES (NEW.user_id, 'streak', 'Semana de Constancia', '⭐')
            ON CONFLICT DO NOTHING;
        END IF;
        -- 14-day streak
        IF (SELECT streak_days FROM public.profiles WHERE user_id = NEW.user_id) = 14 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, badge_icon)
            VALUES (NEW.user_id, 'streak', 'Quincena de Bienestar', '🔥')
            ON CONFLICT DO NOTHING;
        END IF;
        -- 30-day streak
        IF (SELECT streak_days FROM public.profiles WHERE user_id = NEW.user_id) = 30 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, badge_icon)
            VALUES (NEW.user_id, 'streak', 'Mes de Transformación', '👑')
            ON CONFLICT DO NOTHING;
        END IF;

    ELSE
        -- Same day: only increment conversations_today
        UPDATE public.profiles 
        SET conversations_today = conversations_today + 1
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS on_user_message ON public.chat_messages;
CREATE TRIGGER on_user_message
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_activity();

-- 3. Add unique constraint on achievements to prevent duplicates
-- (needed for ON CONFLICT DO NOTHING to work)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_achievement
    ON public.user_achievements (user_id, achievement_type, achievement_name);

-- 4. Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, streak_days, total_sessions, conversations_today)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NULL), 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
