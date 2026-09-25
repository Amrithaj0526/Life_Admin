import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { documentController } from '../controllers/documentController.js';
import { actionController } from '../controllers/actionController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { searchController } from '../controllers/searchController.js';
import { relationshipController } from '../controllers/relationshipController.js';
import { vaultController } from '../controllers/vaultController.js';
import { lifecycleController } from '../controllers/lifecycleController.js';
import { calendarController } from '../controllers/calendarController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { getDatabase } from '../config/database.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'LifeAdmin API', timestamp: new Date().toISOString() });
});

// Categories (Public / Authenticated)
apiRouter.get('/categories', async (_req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ categories: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Routes
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/logout', authenticate, authController.logout);
apiRouter.get('/auth/me', authenticate, authController.me);

// Dashboard Route
apiRouter.get('/dashboard/overview', authenticate, dashboardController.getOverview);

// Documents Routes
apiRouter.post('/documents/upload', authenticate, uploadMiddleware.single('file'), documentController.upload);
apiRouter.get('/documents', authenticate, documentController.list);
apiRouter.get('/documents/:id', authenticate, documentController.getById);
apiRouter.get('/documents/:id/download', authenticate, documentController.downloadFile);
apiRouter.post('/documents/:id/verify', authenticate, documentController.verify);
apiRouter.post('/documents/:id/archive', authenticate, documentController.archive);

// Actions Routes
apiRouter.get('/actions', authenticate, actionController.list);
apiRouter.post('/actions/:id/complete', authenticate, actionController.complete);
apiRouter.post('/actions/:id/start', authenticate, actionController.start);

// Search Routes
apiRouter.get('/search', authenticate, searchController.search);
apiRouter.get('/search/natural-language', authenticate, searchController.naturalLanguage);

// Relationships Routes
apiRouter.get('/documents/:id/relationships', authenticate, relationshipController.getForDocument);
apiRouter.post('/relationships', authenticate, relationshipController.create);
apiRouter.delete('/relationships/:id', authenticate, relationshipController.delete);

// Vaults (Family Sharing) Routes
apiRouter.get('/vaults', authenticate, vaultController.list);
apiRouter.post('/vaults', authenticate, vaultController.create);
apiRouter.post('/vaults/:id/members', authenticate, vaultController.addMember);

// Renewal Workflow & Version Comparison Routes
apiRouter.post('/documents/:id/start-renewal', authenticate, lifecycleController.startRenewal);
apiRouter.post('/documents/:id/renew', authenticate, uploadMiddleware.single('file'), lifecycleController.renewDocument);
apiRouter.get('/documents/:id/compare-versions', authenticate, lifecycleController.compareVersions);

// Audit History Trail
apiRouter.get('/audit-logs', authenticate, lifecycleController.getAuditLogs);

// Google Calendar Integration Routes
apiRouter.get('/calendar/google/connect', authenticate, calendarController.getConnectUrl);
apiRouter.get('/calendar/google/callback', calendarController.handleCallback);
apiRouter.get('/calendar/google/status', authenticate, calendarController.getStatus);
apiRouter.delete('/calendar/google/disconnect', authenticate, calendarController.disconnect);
apiRouter.post('/calendar/google/sync-all', authenticate, calendarController.syncAll);
apiRouter.post('/calendar/google/sync/:reminderId', authenticate, calendarController.syncReminder);
apiRouter.delete('/calendar/google/event/:reminderId', authenticate, calendarController.removeEvent);
