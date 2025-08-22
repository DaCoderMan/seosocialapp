const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    first: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    last: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    name: String,
    title: String,
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  source: {
    type: String,
    enum: ['website', 'social_media', 'email', 'referral', 'advertising', 'direct', 'other'],
    default: 'website'
  },
  socialProfiles: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  interests: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['lead', 'prospect', 'customer', 'inactive'],
    default: 'lead'
  },
  leadStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimeValue: {
    type: Number,
    default: 0,
    min: 0
  },
  orders: [{
    orderId: String,
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded']
    }
  }],
  communications: [{
    type: {
      type: String,
      enum: ['email', 'call', 'meeting', 'social_post', 'website_visit']
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    subject: String,
    content: String,
    date: {
      type: Date,
      default: Date.now
    },
    duration: Number, // for calls/meetings in minutes
    outcome: String
  }],
  preferences: {
    newsletter: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: true },
    smsMarketing: { type: Boolean, default: false },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'social']
    }
  },
  demographics: {
    age: Number,
    gender: String,
    income: String,
    education: String
  },
  lastContact: Date,
  nextFollowUp: Date,
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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
customerSchema.index({ email: 1 });
customerSchema.index({ createdBy: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ leadStatus: 1 });
customerSchema.index({ leadScore: -1 });
customerSchema.index({ source: 1 });
customerSchema.index({ nextFollowUp: 1 });
customerSchema.index({ tags: 1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.name.first} ${this.name.last}`;
});

// Virtual for total orders count
customerSchema.virtual('totalOrders').get(function() {
  return this.orders.length;
});

// Virtual for total spent
customerSchema.virtual('totalSpent').get(function() {
  return this.orders.reduce((total, order) => {
    if (order.status === 'completed') {
      return total + (order.amount || 0);
    }
    return total;
  }, 0);
});

// Virtual for average order value
customerSchema.virtual('averageOrderValue').get(function() {
  const completedOrders = this.orders.filter(order => order.status === 'completed');
  if (completedOrders.length === 0) return 0;
  return this.totalSpent / completedOrders.length;
});

// Virtual for customer lifetime value calculation
customerSchema.virtual('calculatedLifetimeValue').get(function() {
  // Simple CLV calculation: Average order value * Average purchase frequency * Average customer lifespan
  const avgOrderValue = this.averageOrderValue;
  const totalOrders = this.orders.filter(order => order.status === 'completed').length;

  if (totalOrders === 0) return 0;

  // Estimate purchase frequency (orders per year)
  const firstOrder = Math.min(...this.orders.map(o => o.date));
  const lastOrder = Math.max(...this.orders.map(o => o.date));
  const customerLifespanYears = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24 * 365);
  const purchaseFrequency = customerLifespanYears > 0 ? totalOrders / customerLifespanYears : 0;

  // Assume 3-year customer lifespan for estimation
  const estimatedLifespan = 3;
  return avgOrderValue * purchaseFrequency * estimatedLifespan;
});

// Pre-save middleware to update lifetime value
customerSchema.pre('save', function(next) {
  if (this.isModified('orders')) {
    this.totalValue = this.totalSpent;
    this.lifetimeValue = this.calculatedLifetimeValue;
  }
  next();
});

// Instance method to add order
customerSchema.methods.addOrder = function(orderData) {
  this.orders.push({
    ...orderData,
    date: new Date()
  });
  return this.save();
};

// Instance method to add communication
customerSchema.methods.addCommunication = function(communicationData) {
  this.communications.push({
    ...communicationData,
    date: new Date()
  });
  this.lastContact = new Date();
  return this.save();
};

// Instance method to update lead score
customerSchema.methods.updateLeadScore = function(factors) {
  let score = this.leadScore;

  // Engagement factors
  if (factors.emailOpened) score += 5;
  if (factors.websiteVisited) score += 10;
  if (factors.contentDownloaded) score += 15;
  if (factors.socialEngaged) score += 8;
  if (factors.purchased) score += 25;

  // Demographic factors
  if (factors.companySize === '1000+') score += 10;
  if (factors.jobTitle && factors.jobTitle.includes('CEO')) score += 15;

  // Behavioral factors
  if (factors.timeOnSite > 300) score += 10; // 5+ minutes
  if (factors.pagesVisited > 5) score += 10;

  this.leadScore = Math.min(100, Math.max(0, score));
  return this.save();
};

// Static method to get high-value customers
customerSchema.statics.getHighValueCustomers = function(userId, limit = 20) {
  return this.find({ createdBy: userId })
    .sort({ lifetimeValue: -1 })
    .limit(limit);
};

// Static method to get leads by status
customerSchema.statics.getLeadsByStatus = function(userId, status) {
  return this.find({
    createdBy: userId,
    status: 'lead',
    leadStatus: status
  });
};

// Static method to get customer analytics
customerSchema.statics.getCustomerAnalytics = function(userId, startDate, endDate) {
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
        totalCustomers: { $sum: 1 },
        totalRevenue: { $sum: '$totalValue' },
        averageOrderValue: { $avg: '$averageOrderValue' },
        customersBySource: {
          $push: '$source'
        },
        customersByStatus: {
          $push: '$status'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Customer', customerSchema);


