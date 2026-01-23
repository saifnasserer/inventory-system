import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

export class AuthService {
    /**
     * Hash a password using bcrypt
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    /**
     * Compare password with hash
     */
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token
     */
    static generateToken(payload: JWTPayload): string {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN as any,
        });
    }

    /**
     * Verify JWT token
     */
    static verifyToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Decode JWT token without verification (for debugging)
     */
    static decodeToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch (error) {
            return null;
        }
    }
}
