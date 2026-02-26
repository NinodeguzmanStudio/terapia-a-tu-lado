import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/therapy";

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDates, setActiveDates] = useState<Date[]>([]);

    const loadProfile = useCallback(async (uid: string) => {
        setIsLoading(true);
        setUserId(uid);

        const { data: profile } = await supabase
            .from("profiles")
            .select("name, age, is_moderator, streak_days, total_sessions")
            .eq("user_id", uid)
            .single();

        if (profile) {
            setUserProfile(profile);
        }

        // Fetch active dates for calendar
        const { data: messages } = await supabase
            .from("chat_messages")
            .select("session_date")
            .eq("user_id", uid)
            .eq("role", "user");

        if (messages) {
            const uniqueDates = Array.from(new Set(messages.map(m => m.session_date)))
                .map(dateStr => new Date(dateStr));
            setActiveDates(uniqueDates);
        }

        setIsLoading(false);
    }, []);

    const clearProfile = useCallback(() => {
        setUserId(null);
        setUserProfile(null);
        setActiveDates([]);
        setIsLoading(false);
    }, []);

    // FIXED: Use onAuthStateChange to react to login/logout/session expiry
    useEffect(() => {
        // Check initial session
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                loadProfile(user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_IN" && session?.user) {
                    await loadProfile(session.user.id);
                } else if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
                    clearProfile();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [loadProfile, clearProfile]);

    // Refresh profile data (useful after streak updates from trigger)
    const refreshProfile = useCallback(async () => {
        if (!userId) return;
        const { data: profile } = await supabase
            .from("profiles")
            .select("name, age, is_moderator, streak_days, total_sessions")
            .eq("user_id", userId)
            .single();

        if (profile) {
            setUserProfile(profile);
        }
    }, [userId]);

    const updateProfile = async (updates: { name?: string; age?: number }) => {
        if (!userId) return { error: new Error("No user") };
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
        if (!userId) return { error: new Error("No user") };

        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("user_id", userId);

        if (profileError) return { error: profileError };

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
        refreshProfile,
    };
}
