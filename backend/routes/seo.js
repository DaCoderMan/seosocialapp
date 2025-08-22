const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  analyzeUrl,
  getAnalysis,
  getAnalysisHistory,
  getKeywordSuggestions,
  optimizeContent,
  getSEORecommendations,
  updateAnalysisRecommendation,
  getSEOMetrics
} = require('../controllers/seoController');

const { protect } = require('../middleware/auth');

// Validation rules
const analyzeUrlValidation = [
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('analysisType')
    .optional()
    .isIn(['page', 'keyword', 'competitor', 'technical'])
    .withMessage('Invalid analysis type'),
  body('productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID')
];

const optimizeContentValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('targetKeyword')
    .notEmpty()
    .withMessage('Target keyword is required'),
  body('title')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Title cannot exceed 60 characters'),
  body('description')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Description cannot exceed 160 characters')
];

const recommendationValidation = [
  body('id')
    .notEmpty()
    .withMessage('Analysis ID is required')
    .isMongoId()
    .withMessage('Invalid analysis ID'),
  body('recommendationId')
    .notEmpty()
    .withMessage('Recommendation ID is required'),
  body('completed')
    .isBoolean()
    .withMessage('Completed must be a boolean value')
];

// Routes
// SEO Analysis
router.post('/analyze', protect, analyzeUrlValidation, analyzeUrl);

// Get single analysis
router.get('/analysis/:id', protect, getAnalysis);

// Get analysis history
router.get('/history', protect, [
  query('url').optional().isURL().withMessage('Invalid URL'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getAnalysisHistory);

// Keyword Research
router.get('/keywords/:keyword', protect, [
  query('location').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid location code'),
  query('language').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid language code')
], getKeywordSuggestions);

// Content Optimization
router.post('/optimize', protect, optimizeContentValidation, optimizeContent);

// SEO Recommendations
router.get('/recommendations', protect, [
  query('productId').optional().isMongoId().withMessage('Invalid product ID')
], getSEORecommendations);

// Update Recommendation
router.put('/recommendation', protect, recommendationValidation, updateAnalysisRecommendation);

// SEO Metrics
router.get('/metrics', protect, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], getSEOMetrics);

module.exports = router;


