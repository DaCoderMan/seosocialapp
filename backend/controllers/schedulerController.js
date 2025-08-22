const schedulerService = require('../services/schedulerService');
const SocialMediaPost = require('../models/SocialMediaPost');
const { validationResult } = require('express-validator');

exports.initializeScheduler = async (req, res, next) => {
  try {
    await schedulerService.initialize();
    res.status(200).json({
      success: true,
      message: 'Scheduler initialized successfully'
    });
  } catch (error) {
    console.error('Scheduler initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize scheduler',
      error: error.message
    });
  }
};

exports.getSchedulerStatus = async (req, res, next) => {
  try {
    const status = schedulerService.getStatus();
    const stats = await schedulerService.getSchedulerStats(req.user.id);
    const nextScheduledTime = await schedulerService.getNextScheduledTime(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        ...status,
        stats,
        nextScheduledTime
      }
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting scheduler status',
      error: error.message
    });
  }
};

exports.getScheduledJobs = async (req, res, next) => {
  try {
    const { platform, startDate, endDate, limit = 20 } = req.query;

    const filters = {};
    if (platform) filters.platform = platform;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const jobs = await schedulerService.getScheduledPosts(req.user.id, filters);

    // Apply limit
    const limitedJobs = jobs.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: limitedJobs,
      pagination: {
        total: jobs.length,
        limit: parseInt(limit),
        hasMore: jobs.length > parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get scheduled jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting scheduled jobs',
      error: error.message
    });
  }
};

exports.createScheduledJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const jobData = {
      ...req.body,
      createdBy: req.user.id
    };

    const job = await schedulerService.schedulePost(jobData);

    res.status(201).json({
      success: true,
      message: 'Job scheduled successfully',
      data: job
    });
  } catch (error) {
    console.error('Create scheduled job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating scheduled job',
      error: error.message
    });
  }
};

exports.updateScheduledJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Find and update the job
    const job = await SocialMediaPost.findOneAndUpdate(
      { _id: id, createdBy: req.user.id, status: 'scheduled' },
      updates,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled job not found'
      });
    }

    // Update in scheduler service
    await schedulerService.loadScheduledPosts();

    res.status(200).json({
      success: true,
      message: 'Scheduled job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update scheduled job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating scheduled job',
      error: error.message
    });
  }
};

exports.cancelScheduledJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await schedulerService.cancelScheduledPost(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled job cancelled successfully',
      data: job
    });
  } catch (error) {
    console.error('Cancel scheduled job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling scheduled job',
      error: error.message
    });
  }
};

exports.pauseScheduler = async (req, res, next) => {
  try {
    schedulerService.pauseScheduler();
    res.status(200).json({
      success: true,
      message: 'Scheduler paused successfully'
    });
  } catch (error) {
    console.error('Pause scheduler error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error pausing scheduler',
      error: error.message
    });
  }
};

exports.resumeScheduler = async (req, res, next) => {
  try {
    schedulerService.resumeScheduler();
    res.status(200).json({
      success: true,
      message: 'Scheduler resumed successfully'
    });
  } catch (error) {
    console.error('Resume scheduler error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resuming scheduler',
      error: error.message
    });
  }
};

exports.getJobLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    // This would typically read from a log file or database
    // For now, return mock data
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: `Job ${id} scheduled successfully`,
        details: { jobId: id, action: 'scheduled' }
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        level: 'info',
        message: `Job ${id} created`,
        details: { jobId: id, action: 'created' }
      }
    ];

    res.status(200).json({
      success: true,
      data: logs.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Get job logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting job logs',
      error: error.message
    });
  }
};

exports.getSchedulerStats = async (req, res, next) => {
  try {
    const stats = await schedulerService.getSchedulerStats(req.user.id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get scheduler stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting scheduler stats',
      error: error.message
    });
  }
};

exports.bulkCancelJobs = async (req, res, next) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Job IDs array is required'
      });
    }

    const cancelledJobs = [];
    const failedJobs = [];

    for (const jobId of jobIds) {
      try {
        const job = await schedulerService.cancelScheduledPost(jobId);
        if (job) {
          cancelledJobs.push(job);
        } else {
          failedJobs.push(jobId);
        }
      } catch (error) {
        failedJobs.push(jobId);
      }
    }

    res.status(200).json({
      success: true,
      message: `Cancelled ${cancelledJobs.length} jobs${failedJobs.length > 0 ? `, ${failedJobs.length} failed` : ''}`,
      data: {
        cancelled: cancelledJobs,
        failed: failedJobs
      }
    });
  } catch (error) {
    console.error('Bulk cancel jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling jobs',
      error: error.message
    });
  }
};


