const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getAffiliateLinks,
  createAffiliateLink,
  updateAffiliateLink,
  deleteAffiliateLink,
  getAffiliateAnalytics,
  trackAffiliateClick,
  getTopAffiliateLinks
} = require('../controllers/affiliateController');

const { protect } = require('../middleware/auth');

// Validation rules
const affiliateLinkValidation = [
  body('name')
    .notEmpty()
    .withMessage('Link name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('originalUrl')
    .notEmpty()
    .withMessage('Original URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('affiliateNetwork')
    .optional()
    .isIn(['amazon', 'clickbank', 'shareasale', 'cj_affiliate', 'rakuten', 'custom'])
    .withMessage('Invalid affiliate network'),
  body('commission.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percentage must be between 0 and 100'),
  body('commission.fixed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed commission must be positive'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date')
];

// Routes

// Get all affiliate links
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'expired']).withMessage('Invalid status'),
  query('product').optional().isMongoId().withMessage('Invalid product ID'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty')
], getAffiliateLinks);

// Create affiliate link
router.post('/', protect, affiliateLinkValidation, createAffiliateLink);

// Update affiliate link
router.put('/:id', protect, affiliateLinkValidation, updateAffiliateLink);

// Delete affiliate link
router.delete('/:id', protect, deleteAffiliateLink);

// Get affiliate analytics
router.get('/analytics', protect, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], getAffiliateAnalytics);

// Get top affiliate links
router.get('/top', protect, [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], getTopAffiliateLinks);

// Track affiliate click (public route - no auth required)
router.get('/click/:shortCode', trackAffiliateClick);

module.exports = router;


