const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  postToPlatform,
  getPosts,
  getScheduledPosts,
  updateScheduledPost,
  deleteScheduledPost,
  getPlatformAnalytics,
  getBulkAnalytics,
  getConnectedAccounts
} = require('../controllers/socialMediaController');

const { protect, checkPermission } = require('../middleware/auth');

// Validation rules
const postValidation = [
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters'),
  body('media')
    .optional()
    .isArray()
    .withMessage('Media must be an array'),
  body('hashtags')
    .optional()
    .isArray()
    .withMessage('Hashtags must be an array'),
  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array'),
  body('link')
    .optional()
    .isURL()
    .withMessage('Link must be a valid URL'),
  body('productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO date')
];

const analyticsValidation = [
  query('postId')
    .optional()
    .notEmpty()
    .withMessage('Post ID is required for single post analytics'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Routes
// Get connected social media accounts
router.get('/accounts', protect, getConnectedAccounts);

// Post to platform
router.post('/post/:platform', protect, checkPermission('canPost'), postValidation, postToPlatform);

// Get posts for a platform
router.get('/posts/:platform', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'scheduled', 'published', 'failed']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], getPosts);

// Get scheduled posts
router.get('/scheduled/:platform', protect, getScheduledPosts);

// Update scheduled post
router.put('/scheduled/:id', protect, postValidation, updateScheduledPost);

// Delete scheduled post
router.delete('/scheduled/:id', protect, deleteScheduledPost);

// Get platform analytics
router.get('/analytics/:platform', protect, analyticsValidation, getPlatformAnalytics);

// Get bulk analytics
router.get('/analytics/:platform/bulk', protect, [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], getBulkAnalytics);

module.exports = router;


