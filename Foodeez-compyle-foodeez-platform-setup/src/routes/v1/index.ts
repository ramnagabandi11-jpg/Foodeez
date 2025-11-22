import { Router } from 'express';
import authRoutes from './auth';
import orderRoutes from './orders';
import paymentRoutes from './payments';
import searchRoutes from './search';
<<<<<<< HEAD
import reviewRoutes from './reviews';
=======
import customerRoutes from './customer';
import restaurantRoutes from './restaurant';
import deliveryRoutes from './delivery';
import reviewRoutes from './reviews';
import promoRoutes from './promo';
import supportRoutes from './support';
>>>>>>> origin/compyle/foodeez-platform
import adminRoutes from './admin';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/search', searchRoutes);
<<<<<<< HEAD
router.use('/reviews', reviewRoutes);
=======
router.use('/customer', customerRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/promo', promoRoutes);
router.use('/support', supportRoutes);
>>>>>>> origin/compyle/foodeez-platform
router.use('/admin', adminRoutes);

export default router;
