const cron = require('node-cron');
const SocialMediaPost = require('../models/SocialMediaPost');
const socialMediaService = require('./socialMediaService');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'scheduler-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/scheduler-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/scheduler.log' })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class SchedulerService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the scheduler service
   */
  async initialize() {
    if (this.isInitialized) {
      logger.info('Scheduler service already initialized');
      return;
    }

    try {
      logger.info('Initializing scheduler service...');

      // Load all scheduled posts from database
      await this.loadScheduledPosts();

      // Start the main scheduler
      this.startScheduler();

      this.isInitialized = true;
      logger.info('Scheduler service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler service:', error);
      throw error;
    }
  }

  /**
   * Start the main scheduler that runs every minute
   */
  startScheduler() {
    // Run every minute to check for scheduled posts
    cron.schedule('* * * * *', async () => {
      try {
        await this.processScheduledPosts();
      } catch (error) {
        logger.error('Error processing scheduled posts:', error);
      }
    });

    logger.info('Main scheduler started - checking for posts every minute');
  }

  /**
   * Load all scheduled posts from database
   */
  async loadScheduledPosts() {
    try {
      const scheduledPosts = await SocialMediaPost.find({
        status: 'scheduled',
        scheduledDate: { $gte: new Date() }
      }).populate('product', 'name');

      logger.info(`Loaded ${scheduledPosts.length} scheduled posts`);

      // Store them in memory for quick access
      this.scheduledJobs.clear();
      scheduledPosts.forEach(post => {
        this.scheduledJobs.set(post._id.toString(), post);
      });
    } catch (error) {
      logger.error('Error loading scheduled posts:', error);
      throw error;
    }
  }

  /**
   * Process scheduled posts that are due
   */
  async processScheduledPosts() {
    const now = new Date();

    try {
      // Find posts that are due to be posted
      const duePosts = await SocialMediaPost.find({
        status: 'scheduled',
        scheduledDate: { $lte: now }
      }).populate('product', 'name');

      if (duePosts.length === 0) {
        return;
      }

      logger.info(`Processing ${duePosts.length} scheduled posts`);

      for (const post of duePosts) {
        try {
          await this.processScheduledPost(post);
        } catch (error) {
          logger.error(`Error processing scheduled post ${post._id}:`, error);

          // Mark post as failed
          await SocialMediaPost.findByIdAndUpdate(post._id, {
            status: 'failed',
            postResults: [{
              platform: post.platforms[0],
              publishedAt: new Date(),
              error: error.message,
              status: 'failed'
            }]
          });
        }
      }
    } catch (error) {
      logger.error('Error in processScheduledPosts:', error);
    }
  }

  /**
   * Process a single scheduled post
   */
  async processScheduledPost(post) {
    logger.info(`Processing scheduled post: ${post._id}`);

    // Update post status to publishing
    await SocialMediaPost.findByIdAndUpdate(post._id, { status: 'publishing' });

    // Post to each platform
    const postResults = [];

    for (const platform of post.platforms) {
      try {
        logger.info(`Posting to ${platform} for post ${post._id}`);

        const result = await socialMediaService.postToPlatform(platform, {
          content: post.content,
          media: post.media,
          hashtags: post.hashtags,
          mentions: post.mentions,
          link: post.links?.[0]?.url
        });

        postResults.push({
          platform,
          postId: result.postId,
          url: result.url,
          publishedAt: new Date(),
          engagement: result.engagement,
          status: 'success'
        });

        logger.info(`Successfully posted to ${platform} for post ${post._id}`);
      } catch (error) {
        logger.error(`Failed to post to ${platform} for post ${post._id}:`, error);

        postResults.push({
          platform,
          publishedAt: new Date(),
          error: error.message,
          status: 'failed'
        });
      }
    }

    // Update post with results
    await SocialMediaPost.findByIdAndUpdate(post._id, {
      status: 'published',
      publishedDate: new Date(),
      postResults
    });

    // Remove from scheduled jobs map
    this.scheduledJobs.delete(post._id.toString());

    logger.info(`Completed processing scheduled post: ${post._id}`);
  }

  /**
   * Schedule a new post
   */
  async schedulePost(postData) {
    try {
      const scheduledPost = await SocialMediaPost.create({
        ...postData,
        status: 'scheduled'
      });

      // Add to scheduled jobs map
      this.scheduledJobs.set(scheduledPost._id.toString(), scheduledPost);

      logger.info(`Scheduled new post: ${scheduledPost._id} for ${scheduledPost.scheduledDate}`);

      return scheduledPost;
    } catch (error) {
      logger.error('Error scheduling post:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled post
   */
  async cancelScheduledPost(postId) {
    try {
      const post = await SocialMediaPost.findByIdAndUpdate(
        postId,
        { status: 'cancelled' },
        { new: true }
      );

      if (post) {
        // Remove from scheduled jobs map
        this.scheduledJobs.delete(postId.toString());
        logger.info(`Cancelled scheduled post: ${postId}`);
      }

      return post;
    } catch (error) {
      logger.error('Error cancelling scheduled post:', error);
      throw error;
    }
  }

  /**
   * Get scheduled posts for a user
   */
  async getScheduledPosts(userId, filters = {}) {
    try {
      const query = {
        createdBy: userId,
        status: 'scheduled'
      };

      // Add date filters
      if (filters.startDate || filters.endDate) {
        query.scheduledDate = {};
        if (filters.startDate) query.scheduledDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.scheduledDate.$lte = new Date(filters.endDate);
      }

      // Add platform filter
      if (filters.platform) {
        query.platforms = filters.platform;
      }

      const posts = await SocialMediaPost.find(query)
        .populate('product', 'name images')
        .sort({ scheduledDate: 1 });

      return posts;
    } catch (error) {
      logger.error('Error getting scheduled posts:', error);
      throw error;
    }
  }

  /**
   * Get scheduler statistics
   */
  async getSchedulerStats(userId) {
    try {
      const stats = await SocialMediaPost.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        scheduled: 0,
        published: 0,
        failed: 0,
        cancelled: 0,
        total: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      // Get upcoming posts (next 7 days)
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const upcoming = await SocialMediaPost.countDocuments({
        createdBy: userId,
        status: 'scheduled',
        scheduledDate: { $lte: weekFromNow }
      });

      result.upcoming = upcoming;

      return result;
    } catch (error) {
      logger.error('Error getting scheduler stats:', error);
      throw error;
    }
  }

  /**
   * Get next scheduled post time
   */
  async getNextScheduledTime(userId) {
    try {
      const nextPost = await SocialMediaPost.findOne({
        createdBy: userId,
        status: 'scheduled'
      })
      .sort({ scheduledDate: 1 })
      .limit(1);

      return nextPost ? nextPost.scheduledDate : null;
    } catch (error) {
      logger.error('Error getting next scheduled time:', error);
      throw error;
    }
  }

  /**
   * Pause scheduler (for maintenance)
   */
  pauseScheduler() {
    logger.info('Scheduler paused');
    // In a real implementation, you might use a flag to stop processing
  }

  /**
   * Resume scheduler
   */
  resumeScheduler() {
    logger.info('Scheduler resumed');
    // In a real implementation, you might use a flag to start processing again
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      scheduledJobsCount: this.scheduledJobs.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SchedulerService();


