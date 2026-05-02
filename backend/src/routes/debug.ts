import { Router } from 'express';
import { getSchemaController, getConnectionStatusController } from '../controllers/debugController';
import { initSchemaController, seedDataController } from '../controllers/migrationController';

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
