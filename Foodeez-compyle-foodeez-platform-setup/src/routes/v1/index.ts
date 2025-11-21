import { Router } from 'express';
import authRoutes from './auth';
import orderRoutes from './orders';
import paymentRoutes from './payments';
import searchRoutes from './search';
import reviewRoutes from './reviews';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/search', searchRoutes);
router.use('/reviews', reviewRoutes);

export default router;
