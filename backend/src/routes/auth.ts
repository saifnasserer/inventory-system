import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { AuthService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required'
            } as AuthResponse);
            return;
        }

        // Find user by email
        const user = await prisma.users.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                company_id: true,
                branch_id: true,
                password_hash: true,
            },
        });

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            } as AuthResponse);
            return;
        }

        // Verify password
        if (!user.password_hash) {
            res.status(401).json({
                success: false,
                error: 'Account not properly configured. Please contact administrator.'
            } as AuthResponse);
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            } as AuthResponse);
            return;
        }

        // Generate JWT token
        const token = AuthService.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id!,
            branchId: user.branch_id || undefined,
        });

        // Generate Offline Token
        const maxDevices = user.role === 'admin' ? 50 : 20;
        const offlineToken = AuthService.generateOfflineToken({
            sub: user.id,
            iss: 'TechFlow_ERP',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
            iat: Math.floor(Date.now() / 1000),
            jti: Math.random().toString(36).substring(7),
            monotonic_start: Date.now(),
            max_devices: maxDevices,
            plan_type: user.role === 'admin' ? 'pro' : 'free'
        });

        res.json({
            success: true,
            token,
            offline_token: offlineToken,
            max_devices: maxDevices,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                company_id: user.company_id!,
                branch_id: user.branch_id || undefined,
            },
        } as AuthResponse);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        } as AuthResponse);
    }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, full_name, company_id, role, branch_id }: RegisterRequest = req.body;

        if (!email || !password || !full_name || !company_id) {
            res.status(400).json({
                success: false,
                error: 'Email, password, full name, and company ID are required'
            } as AuthResponse);
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            } as AuthResponse);
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.users.create({
            data: {
                email: email.toLowerCase(),
                full_name,
                role: (role || 'warehouse_staff') as any,
                company_id,
                branch_id: branch_id || null,
                password_hash: passwordHash,
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                company_id: true,
                branch_id: true,
            },
        });

        // Generate JWT token
        const token = AuthService.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id!,
            branchId: user.branch_id || undefined,
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                company_id: user.company_id!,
                branch_id: user.branch_id || undefined,
            },
        } as AuthResponse);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        } as AuthResponse);
    }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, (req: Request, res: Response): void => {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, implement token blacklist for enhanced security
    res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = await prisma.users.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                company_id: true,
                branch_id: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            company_id: user.company_id,
            branch_id: user.branch_id,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

/**
 * GET /api/auth/check
 * Check if token is valid
 */
router.get('/check', authenticateToken, (req: Request, res: Response): void => {
    res.json({ authenticated: true, user: req.user });
});

export default router;
