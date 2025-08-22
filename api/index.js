const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('../backend/routes/auth');
const productRoutes = require('../backend/routes/products');
const socialMediaRoutes = require('../backend/routes/socialMedia');
const seoRoutes = require('../backend/routes/seo');
const affiliateRoutes = require('../backend/routes/affiliate');
const customerRoutes = require('../backend/routes/customers');
const salesRoutes = require('../backend/routes/sales');
const schedulerRoutes = require('../backend/routes/scheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workitu-seo-social';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Workitu SEO & Social Media Management System API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
