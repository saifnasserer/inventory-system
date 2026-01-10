import { AuthBindings } from "@refinedev/core";
import { supabaseClient } from "./utility/supabaseClient";

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    branch_id?: string;
}

// Simple in-memory cache
let userProfileCache: UserProfile | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // Return cached if valid and recent
    if (userProfileCache && userProfileCache.id === userId && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        return userProfileCache;
    }

    const { data: userData, error } = await supabaseClient
        .from("users")
        .select("id, email, full_name, role, branch_id")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }

    userProfileCache = userData;
    lastFetchTime = Date.now();
    return userData;
};

export const authProvider: AuthBindings = {
    login: async ({ email, password }) => {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return {
                    success: false,
                    error: {
                        message: error.message,
                        name: "LoginError",
                    },
                };
            }

            // Clear cache on new login
            userProfileCache = null;

            if (data?.user) {
                // Prefetch profile to speed up subsequent checks
                await fetchUserProfile(data.user.id);

                // Always redirect to dashboard, let DashboardPage handle role-based routing
                // This acts as the "Auth Wrapper" requested by the user
                return {
                    success: true,
                    redirectTo: "/",
                };

                return {
                    success: true,
                    redirectTo,
                };
            }

            return {
                success: false,
                error: {
                    message: "Login failed",
                    name: "LoginError",
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    message: error?.message || "Login failed",
                    name: "LoginError",
                },
            };
        }
    },

    logout: async () => {
        userProfileCache = null; // Clear cache
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    name: "LogoutError",
                },
            };
        }

        return {
            success: true,
            redirectTo: "/login",
        };
    },

    check: async () => {
        try {
            const { data } = await supabaseClient.auth.getSession();
            const { session } = data;

            if (!session) {
                userProfileCache = null;
                return {
                    authenticated: false,
                    redirectTo: "/login",
                };
            }

            return {
                authenticated: true,
            };
        } catch (error: any) {
            userProfileCache = null;
            return {
                authenticated: false,
                redirectTo: "/login",
                error: {
                    message: error?.message,
                    name: "AuthError",
                },
            };
        }
    },

    getPermissions: async () => {
        try {
            const { data } = await supabaseClient.auth.getUser();

            if (data?.user) {
                const userData = await fetchUserProfile(data.user.id);

                return {
                    role: userData?.role,
                    branchId: userData?.branch_id,
                };
            }

            return null;
        } catch (error) {
            console.error("Error in getPermissions:", error);
            return null;
        }
    },

    getIdentity: async () => {
        try {
            const { data } = await supabaseClient.auth.getUser();

            if (data?.user) {
                const userData = await fetchUserProfile(data.user.id);

                return {
                    id: data.user.id,
                    email: data.user.email,
                    fullName: userData?.full_name,
                    role: userData?.role,
                    branchId: userData?.branch_id,
                };
            }

            return null;
        } catch (error) {
            console.error("Error in getIdentity:", error);
            return null;
        }
    },

    onError: async (error) => {
        console.error("Auth error:", error);
        return { error };
    },
};
