import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  updateShippingMethod
} from '../controllers/cartController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(auth);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);
router.post('/apply-coupon', applyCoupon);
router.delete('/remove-coupon', removeCoupon);
router.put('/shipping', updateShippingMethod);

export default router;
