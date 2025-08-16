import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
  getOrderStats
} from '../controllers/orderController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2 })
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .trim()
    .isLength({ min: 5 })
    .withMessage('ZIP code is required'),
  body('shippingAddress.country')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Country is required'),
  body('paymentMethod')
    .trim()
    .isIn(['stripe', 'paypal', 'cash_on_delivery'])
    .withMessage('Valid payment method is required'),
  body('couponCode')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Coupon code must be at least 3 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const validateOrderStatus = [
  body('status')
    .trim()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Valid status is required'),
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Tracking number must be at least 3 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

// User routes (require authentication)
router.use(auth);

// Create order from cart
router.post('/', validateOrder, createOrder);

// Get user's orders
router.get('/', getUserOrders);

// Get single order
router.get('/:id', getOrder);

// Cancel order
router.put('/:id/cancel', cancelOrder);

// Admin routes (require admin role)
router.put('/:id/status', requireAdmin, validateOrderStatus, updateOrderStatus);
router.get('/admin/all', requireAdmin, getAllOrders);
router.get('/admin/stats', requireAdmin, getOrderStats);

export default router;
