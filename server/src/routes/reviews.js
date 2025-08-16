import express from 'express';
import { body } from 'express-validator';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getUserReviews,
  getAllReviews,
  getReviewStats
} from '../controllers/reviewController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateReview = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL')
];

const validateReviewUpdate = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL')
];

// Public routes
router.get('/product/:productId', getProductReviews);

// User routes (require authentication)
router.post('/', auth, validateReview, createReview);
router.get('/user', auth, getUserReviews);
router.put('/:id', auth, validateReviewUpdate, updateReview);
router.delete('/:id', auth, deleteReview);
router.post('/:id/helpful', auth, markReviewHelpful);

// Admin routes (require admin role)
router.get('/admin/all', auth, requireAdmin, getAllReviews);
router.get('/admin/stats', auth, requireAdmin, getReviewStats);

export default router;
