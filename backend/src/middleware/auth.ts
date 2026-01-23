import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../types/auth';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const payload = AuthService.verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

/**
 * Middleware to check if user belongs to the same company
 */
export const requireSameCompany = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const companyId = req.params.companyId || req.body.company_id;

    if (companyId && companyId !== req.user.companyId) {
        res.status(403).json({ error: 'Access denied: different company' });
        return;
    }

    next();
};
