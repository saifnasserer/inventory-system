import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/license/sync
 * Sync offline usage and get a new offline token
 */
router.post('/sync', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { offline_token, scanned_devices, flags } = req.body;

        if (!offline_token) {
            res.status(400).json({ success: false, error: 'Offline token is required' });
            return;
        }

        // 1. Verify the offline token
        let payload;
        try {
            payload = AuthService.verifyOfflineToken(offline_token);
        } catch (error) {
            res.status(401).json({ success: false, error: 'Invalid or expired offline token' });
            return;
        }

        // 2. Log scanned devices (In a real implementation, we'd save these to the DB)
        if (scanned_devices && scanned_devices.length > 0) {
            console.log(`Syncing ${scanned_devices.length} devices for user ${payload.sub}`);
            // Mock DB logic: update user's scanned devices count or audit log
        }

        // 3. Handle security flags
        if (flags && flags.length > 0) {
            console.warn(`Security flags detected during sync for user ${payload.sub}:`, flags);
        }

        // 4. Issue a new offline token
        const newOfflineToken = AuthService.generateOfflineToken({
            ...payload,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
            iat: Math.floor(Date.now() / 1000),
            jti: Math.random().toString(36).substring(7),
            monotonic_start: Date.now()
        });

        res.json({
            success: true,
            new_offline_token: newOfflineToken,
            synced_count: scanned_devices ? scanned_devices.length : 0,
            message: 'Sync successful'
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ success: false, error: 'Sync failed' });
    }
});

export default router;
