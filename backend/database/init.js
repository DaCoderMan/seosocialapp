const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

const initializeDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workitu-seo-social', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB successfully');

    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });

    if (!adminExists) {
      console.log('Creating admin user...');

      const adminUser = await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@workitu.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          company: 'Workitu Tech'
        },
        permissions: {
          canPost: true,
          canManageProducts: true,
          canViewAnalytics: true,
          canManageUsers: true
        }
      });

      console.log('Admin user created successfully');
      console.log('Username:', adminUser.username);
      console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample products if none exist
    const productCount = await Product.countDocuments();

    if (productCount === 0) {
      console.log('Creating sample products...');

      const sampleProducts = [
        {
          name: 'AI-Powered Code Assistant',
          description: 'Revolutionary AI-powered code assistant that helps developers write better code faster. Features intelligent code completion, error detection, and automated refactoring suggestions.',
          shortDescription: 'AI-powered code assistant for faster development',
          category: 'Software',
          subcategory: 'Development Tools',
          price: 49.99,
          originalPrice: 99.99,
          features: [
            'Intelligent code completion',
            'Real-time error detection',
            'Automated refactoring',
            'Multi-language support',
            'Cloud synchronization'
          ],
          specifications: new Map([
            ['supportedLanguages', 'JavaScript, Python, Java, C++, Go'],
            ['platforms', 'Windows, macOS, Linux'],
            ['license', 'Annual subscription'],
            ['updates', 'Automatic']
          ]),
          seoData: {
            metaTitle: 'AI-Powered Code Assistant - Workitu Tech',
            metaDescription: 'Revolutionary AI-powered code assistant that helps developers write better code faster. Features intelligent code completion and error detection.',
            keywords: ['AI code assistant', 'developer tools', 'code completion', 'programming'],
            focusKeyword: 'AI code assistant'
          },
          tags: ['AI', 'development', 'productivity', 'coding'],
          status: 'active'
        },
        {
          name: 'Cloud Infrastructure Manager',
          description: 'Comprehensive cloud infrastructure management platform that simplifies deployment, monitoring, and scaling of applications across multiple cloud providers.',
          shortDescription: 'Complete cloud infrastructure management solution',
          category: 'Software',
          subcategory: 'Cloud Services',
          price: 199.99,
          features: [
            'Multi-cloud support',
            'Auto-scaling',
            'Real-time monitoring',
            'Cost optimization',
            'Security compliance'
          ],
          specifications: new Map([
            ['cloudProviders', 'AWS, Azure, Google Cloud'],
            ['monitoring', '24/7 real-time'],
            ['security', 'SOC 2 compliant'],
            ['support', 'Enterprise SLA']
          ]),
          seoData: {
            metaTitle: 'Cloud Infrastructure Manager - Workitu Tech',
            metaDescription: 'Comprehensive cloud infrastructure management platform for seamless deployment and monitoring across multiple providers.',
            keywords: ['cloud management', 'infrastructure', 'AWS', 'Azure', 'monitoring'],
            focusKeyword: 'cloud infrastructure management'
          },
          tags: ['cloud', 'infrastructure', 'management', 'monitoring'],
          status: 'active'
        },
        {
          name: 'Data Analytics Dashboard',
          description: 'Advanced data analytics dashboard with interactive visualizations, real-time data processing, and comprehensive reporting capabilities for business intelligence.',
          shortDescription: 'Advanced analytics dashboard for business intelligence',
          category: 'Software',
          subcategory: 'Analytics',
          price: 149.99,
          originalPrice: 299.99,
          features: [
            'Interactive dashboards',
            'Real-time data processing',
            'Custom report builder',
            'Data export capabilities',
            'API integration'
          ],
          specifications: new Map([
            ['dataSources', 'SQL, NoSQL, APIs, Files'],
            ['visualizations', 'Charts, Graphs, Maps, Tables'],
            ['exportFormats', 'PDF, Excel, CSV, JSON'],
            ['users', 'Unlimited']
          ]),
          seoData: {
            metaTitle: 'Data Analytics Dashboard - Workitu Tech',
            metaDescription: 'Advanced data analytics dashboard with interactive visualizations and real-time processing for comprehensive business intelligence.',
            keywords: ['data analytics', 'dashboard', 'business intelligence', 'reporting'],
            focusKeyword: 'data analytics dashboard'
          },
          tags: ['analytics', 'dashboard', 'business intelligence', 'reporting'],
          status: 'active'
        }
      ];

      // Set createdBy to admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        sampleProducts.forEach(product => {
          product.createdBy = adminUser._id;
        });

        await Product.insertMany(sampleProducts);
        console.log(`${sampleProducts.length} sample products created successfully`);
      }
    } else {
      console.log(`${productCount} products already exist in the database`);
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;


