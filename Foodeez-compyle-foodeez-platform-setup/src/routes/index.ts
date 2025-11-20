import { Router } from 'express';
import v1Routes from './v1';
import adminRoutes from './admin';

const router = Router();

// Mount v1 routes
router.use('/v1', v1Routes);

// Mount admin routes (under /api for clarity)
router.use('/api/admin', adminRoutes);

export default router;
