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

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: UserProfile;
    error?: string;
}
