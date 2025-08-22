const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getCategories,
  getStatistics,
  updateProductStatus,
  upload
} = require('../controllers/productController');

const { protect, checkPermission } = require('../middleware/auth');

// Validation rules
const productValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('shortDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),
  body('originalPrice')
    .optional()
    .isNumeric()
    .withMessage('Original price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Original price must be positive'),
  body('seoData.metaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seoData.metaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seoData.slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('seoData.focusKeyword')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Focus keyword must be between 1 and 100 characters')
];

const statusValidation = [
  body('status')
    .isIn(['active', 'inactive', 'draft', 'archived'])
    .withMessage('Invalid status')
];

// Routes

// Get all products with filtering and pagination
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().notEmpty().withMessage('Category cannot be empty'),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'archived']).withMessage('Invalid status'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty'),
  query('sortBy').optional().isIn(['name', 'price', 'createdAt', 'analytics.views']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], getProducts);

// Get product statistics
router.get('/statistics', protect, getStatistics);

// Get product categories
router.get('/categories', protect, getCategories);

// Get single product
router.get('/:id', protect, getProduct);

// Create new product
router.post('/', protect, checkPermission('canManageProducts'), upload.array('images', 10), productValidation, createProduct);

// Update product
router.put('/:id', protect, checkPermission('canManageProducts'), upload.array('images', 10), productValidation, updateProduct);

// Update product status
router.patch('/:id/status', protect, checkPermission('canManageProducts'), statusValidation, updateProductStatus);

// Delete product
router.delete('/:id', protect, checkPermission('canManageProducts'), deleteProduct);

// Upload image
router.post('/upload', protect, checkPermission('canManageProducts'), uploadImage);

module.exports = router;


