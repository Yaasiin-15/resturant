import express from 'express';
import {
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRelatedProducts,
  getProductBrands,
  searchProducts,
  getProductsByCategory
} from '../controllers/productController.js';
import { auth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/brands', getProductBrands);
router.get('/search', searchProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);
router.get('/:id/related', getRelatedProducts);

// Admin routes
router.post('/', auth, requireAdmin, createProduct);
router.put('/:id', auth, requireAdmin, updateProduct);
router.delete('/:id', auth, requireAdmin, deleteProduct);

export default router;
