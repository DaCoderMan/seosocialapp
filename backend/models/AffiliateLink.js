const mongoose = require('mongoose');

const affiliateLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Link name is required'],
    trim: true
  },
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    unique: true,
    required: true
  },
  customDomain: {
    type: String,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  affiliateNetwork: {
    type: String,
    enum: ['amazon', 'clickbank', 'shareasale', 'cj_affiliate', 'rakuten', 'custom'],
    default: 'custom'
  },
  commission: {
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    fixed: {
      type: Number,
      min: 0
    }
  },
  tracking: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  expiresAt: Date,
  clickCount: {
    type: Number,
    default: 0
  },
  conversionCount: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  lastClick: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
affiliateLinkSchema.index({ shortCode: 1 });
affiliateLinkSchema.index({ createdBy: 1 });
affiliateLinkSchema.index({ product: 1 });
affiliateLinkSchema.index({ status: 1 });
affiliateLinkSchema.index({ expiresAt: 1 });

// Virtual for conversion rate
affiliateLinkSchema.virtual('conversionRate').get(function() {
  return this.clickCount > 0 ? (this.conversionCount / this.clickCount) * 100 : 0;
});

// Virtual for full affiliate URL
affiliateLinkSchema.virtual('affiliateUrl').get(function() {
  const domain = this.customDomain || process.env.DEFAULT_DOMAIN || 'workitu.com';
  return `https://${domain}/${this.shortCode}`;
});

// Virtual for EPC (Earnings Per Click)
affiliateLinkSchema.virtual('epc').get(function() {
  return this.clickCount > 0 ? this.revenue / this.clickCount : 0;
});

// Generate short code before saving
affiliateLinkSchema.pre('save', async function(next) {
  if (this.isNew && !this.shortCode) {
    let shortCode;
    let exists;
    do {
      shortCode = this.generateShortCode();
      exists = await mongoose.model('AffiliateLink').findOne({ shortCode });
    } while (exists);
    this.shortCode = shortCode;
  }
  next();
});

// Generate random short code
affiliateLinkSchema.methods.generateShortCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Track click
affiliateLinkSchema.methods.trackClick = function(ip, userAgent, referrer) {
  this.clickCount += 1;
  this.lastClick = new Date();
  return this.save();
};

// Track conversion
affiliateLinkSchema.methods.trackConversion = function(amount) {
  this.conversionCount += 1;
  this.revenue += amount;
  return this.save();
};

// Static method to get top performing links
affiliateLinkSchema.statics.getTopPerformers = function(userId, limit = 10) {
  return this.find({ createdBy: userId })
    .populate('product', 'name price')
    .sort({ revenue: -1 })
    .limit(limit);
};

// Static method to get revenue stats
affiliateLinkSchema.statics.getRevenueStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdBy: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: '$clickCount' },
        totalConversions: { $sum: '$conversionCount' },
        totalRevenue: { $sum: '$revenue' },
        avgConversionRate: { $avg: { $cond: [{ $gt: ['$clickCount', 0] }, { $divide: ['$conversionCount', '$clickCount'] }, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('AffiliateLink', affiliateLinkSchema);


