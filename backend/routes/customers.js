const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerCommunication,
  addCustomerNote,
  updateLeadScore,
  getCustomerAnalytics,
  getHighValueCustomers,
  bulkUpdateCustomers
} = require('../controllers/customerController');

const { protect } = require('../middleware/auth');

// Validation rules
const customerValidation = [
  body('name.first')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('name.last')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('status')
    .optional()
    .isIn(['lead', 'prospect', 'customer', 'inactive'])
    .withMessage('Invalid status'),
  body('leadStatus')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('Invalid lead status'),
  body('source')
    .optional()
    .isIn(['website', 'social_media', 'email', 'referral', 'advertising', 'direct', 'other'])
    .withMessage('Invalid source')
];

const communicationValidation = [
  body('type')
    .isIn(['email', 'call', 'meeting', 'social_post', 'website_visit'])
    .withMessage('Invalid communication type'),
  body('direction')
    .isIn(['inbound', 'outbound'])
    .withMessage('Direction must be inbound or outbound'),
  body('subject')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('content')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Content cannot exceed 1000 characters'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('outcome')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Outcome cannot exceed 500 characters')
];

const noteValidation = [
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ max: 1000 })
    .withMessage('Note cannot exceed 1000 characters')
];

const leadScoreValidation = [
  body('factors')
    .isObject()
    .withMessage('Factors must be an object'),
  body('factors.emailOpened')
    .optional()
    .isBoolean()
    .withMessage('Email opened must be boolean'),
  body('factors.websiteVisited')
    .optional()
    .isBoolean()
    .withMessage('Website visited must be boolean'),
  body('factors.contentDownloaded')
    .optional()
    .isBoolean()
    .withMessage('Content downloaded must be boolean'),
  body('factors.socialEngaged')
    .optional()
    .isBoolean()
    .withMessage('Social engaged must be boolean'),
  body('factors.purchased')
    .optional()
    .isBoolean()
    .withMessage('Purchased must be boolean')
];

// Routes

// Get all customers
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['lead', 'prospect', 'customer', 'inactive']).withMessage('Invalid status'),
  query('leadStatus').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).withMessage('Invalid lead status'),
  query('source').optional().isIn(['website', 'social_media', 'email', 'referral', 'advertising', 'direct', 'other']).withMessage('Invalid source'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty'),
  query('sortBy').optional().isIn(['name', 'email', 'createdAt', 'leadScore', 'totalValue']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], getCustomers);

// Get customer analytics
router.get('/analytics', protect, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], getCustomerAnalytics);

// Get high-value customers
router.get('/high-value', protect, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], getHighValueCustomers);

// Get single customer
router.get('/:id', protect, getCustomer);

// Create customer
router.post('/', protect, customerValidation, createCustomer);

// Update customer
router.put('/:id', protect, customerValidation, updateCustomer);

// Delete customer
router.delete('/:id', protect, deleteCustomer);

// Add customer communication
router.post('/:id/communication', protect, communicationValidation, addCustomerCommunication);

// Add customer note
router.post('/:id/note', protect, noteValidation, addCustomerNote);

// Update lead score
router.put('/:id/lead-score', protect, leadScoreValidation, updateLeadScore);

// Bulk update customers
router.put('/bulk/update', protect, [
  body('customerIds')
    .isArray({ min: 1 })
    .withMessage('Customer IDs array is required'),
  body('customerIds.*')
    .isMongoId()
    .withMessage('Invalid customer ID'),
  body('updates')
    .isObject()
    .withMessage('Updates must be an object')
], bulkUpdateCustomers);

module.exports = router;


