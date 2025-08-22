const SocialMediaPost = require('../models/SocialMediaPost');
const Product = require('../models/Product');
const socialMediaService = require('../services/socialMediaService');
const { validationResult } = require('express-validator');

exports.postToPlatform = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { platform } = req.params;
    const { content, media, hashtags, mentions, link, productId, scheduledDate } = req.body;

    // Validate platform
    const supportedPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'];
    if (!supportedPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `Platform ${platform} is not supported`
      });
    }

    // Prepare post data
    const postData = {
      title: req.body.title || 'Social Media Post',
      content,
      media: media || [],
      hashtags: hashtags || [],
      mentions: mentions || [],
      link
    };

    // If this is a scheduled post, save to database
    if (scheduledDate) {
      const scheduledPost = await SocialMediaPost.create({
        ...postData,
        platforms: [platform],
        scheduledDate: new Date(scheduledDate),
        status: 'scheduled',
        createdBy: req.user.id,
        product: productId || null
      });

      return res.status(201).json({
        success: true,
        message: 'Post scheduled successfully',
        data: scheduledPost
      });
    }

    // Post immediately
    const result = await socialMediaService.postToPlatform(platform, postData);

    if (result.success) {
      // Save to database
      const post = await SocialMediaPost.create({
        ...postData,
        platforms: [platform],
        status: 'published',
        publishedDate: new Date(),
        createdBy: req.user.id,
        product: productId || null,
        postResults: [{
          platform,
          postId: result.postId,
          url: result.url,
          publishedAt: new Date(),
          engagement: result.engagement,
          status: 'success'
        }]
      });

      res.status(200).json({
        success: true,
        message: `Successfully posted to ${platform}`,
        data: {
          post,
          result
        }
      });
    } else {
      // Save failed post
      const post = await SocialMediaPost.create({
        ...postData,
        platforms: [platform],
        status: 'failed',
        createdBy: req.user.id,
        product: productId || null,
        postResults: [{
          platform,
          publishedAt: new Date(),
          error: result.error,
          status: 'failed'
        }]
      });

      res.status(400).json({
        success: false,
        message: `Failed to post to ${platform}`,
        error: result.error,
        data: post
      });
    }
  } catch (error) {
    console.error('Post to platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during posting',
      error: error.message
    });
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = {
      createdBy: req.user.id,
      platforms: platform
    };

    // Add filters
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const posts = await SocialMediaPost.find(query)
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SocialMediaPost.countDocuments(query);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving posts',
      error: error.message
    });
  }
};

exports.getScheduledPosts = async (req, res, next) => {
  try {
    const { platform } = req.params;

    const posts = await SocialMediaPost.find({
      createdBy: req.user.id,
      platforms: platform,
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    })
    .populate('product', 'name images')
    .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving scheduled posts',
      error: error.message
    });
  }
};

exports.updateScheduledPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const post = await SocialMediaPost.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Update scheduled post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating scheduled post',
      error: error.message
    });
  }
};

exports.deleteScheduledPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await SocialMediaPost.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
      status: 'scheduled'
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled post deleted successfully'
    });
  } catch (error) {
    console.error('Delete scheduled post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting scheduled post',
      error: error.message
    });
  }
};

exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { postId } = req.query;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const analytics = await socialMediaService.getPlatformAnalytics(platform, postId);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analytics',
      error: error.message
    });
  }
};

exports.getBulkAnalytics = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await SocialMediaPost.find({
      createdBy: req.user.id,
      platforms: platform,
      status: 'published',
      publishedDate: { $gte: startDate }
    }).select('postResults publishedDate');

    const analyticsPromises = posts.map(async (post) => {
      const postResult = post.postResults.find(r => r.platform === platform);
      if (postResult?.postId) {
        try {
          const analytics = await socialMediaService.getPlatformAnalytics(platform, postResult.postId);
          return {
            postId: post._id,
            publishedDate: post.publishedDate,
            analytics
          };
        } catch (error) {
          console.error(`Error getting analytics for post ${post._id}:`, error);
          return {
            postId: post._id,
            publishedDate: post.publishedDate,
            analytics: { error: error.message }
          };
        }
      }
      return null;
    });

    const analyticsResults = (await Promise.all(analyticsPromises)).filter(Boolean);

    res.status(200).json({
      success: true,
      data: analyticsResults
    });
  } catch (error) {
    console.error('Get bulk analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving bulk analytics',
      error: error.message
    });
  }
};

exports.getConnectedAccounts = async (req, res, next) => {
  try {
    // This would typically check which social media accounts are connected
    // For now, return mock data
    const connectedAccounts = {
      facebook: {
        connected: !!process.env.FACEBOOK_ACCESS_TOKEN,
        pageId: process.env.FACEBOOK_PAGE_ID || null,
        lastConnected: new Date()
      },
      twitter: {
        connected: !!process.env.TWITTER_ACCESS_TOKEN,
        username: process.env.TWITTER_USERNAME || null,
        lastConnected: new Date()
      },
      instagram: {
        connected: !!process.env.INSTAGRAM_USERNAME,
        username: process.env.INSTAGRAM_USERNAME || null,
        lastConnected: new Date()
      },
      linkedin: {
        connected: !!process.env.LINKEDIN_ACCESS_TOKEN,
        organizationId: process.env.LINKEDIN_ORGANIZATION_ID || null,
        lastConnected: new Date()
      },
      tiktok: {
        connected: !!process.env.TIKTOK_ACCESS_TOKEN,
        username: process.env.TIKTOK_USERNAME || null,
        lastConnected: new Date()
      },
      youtube: {
        connected: !!process.env.YOUTUBE_ACCESS_TOKEN,
        channelId: process.env.YOUTUBE_CHANNEL_ID || null,
        lastConnected: new Date()
      }
    };

    res.status(200).json({
      success: true,
      data: connectedAccounts
    });
  } catch (error) {
    console.error('Get connected accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving connected accounts',
      error: error.message
    });
  }
};


