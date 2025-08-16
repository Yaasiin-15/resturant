import express from 'express';
import { body } from 'express-validator';
import {
  getDashboardMetrics,
  getUsers,
  updateUserRole,
  getInventory,
  updateProductStock,
  getCoupons,
  getAnalytics
} from '../controllers/adminController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(auth, requireAdmin);

// Validation middleware
const validateUserRole = [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
];

const validateStockUpdate = [
  body('countInStock')
    .isInt({ min: 0 })
    .withMessage('Stock count must be a non-negative integer')
];

// Dashboard routes
router.get('/metrics', getDashboardMetrics);
router.get('/analytics', getAnalytics);

// User management routes
router.get('/users', getUsers);
router.put('/users/:id/role', validateUserRole, updateUserRole);

// Inventory management routes
router.get('/inventory', getInventory);
router.put('/inventory/:id/stock', validateStockUpdate, updateProductStock);

// Coupon management routes
router.get('/coupons', getCoupons);

export default router;
