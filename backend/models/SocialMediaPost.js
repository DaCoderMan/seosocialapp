const mongoose = require('mongoose');

const socialMediaPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  platforms: [{
    type: String,
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'],
    required: true
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: String,
    thumbnail: String,
    duration: Number // for videos
  }],
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  mentions: [{
    type: String,
    trim: true
  }],
  links: [{
    url: {
      type: String,
      required: true
    },
    title: String,
    description: String,
    image: String
  }],
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  scheduledDate: {
    type: Date
  },
  publishedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed', 'cancelled'],
    default: 'draft'
  },
  postResults: [{
    platform: {
      type: String,
      enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'],
      required: true
    },
    postId: String,
    url: String,
    publishedAt: Date,
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    },
    error: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending'
    }
  }],
  targeting: {
    demographics: {
      ageMin: Number,
      ageMax: Number,
      gender: [String],
      locations: [String],
      languages: [String]
    },
    interests: [String],
    behaviors: [String]
  },
  budget: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['daily', 'lifetime', 'per_click', 'per_impression']
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analytics: {
    totalReach: { type: Number, default: 0 },
    totalEngagement: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
socialMediaPostSchema.index({ status: 1, scheduledDate: 1 });
socialMediaPostSchema.index({ platforms: 1 });
socialMediaPostSchema.index({ product: 1 });
socialMediaPostSchema.index({ createdBy: 1 });
socialMediaPostSchema.index({ publishedDate: -1 });
socialMediaPostSchema.index({ 'postResults.platform': 1 });

// Virtual for total engagement
socialMediaPostSchema.virtual('totalEngagement').get(function() {
  return this.postResults.reduce((total, result) => {
    const engagement = result.engagement || {};
    return total + (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0);
  }, 0);
});

// Virtual for engagement rate
socialMediaPostSchema.virtual('calculatedEngagementRate').get(function() {
  if (this.analytics.totalReach === 0) return 0;
  return ((this.totalEngagement / this.analytics.totalReach) * 100).toFixed(2);
});

// Virtual for successful posts count
socialMediaPostSchema.virtual('successfulPostsCount').get(function() {
  return this.postResults.filter(result => result.status === 'success').length;
});

// Pre-save middleware to update analytics
socialMediaPostSchema.pre('save', function(next) {
  // Calculate total reach
  this.analytics.totalReach = this.postResults.reduce((total, result) => {
    return total + (result.engagement?.views || 0);
  }, 0);

  // Calculate total engagement
  this.analytics.totalEngagement = this.totalEngagement;

  // Calculate engagement rate
  if (this.analytics.totalReach > 0) {
    this.analytics.engagementRate = (this.analytics.totalEngagement / this.analytics.totalReach) * 100;
  }

  // Calculate click-through rate
  const totalClicks = this.postResults.reduce((total, result) => {
    return total + (result.engagement?.clicks || 0);
  }, 0);

  if (this.analytics.totalReach > 0) {
    this.analytics.clickThroughRate = (totalClicks / this.analytics.totalReach) * 100;
  }

  next();
});

// Static method to get scheduled posts
socialMediaPostSchema.statics.getScheduled = function(date = new Date()) {
  return this.find({
    status: 'scheduled',
    scheduledDate: { $lte: date }
  }).populate('product');
};

// Static method to get posts by platform
socialMediaPostSchema.statics.getByPlatform = function(platform, limit = 20) {
  return this.find({
    platforms: platform,
    status: 'published'
  })
  .sort({ publishedDate: -1 })
  .limit(limit);
};

// Static method to get analytics summary
socialMediaPostSchema.statics.getAnalyticsSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        publishedDate: { $gte: startDate, $lte: endDate },
        status: 'published'
      }
    },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalEngagement: { $sum: '$analytics.totalEngagement' },
        totalReach: { $sum: '$analytics.totalReach' },
        avgEngagementRate: { $avg: '$analytics.engagementRate' }
      }
    }
  ]);
};

// Instance method to update post results
socialMediaPostSchema.methods.updatePostResult = function(platform, resultData) {
  const existingResult = this.postResults.find(r => r.platform === platform);

  if (existingResult) {
    Object.assign(existingResult, resultData);
  } else {
    this.postResults.push({ platform, ...resultData });
  }

  return this.save();
};

// Instance method to mark as published
socialMediaPostSchema.methods.markAsPublished = function(publishedAt = new Date()) {
  this.status = 'published';
  this.publishedDate = publishedAt;

  // Update product social media stats if linked to a product
  if (this.product) {
    this.platforms.forEach(platform => {
      // This would typically update the product's social media stats
      // We'll implement this when we have the product reference
    });
  }

  return this.save();
};

module.exports = mongoose.model('SocialMediaPost', socialMediaPostSchema);


