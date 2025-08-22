const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const { validationResult } = require('express-validator');

exports.getCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      status,
      leadStatus,
      source,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      createdBy: req.user.id
    };

    // Add filters
    if (status) query.status = status;
    if (leadStatus) query.leadStatus = leadStatus;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'username email');

    const total = await Customer.countDocuments(query);

    // Get customer stats
    const stats = await Customer.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          averageLeadScore: { $avg: '$leadScore' },
          customersByStatus: {
            $push: '$status'
          },
          customersBySource: {
            $push: '$source'
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCustomers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalCustomers: 0,
        totalValue: 0,
        averageLeadScore: 0,
        customersByStatus: [],
        customersBySource: []
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving customers',
      error: error.message
    });
  }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('createdBy', 'username email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer orders
    const orders = await Sale.find({ customer: customer._id })
      .populate('products.product', 'name price')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        orders
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving customer',
      error: error.message
    });
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const customerData = {
      ...req.body,
      createdBy: req.user.id
    };

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating customer',
      error: error.message
    });
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating customer',
      error: error.message
    });
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting customer',
      error: error.message
    });
  }
};

exports.addCustomerCommunication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.addCommunication(req.body);

    res.status(200).json({
      success: true,
      message: 'Communication added successfully',
      data: customer
    });
  } catch (error) {
    console.error('Add customer communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding communication',
      error: error.message
    });
  }
};

exports.addCustomerNote = async (req, res, next) => {
  try {
    const { content } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.notes.push({
      content,
      createdBy: req.user.id
    });

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: customer
    });
  } catch (error) {
    console.error('Add customer note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding note',
      error: error.message
    });
  }
};

exports.updateLeadScore = async (req, res, next) => {
  try {
    const { factors } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.updateLeadScore(factors);

    res.status(200).json({
      success: true,
      message: 'Lead score updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update lead score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating lead score',
      error: error.message
    });
  }
};

exports.getCustomerAnalytics = async (req, res, next) => {
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

    const analytics = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          averageOrderValue: { $avg: '$averageOrderValue' },
          averageLeadScore: { $avg: '$leadScore' },
          customersByStatus: {
            $push: '$status'
          },
          customersBySource: {
            $push: '$source'
          }
        }
      }
    ]);

    // Get high-value customers
    const highValueCustomers = await Customer.find(query)
      .sort({ lifetimeValue: -1 })
      .limit(10);

    // Get customer acquisition trends
    const acquisitionTrends = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const result = analytics[0] || {
      totalCustomers: 0,
      totalValue: 0,
      averageOrderValue: 0,
      averageLeadScore: 0,
      customersByStatus: [],
      customersBySource: []
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        highValueCustomers,
        acquisitionTrends,
        customerRetentionRate: 75, // Placeholder - would need more complex calculation
        averageCustomerValue: result.averageOrderValue
      }
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving customer analytics',
      error: error.message
    });
  }
};

exports.getHighValueCustomers = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const customers = await Customer.find({ createdBy: req.user.id })
      .sort({ lifetimeValue: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get high value customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving high value customers',
      error: error.message
    });
  }
};

exports.bulkUpdateCustomers = async (req, res, next) => {
  try {
    const { customerIds, updates } = req.body;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer IDs array is required'
      });
    }

    const result = await Customer.updateMany(
      { _id: { $in: customerIds }, createdBy: req.user.id },
      updates
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} customers`,
      data: result
    });
  } catch (error) {
    console.error('Bulk update customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating customers',
      error: error.message
    });
  }
};


