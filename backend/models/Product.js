const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  seoData: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true
    }],
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    },
    canonicalUrl: String,
    focusKeyword: String,
    seoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  socialMediaData: {
    facebook: {
      postCount: { type: Number, default: 0 },
      lastPosted: Date,
      engagement: { type: Number, default: 0 }
    },
    twitter: {
      postCount: { type: Number, default: 0 },
      lastPosted: Date,
      engagement: { type: Number, default: 0 }
    },
    instagram: {
      postCount: { type: Number, default: 0 },
      lastPosted: Date,
      engagement: { type: Number, default: 0 }
    },
    linkedin: {
      postCount: { type: Number, default: 0 },
      lastPosted: Date,
      engagement: { type: Number, default: 0 }
    },
    tiktok: {
      postCount: { type: Number, default: 0 },
      lastPosted: Date,
      engagement: { type: Number, default: 0 }
    },
    youtube: {
      postCount: { type: Number, default: 0 },
      lastPosted: Date,
      engagement: { type: Number, default: 0 }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    lastViewed: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'seoData.slug': 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Virtual for total social media posts
productSchema.virtual('totalSocialPosts').get(function() {
  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'];
  return platforms.reduce((total, platform) => {
    return total + (this.socialMediaData[platform]?.postCount || 0);
  }, 0);
});

// Virtual for total social media engagement
productSchema.virtual('totalSocialEngagement').get(function() {
  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'];
  return platforms.reduce((total, platform) => {
    return total + (this.socialMediaData[platform]?.engagement || 0);
  }, 0);
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.seoData.slug) {
    this.seoData.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Static method to get products by category
productSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({ category: category, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get featured products
productSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ status: 'active' })
    .sort({ 'analytics.views': -1 })
    .limit(limit);
};

// Instance method to update social media stats
productSchema.methods.updateSocialStats = function(platform, stats) {
  if (this.socialMediaData[platform]) {
    Object.assign(this.socialMediaData[platform], stats);
  }
  return this.save();
};

// Instance method to increment analytics
productSchema.methods.incrementAnalytics = function(type) {
  if (this.analytics[type] !== undefined) {
    this.analytics[type] += 1;
    this.analytics.lastViewed = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);


