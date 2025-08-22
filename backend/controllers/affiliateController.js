const AffiliateLink = require('../models/AffiliateLink');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

exports.getAffiliateLinks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      status = 'active',
      product,
      search
    } = req.query;

    // Build query
    const query = {
      createdBy: req.user.id
    };

    if (status) query.status = status;
    if (product) query.product = product;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } }
      ];
    }

    const affiliateLinks = await AffiliateLink.find(query)
      .populate('product', 'name price images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AffiliateLink.countDocuments(query);

    // Get performance stats
    const stats = await AffiliateLink.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clickCount' },
          totalConversions: { $sum: '$conversionCount' },
          totalRevenue: { $sum: '$revenue' },
          activeLinks: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: affiliateLinks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalLinks: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        activeLinks: 0
      }
    });
  } catch (error) {
    console.error('Get affiliate links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving affiliate links',
      error: error.message
    });
  }
};

exports.createAffiliateLink = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const linkData = {
      ...req.body,
      createdBy: req.user.id
    };

    const affiliateLink = await AffiliateLink.create(linkData);

    await affiliateLink.populate('product', 'name price images');

    res.status(201).json({
      success: true,
      message: 'Affiliate link created successfully',
      data: affiliateLink
    });
  } catch (error) {
    console.error('Create affiliate link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating affiliate link',
      error: error.message
    });
  }
};

exports.updateAffiliateLink = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const affiliateLink = await AffiliateLink.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('product', 'name price images');

    if (!affiliateLink) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate link not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Affiliate link updated successfully',
      data: affiliateLink
    });
  } catch (error) {
    console.error('Update affiliate link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating affiliate link',
      error: error.message
    });
  }
};

exports.deleteAffiliateLink = async (req, res, next) => {
  try {
    const affiliateLink = await AffiliateLink.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!affiliateLink) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate link not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Affiliate link deleted successfully'
    });
  } catch (error) {
    console.error('Delete affiliate link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting affiliate link',
      error: error.message
    });
  }
};

exports.getAffiliateAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      createdBy: req.user.id
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const analytics = await AffiliateLink.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          totalClicks: { $sum: '$clickCount' },
          totalConversions: { $sum: '$conversionCount' },
          totalRevenue: { $sum: '$revenue' },
          averageConversionRate: {
            $avg: {
              $cond: [{ $gt: ['$clickCount', 0] }, { $divide: ['$conversionCount', '$clickCount'] }, 0]
            }
          },
          averageEPC: {
            $avg: {
              $cond: [{ $gt: ['$clickCount', 0] }, { $divide: ['$revenue', '$clickCount'] }, 0]
            }
          }
        }
      }
    ]);

    // Get top performing links
    const topLinks = await AffiliateLink.find(query)
      .populate('product', 'name')
      .sort({ revenue: -1 })
      .limit(10);

    // Get revenue trends by date
    const revenueTrends = await AffiliateLink.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$revenue' },
          clicks: { $sum: '$clickCount' },
          conversions: { $sum: '$conversionCount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const result = analytics[0] || {
      totalLinks: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      averageConversionRate: 0,
      averageEPC: 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        topLinks,
        revenueTrends,
        conversionRate: result.averageConversionRate * 100,
        estimatedMonthlyRevenue: result.averageEPC * result.totalClicks
      }
    });
  } catch (error) {
    console.error('Get affiliate analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving affiliate analytics',
      error: error.message
    });
  }
};

exports.trackAffiliateClick = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const { referrer, userAgent } = req.headers;
    const ip = req.ip || req.connection.remoteAddress;

    const affiliateLink = await AffiliateLink.findOne({ shortCode });

    if (!affiliateLink) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate link not found'
      });
    }

    // Track the click
    await affiliateLink.trackClick(ip, userAgent, referrer);

    // Redirect to original URL
    res.redirect(affiliateLink.originalUrl);
  } catch (error) {
    console.error('Track affiliate click error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking affiliate click',
      error: error.message
    });
  }
};

exports.getTopAffiliateLinks = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const topLinks = await AffiliateLink.find({ createdBy: req.user.id })
      .populate('product', 'name price')
      .sort({ revenue: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: topLinks
    });
  } catch (error) {
    console.error('Get top affiliate links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving top affiliate links',
      error: error.message
    });
  }
};


