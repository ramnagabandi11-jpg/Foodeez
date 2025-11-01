import { Router } from 'express';
import restaurantRoutes from './restaurants';
import deliveryPartnerRoutes from './delivery-partners';
import customerRoutes from './customers';
import orderRoutes from './orders';

const router = Router();

router.use('/restaurants', restaurantRoutes);
router.use('/delivery-partners', deliveryPartnerRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);

export default router;
