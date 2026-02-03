import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/therapy";

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            setUserId(user.id);

            const { data: profile } = await supabase
                .from("profiles")
                .select("name, age, is_moderator, streak_days, total_sessions")
                .eq("user_id", user.id)
                .single();

            if (profile) {
                setUserProfile(profile);
            }
            setIsLoading(false);
        };

        loadProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return {
        userProfile,
        userId,
        isLoading,
        handleLogout,
    };
}
