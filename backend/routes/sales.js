const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getSales,
  getSale,
  createSale,
  updateSale,
  updateSaleStatus,
  processRefund,
  getSalesAnalytics,
  getRevenueReport,
  getTopCustomers
} = require('../controllers/salesController');

const { protect } = require('../middleware/auth');

// Validation rules
const saleValidation = [
  body('customer')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),
  body('customerEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid customer email'),
  body('customerName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer name must be between 1 and 100 characters'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  body('products.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('products.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('paymentMethod')
    .isIn(['credit_card', 'paypal', 'bank_transfer', 'crypto', 'cash', 'other'])
    .withMessage('Invalid payment method'),
  body('source')
    .optional()
    .isIn(['direct', 'affiliate', 'social_media', 'email', 'advertising', 'referral', 'seo', 'other'])
    .withMessage('Invalid source'),
  body('affiliateLink')
    .optional()
    .isMongoId()
    .withMessage('Invalid affiliate link ID'),
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('billingAddress')
    .optional()
    .isObject()
    .withMessage('Billing address must be an object')
];

const statusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  body('tracking')
    .optional()
    .isObject()
    .withMessage('Tracking must be an object'),
  body('shippedDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid shipped date'),
  body('deliveredDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid delivered date')
];

const refundValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Routes

// Get all sales
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  query('paymentStatus').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded']).withMessage('Invalid payment status'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('customer').optional().isMongoId().withMessage('Invalid customer ID'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty'),
  query('sortBy').optional().isIn(['orderDate', 'total', 'status', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], getSales);

// Get sales analytics
router.get('/analytics', protect, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('interval').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid interval')
], getSalesAnalytics);

// Get revenue report
router.get('/revenue-report', protect, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('groupBy').optional().isIn(['daily', 'monthly']).withMessage('Group by must be daily or monthly')
], getRevenueReport);

// Get top customers
router.get('/top-customers', protect, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], getTopCustomers);

// Get single sale
router.get('/:id', protect, getSale);

// Create sale
router.post('/', protect, saleValidation, createSale);

// Update sale
router.put('/:id', protect, saleValidation, updateSale);

// Update sale status
router.put('/:id/status', protect, statusValidation, updateSaleStatus);

// Process refund
router.post('/:id/refund', protect, refundValidation, processRefund);

module.exports = router;


