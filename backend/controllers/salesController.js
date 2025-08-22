const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const AffiliateLink = require('../models/AffiliateLink');
const { validationResult } = require('express-validator');

exports.getSales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      status,
      paymentStatus,
      startDate,
      endDate,
      customer,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      createdBy: req.user.id
    };

    // Add filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customer) query.customer = customer;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sales = await Sale.find(query)
      .populate('customer', 'name.first name.last email')
      .populate('products.product', 'name price')
      .populate('affiliateLink', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(query);

    // Get sales stats
    const stats = await Sale.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          netRevenue: { $sum: '$netRevenue' },
          averageOrderValue: { $avg: '$total' },
          totalRefunds: { $sum: '$totalRefunded' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSales: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        netRevenue: 0,
        averageOrderValue: 0,
        totalRefunds: 0
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving sales',
      error: error.message
    });
  }
};

exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    })
    .populate('customer', 'name email phone company')
    .populate('products.product', 'name price description images')
    .populate('affiliateLink', 'name originalUrl')
    .populate('createdBy', 'username email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving sale',
      error: error.message
    });
  }
};

exports.createSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const saleData = {
      ...req.body,
      createdBy: req.user.id
    };

    // If customer email is provided but customer doesn't exist, create them
    if (req.body.customerEmail && !req.body.customer) {
      let customer = await Customer.findOne({
        email: req.body.customerEmail,
        createdBy: req.user.id
      });

      if (!customer) {
        customer = await Customer.create({
          name: {
            first: req.body.customerName?.split(' ')[0] || 'Unknown',
            last: req.body.customerName?.split(' ').slice(1).join(' ') || 'Customer'
          },
          email: req.body.customerEmail,
          source: 'direct',
          createdBy: req.user.id
        });
      }

      saleData.customer = customer._id;
    }

    const sale = await Sale.create(saleData);

    // Update customer's order history
    if (saleData.customer) {
      await Customer.findByIdAndUpdate(saleData.customer, {
        $push: {
          orders: {
            orderId: sale.orderNumber,
            product: saleData.products[0]?.product,
            amount: sale.total,
            date: sale.orderDate,
            status: 'completed'
          }
        }
      });
    }

    await sale.populate([
      { path: 'customer', select: 'name email' },
      { path: 'products.product', select: 'name price' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating sale',
      error: error.message
    });
  }
};

exports.updateSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('customer', 'name email')
    .populate('products.product', 'name price');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating sale',
      error: error.message
    });
  }
};

exports.updateSaleStatus = async (req, res, next) => {
  try {
    const { status, tracking, shippedDate, deliveredDate } = req.body;

    const sale = await Sale.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    await sale.updateStatus(status, {
      tracking,
      shippedDate,
      deliveredDate
    });

    res.status(200).json({
      success: true,
      message: `Sale status updated to ${status}`,
      data: sale
    });
  } catch (error) {
    console.error('Update sale status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating sale status',
      error: error.message
    });
  }
};

exports.processRefund = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const sale = await Sale.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    if (amount > sale.total - sale.totalRefunded) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds available amount'
      });
    }

    await sale.processRefund(amount, reason, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: sale
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing refund',
      error: error.message
    });
  }
};

exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, interval = 'daily' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await Sale.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          orderDate: { $gte: start, $lte: end }
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
          salesByStatus: {
            $push: '$status'
          },
          salesBySource: {
            $push: '$source'
          }
        }
      }
    ]);

    // Get revenue trends
    const revenueTrends = await Sale.getRevenueTrends(req.user.id, start, end, interval);

    // Get top products
    const topProducts = await Sale.getTopProducts(req.user.id, start, end, 10);

    const result = analytics[0] || {
      totalSales: 0,
      totalRevenue: 0,
      netRevenue: 0,
      totalRefunds: 0,
      averageOrderValue: 0,
      salesByStatus: [],
      salesBySource: []
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        revenueTrends,
        topProducts,
        profitMargin: result.netRevenue > 0 ? ((result.netRevenue / result.totalRevenue) * 100) : 0,
        refundRate: result.totalRevenue > 0 ? ((result.totalRefunds / result.totalRevenue) * 100) : 0,
        period: { start, end }
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving sales analytics',
      error: error.message
    });
  }
};

exports.getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'monthly' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const revenueData = await Sale.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          orderDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy === 'monthly' ?
            { $dateToString: { format: '%Y-%m', date: '$orderDate' } } :
            { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          revenue: { $sum: '$total' },
          netRevenue: { $sum: '$netRevenue' },
          salesCount: { $sum: 1 },
          refunds: { $sum: '$totalRefunded' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating revenue report',
      error: error.message
    });
  }
};

exports.getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const topCustomers = await Sale.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          orderDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
          lastOrderDate: { $max: '$orderDate' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      {
        $unwind: '$customerDetails'
      },
      {
        $project: {
          customer: '$customerDetails',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1,
          lastOrderDate: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving top customers',
      error: error.message
    });
  }
};


