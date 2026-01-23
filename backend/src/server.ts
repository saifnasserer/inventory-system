import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import devicesRoutes from './routes/devices.js';
import shipmentsRoutes from './routes/shipments.js';
import companiesRoutes from './routes/companies.js';
import repairsRoutes from './routes/repairs.js';
import sparePartsRoutes from './routes/spare-parts.js';
import technicalInspectionsRoutes from './routes/technical-inspections.js';
import physicalInspectionsRoutes from './routes/physical-inspections.js';
import diagnosticReportsRoutes from './routes/diagnostic-reports.js';
import usersRoutes from './routes/users.js';
import branchesRoutes from './routes/branches.js';
import vendorsRoutes from './routes/vendors.js';
import path from 'path';

const app: Express = express();
const PORT = process.env.PORT || 4006;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/spare-parts-requests', sparePartsRoutes);
app.use('/api/technical-inspections', technicalInspectionsRoutes);
app.use('/api/physical-inspections', physicalInspectionsRoutes);
app.use('/api/diagnostic_reports', diagnosticReportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/vendors', vendorsRoutes);

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
});

export default app;
