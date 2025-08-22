const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto', 'cash', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'restocked'],
    default: 'unfulfilled'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date,
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  source: {
    type: String,
    enum: ['direct', 'affiliate', 'social_media', 'email', 'advertising', 'referral', 'seo', 'other'],
    default: 'direct'
  },
  affiliateLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AffiliateLink'
  },
  marketing: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
    referrer: String,
    landingPage: String
  },
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
  refunds: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
saleSchema.index({ orderNumber: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ createdBy: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ orderDate: -1 });
saleSchema.index({ source: 1 });
saleSchema.index({ affiliateLink: 1 });

// Virtual for profit margin (assuming 30% cost)
saleSchema.virtual('profitMargin').get(function() {
  const estimatedCost = this.subtotal * 0.3; // 30% cost assumption
  const profit = this.total - estimatedCost;
  return this.total > 0 ? (profit / this.total) * 100 : 0;
});

// Virtual for total refunded amount
saleSchema.virtual('totalRefunded').get(function() {
  return this.refunds.reduce((total, refund) => total + refund.amount, 0);
});

// Virtual for net revenue (after refunds)
saleSchema.virtual('netRevenue').get(function() {
  return this.total - this.totalRefunded;
});

// Pre-save middleware to generate order number
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    let counter = 1;
    let orderNumber;
    let exists;

    do {
      orderNumber = `ORD-${year}${month}${day}-${counter.toString().padStart(4, '0')}`;
      exists = await mongoose.model('Sale').findOne({ orderNumber });
      counter++;
    } while (exists);

    this.orderNumber = orderNumber;
  }

  // Auto-calculate totals
  if (this.isModified('products') || this.isNew) {
    this.subtotal = this.products.reduce((total, item) => {
      return total + (item.price * item.quantity - item.discount);
    }, 0);

    this.total = this.subtotal + this.tax + this.shipping - this.discount;
  }

  next();
});

// Instance method to process refund
saleSchema.methods.processRefund = function(amount, reason, processedBy) {
  this.refunds.push({
    amount,
    reason,
    processedBy
  });

  if (this.totalRefunded >= this.total) {
    this.paymentStatus = 'refunded';
    this.status = 'refunded';
  } else if (this.totalRefunded > 0) {
    this.paymentStatus = 'partially_refunded';
  }

  return this.save();
};

// Instance method to update status
saleSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;

  if (newStatus === 'shipped') {
    this.shippedDate = new Date();
    this.tracking = additionalData.tracking || this.tracking;
  } else if (newStatus === 'delivered') {
    this.deliveredDate = new Date();
  }

  return this.save();
};

// Static method to get sales by date range
saleSchema.statics.getSalesByDateRange = function(userId, startDate, endDate) {
  return this.find({
    createdBy: userId,
    orderDate: { $gte: startDate, $lte: endDate }
  })
  .populate('customer', 'name email')
  .populate('products.product', 'name price')
  .sort({ orderDate: -1 });
};

// Static method to get sales analytics
saleSchema.statics.getSalesAnalytics = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdBy: userId,
        orderDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        netRevenue: { $sum: '$netRevenue' },
        totalRefunds: { $sum: '$totalRefunded' },
        averageOrderValue: { $avg: '$total' },
        salesBySource: {
          $push: '$source'
        },
        salesByStatus: {
          $push: '$status'
        }
      }
    }
  ]);
};

// Static method to get top products
saleSchema.statics.getTopProducts = function(userId, startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        createdBy: userId,
        orderDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $unwind: '$products'
    },
    {
      $group: {
        _id: '$products.product',
        totalQuantity: { $sum: '$products.quantity' },
        totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $unwind: '$productDetails'
    },
    {
      $project: {
        product: '$productDetails',
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1
      }
    }
  ]);
};

// Static method to get revenue trends
saleSchema.statics.getRevenueTrends = function(userId, startDate, endDate, interval = 'daily') {
  let dateFormat;
  let groupBy;

  switch (interval) {
    case 'monthly':
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$orderDate' } };
      break;
    case 'weekly':
      groupBy = { $week: '$orderDate' };
      dateFormat = { $dateToString: { format: '%Y-W%U', date: '$orderDate' } };
      break;
    default: // daily
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } };
  }

  return this.aggregate([
    {
      $match: {
        createdBy: userId,
        orderDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: dateFormat,
        totalRevenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
        netRevenue: { $sum: '$netRevenue' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);


