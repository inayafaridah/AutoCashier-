import { Router } from 'express';
import { getSchemaController, getConnectionStatusController } from './debug.controller';
import { initSchemaController, seedDataController } from './migration.controller';

const router = Router();

// Check database connection status
router.get('/status', getConnectionStatusController);

// List all tables in public schema
router.get('/tables', getSchemaController);

// Initialize schema (create tables)
router.post('/init-schema', initSchemaController);

// Seed sample data
router.post('/seed-data', seedDataController);

export default router;
