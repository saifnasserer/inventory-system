export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    companyId: string;
    branchId?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    company_id: string;
    branch_id?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
    company_id: string;
    role?: string;
    branch_id?: string;
}

export interface OfflineJWTPayload {
    sub: string;
    iss: string;
    exp: number;
    iat: number;
    jti: string;
    monotonic_start: number;
    max_devices: number;
    plan_type: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    offline_token?: string;
    max_devices?: number;
    user?: UserProfile;
    error?: string;
}
