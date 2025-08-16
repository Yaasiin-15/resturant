import express from 'express';
import { body } from 'express-validator';
import {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  processRefund,
  getPaymentMethods,
  createCustomer
} from '../controllers/paymentController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validatePaymentIntent = [
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('Amount must be at least 50 cents'),
  body('currency')
    .optional()
    .isIn(['usd', 'eur', 'gbp', 'cad'])
    .withMessage('Invalid currency'),
  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('paymentMethodTypes')
    .optional()
    .isArray()
    .withMessage('Payment method types must be an array')
];

const validatePaymentConfirmation = [
  body('paymentIntentId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Payment intent ID is required'),
  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Valid order ID is required')
];

const validateRefund = [
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .optional()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer'])
    .withMessage('Invalid refund reason')
];

// Webhook route (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// User routes (require authentication)
router.post('/create-intent', auth, validatePaymentIntent, createPaymentIntent);
router.post('/confirm', auth, validatePaymentConfirmation, confirmPayment);
router.get('/methods', auth, getPaymentMethods);
router.post('/create-customer', auth, createCustomer);

// Admin routes (require admin role)
router.post('/refund', auth, requireAdmin, validateRefund, processRefund);

export default router;
