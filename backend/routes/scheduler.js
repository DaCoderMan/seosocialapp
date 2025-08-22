const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  initializeScheduler,
  getSchedulerStatus,
  getScheduledJobs,
  createScheduledJob,
  updateScheduledJob,
  cancelScheduledJob,
  pauseScheduler,
  resumeScheduler,
  getJobLogs,
  getSchedulerStats,
  bulkCancelJobs
} = require('../controllers/schedulerController');

const { protect } = require('../middleware/auth');

// Validation rules
const scheduledJobValidation = [
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters'),
  body('platforms')
    .isArray({ min: 1 })
    .withMessage('At least one platform is required'),
  body('platforms.*')
    .isIn(['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'])
    .withMessage('Invalid platform'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
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
    .withMessage('Mentions must be an array')
];

// Routes

// Initialize scheduler
router.post('/initialize', protect, initializeScheduler);

// Get scheduler status
router.get('/status', protect, getSchedulerStatus);

// Get scheduler statistics
router.get('/stats', protect, getSchedulerStats);

// Get scheduled jobs
router.get('/jobs', protect, [
  query('platform').optional().isIn(['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube']).withMessage('Invalid platform'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getScheduledJobs);

// Create scheduled job
router.post('/jobs', protect, scheduledJobValidation, createScheduledJob);

// Update scheduled job
router.put('/jobs/:id', protect, scheduledJobValidation, updateScheduledJob);

// Cancel scheduled job
router.delete('/jobs/:id', protect, cancelScheduledJob);

// Bulk cancel jobs
router.post('/jobs/bulk-cancel', protect, [
  body('jobIds')
    .isArray({ min: 1 })
    .withMessage('Job IDs array is required'),
  body('jobIds.*')
    .isMongoId()
    .withMessage('Invalid job ID')
], bulkCancelJobs);

// Get job logs
router.get('/jobs/:id/logs', protect, [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getJobLogs);

// Pause scheduler
router.put('/pause', protect, pauseScheduler);

// Resume scheduler
router.put('/resume', protect, resumeScheduler);

module.exports = router;


