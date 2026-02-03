-- INSTRUCCIONES:
-- Copia y pega este código en el SQL Editor de tu Dashboard de Supabase y ejecútalo.
-- Este script automatiza el cálculo de rachas y sesiones cada vez que envías un mensaje.

-- 1. Función para manejar la actividad del usuario
CREATE OR REPLACE FUNCTION public.handle_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
    today DATE := CURRENT_DATE;
BEGIN
    -- Solo rastrear mensajes del usuario
    IF NEW.role != 'user' THEN
        RETURN NEW;
    END IF;

    -- Obtener el perfil del usuario
    SELECT * INTO profile_record FROM public.profiles WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Si es el primer mensaje de un nuevo día
    IF profile_record.last_conversation_date IS NULL OR profile_record.last_conversation_date < today THEN
        -- Calcular racha
        IF profile_record.last_conversation_date = today - INTERVAL '1 day' THEN
            UPDATE public.profiles 
            SET 
                streak_days = streak_days + 1,
                last_conversation_date = today,
                total_sessions = total_sessions + 1,
                conversations_today = 1
            WHERE user_id = NEW.user_id;
        ELSE
            UPDATE public.profiles 
            SET 
                streak_days = 1,
                last_conversation_date = today,
                total_sessions = total_sessions + 1,
                conversations_today = 1
            WHERE user_id = NEW.user_id;
        END IF;
        
        -- Verificar hitos y otorgar logros
        -- (7 días)
        IF (SELECT streak_days FROM public.profiles WHERE user_id = NEW.user_id) = 7 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, badge_icon)
            VALUES (NEW.user_id, 'streak', 'Semana de Constancia', '⭐')
            ON CONFLICT DO NOTHING;
        END IF;
        -- (14 días)
        IF (SELECT streak_days FROM public.profiles WHERE user_id = NEW.user_id) = 14 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, badge_icon)
            VALUES (NEW.user_id, 'streak', 'Quincena de Bienestar', '🔥')
            ON CONFLICT DO NOTHING;
        END IF;
        -- (30 días)
        IF (SELECT streak_days FROM public.profiles WHERE user_id = NEW.user_id) = 30 THEN
            INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, badge_icon)
            VALUES (NEW.user_id, 'streak', 'Mes de Transformación', '👑')
            ON CONFLICT DO NOTHING;
        END IF;

    ELSE
        -- Si es el mismo día, solo incrementar conversaciones_hoy
        UPDATE public.profiles 
        SET conversations_today = conversations_today + 1
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS on_user_message ON public.chat_messages;
CREATE TRIGGER on_user_message
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_activity();
