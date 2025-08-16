import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
} from '../controllers/categoryController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid category ID'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL')
];

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

// Admin routes (require authentication and admin role)
router.post('/', auth, requireAdmin, validateCategory, createCategory);
router.put('/:id', auth, requireAdmin, validateCategory, updateCategory);
router.delete('/:id', auth, requireAdmin, deleteCategory);

export default router;
