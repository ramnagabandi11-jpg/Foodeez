import { Router } from 'express';
import restaurantRoutes from './restaurants';
import deliveryPartnerRoutes from './delivery-partners';
import customerRoutes from './customers';
import orderRoutes from './orders';
import financeRoutes from './finance';
import analyticsRoutes from './analytics';
import supportRoutes from './support';
import hrRoutes from './hr';

const router = Router();

router.use('/restaurants', restaurantRoutes);
router.use('/delivery-partners', deliveryPartnerRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/finance', financeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/support', supportRoutes);
router.use('/hr', hrRoutes);

export default router;
