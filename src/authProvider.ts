import { AuthBindings } from "@refinedev/core";

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    branch_id?: string;
    company_id?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper to get stored token
const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

// Helper to set token
const setToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
};

// Helper to remove token
const removeToken = (): void => {
    localStorage.removeItem('auth_token');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    return fetch(url, {
        ...options,
        headers,
    });
};

// Simple in-memory cache
let userProfileCache: UserProfile | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchUserProfile = async (): Promise<UserProfile | null> => {
    // Check if token exists first
    const token = getToken();
    if (!token) {
        return null;
    }

    // Return cached if valid and recent
    if (userProfileCache && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        return userProfileCache;
    }

    try {
        const response = await fetchWithAuth(`${API_URL}/api/auth/me`);

        if (!response.ok) {
            return null;
        }

        const userData = await response.json();
        userProfileCache = userData;
        lastFetchTime = Date.now();
        return userData;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const authProvider: AuthBindings = {
    login: async ({ email, password }) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return {
                    success: false,
                    error: {
                        message: data.error || 'Login failed',
                        name: 'LoginError',
                    },
                };
            }

            // Store token
            if (data.token) {
                setToken(data.token);
            }

            // Cache user profile
            if (data.user) {
                userProfileCache = data.user;
                lastFetchTime = Date.now();
            }

            return {
                success: true,
                redirectTo: '/',
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    message: error?.message || 'Login failed',
                    name: 'LoginError',
                },
            };
        }
    },

    logout: async () => {
        try {
            // Call backend logout (optional, for token blacklist if implemented)
            await fetchWithAuth(`${API_URL}/api/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear local storage and cache
        removeToken();
        userProfileCache = null;

        return {
            success: true,
            redirectTo: '/login',
        };
    },

    check: async () => {
        try {
            const token = getToken();

            if (!token) {
                userProfileCache = null;
                return {
                    authenticated: false,
                    redirectTo: '/login',
                };
            }

            // Verify token with backend
            const response = await fetchWithAuth(`${API_URL}/api/auth/check`);

            if (!response.ok) {
                userProfileCache = null;
                removeToken();
                return {
                    authenticated: false,
                    redirectTo: '/login',
                };
            }

            return {
                authenticated: true,
            };
        } catch (error: any) {
            userProfileCache = null;
            removeToken();
            return {
                authenticated: false,
                redirectTo: '/login',
                error: {
                    message: error?.message,
                    name: 'AuthError',
                },
            };
        }
    },

    getPermissions: async () => {
        try {
            const userData = await fetchUserProfile();

            if (!userData) {
                return null;
            }

            return {
                role: userData.role,
                branchId: userData.branch_id,
            };
        } catch (error) {
            console.error('Error in getPermissions:', error);
            return null;
        }
    },

    getIdentity: async () => {
        try {
            const userData = await fetchUserProfile();

            if (!userData) {
                return null;
            }

            return {
                id: userData.id,
                email: userData.email,
                fullName: userData.full_name,
                role: userData.role,
                branchId: userData.branch_id,
                companyId: userData.company_id,
            };
        } catch (error) {
            console.error('Error in getIdentity:', error);
            return null;
        }
    },

    onError: async (error: any) => {
        console.error('Auth error:', error);
        if (error?.status === 401 || error?.status === 403 || error?.message === 'Invalid or expired token') {
            return {
                logout: true,
                redirectTo: '/login',
            };
        }
        return { error };
    },
};
