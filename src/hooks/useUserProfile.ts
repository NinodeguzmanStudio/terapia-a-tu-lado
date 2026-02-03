import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/therapy";

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [activeDates, setActiveDates] = useState<Date[]>([]);

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

            // Fetch active dates for calendar
            const { data: messages } = await supabase
                .from("chat_messages")
                .select("session_date")
                .eq("user_id", user.id)
                .eq("role", "user");

            if (messages) {
                const uniqueDates = Array.from(new Set(messages.map(m => m.session_date)))
                    .map(dateStr => new Date(dateStr));
                setActiveDates(uniqueDates);
            }

            setIsLoading(false);
        };

        loadProfile();
    }, []);

    const updateProfile = async (updates: { name?: string; age?: number }) => {
        if (!userId) return;
        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("user_id", userId);

        if (!error) {
            setUserProfile(prev => prev ? { ...prev, ...updates } : null);
        }
        return { error };
    };

    const deleteAccount = async () => {
        if (!userId) return;

        // Profiles are linked to user_id, so cascading delete or manual cleanup might be needed.
        // For simplicity, we trigger the delete and sign out.
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("user_id", userId);

        if (profileError) return { error: profileError };

        // Deleting the auth user usually requires higher privileges (service role).
        // For now, we sign out to ensure the session is cleared.
        await supabase.auth.signOut();
        return { error: null };
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return {
        userProfile,
        userId,
        activeDates,
        isLoading,
        updateProfile,
        deleteAccount,
        handleLogout,
    };
}
