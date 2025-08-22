# Workitu SEO & Social Media Management System

A comprehensive business platform for Workitu.com that combines social media marketing automation, SEO optimization, affiliate marketing, CRM, and revenue intelligence to maximize your business growth and profitability.

## 🚀 Features

### 💰 Money-Making Tools
- **Affiliate Marketing System** - Generate and track affiliate links with commission tracking
- **Sales Tracking** - Monitor revenue, conversions, and business metrics
- **Customer Management (CRM)** - Lead scoring, customer lifecycle management
- **Revenue Intelligence** - Real-time profit analysis and business insights
- **Conversion Rate Optimization** - A/B testing and performance tracking

### 🔐 Authentication & Security
- Secure user authentication with JWT tokens
- Role-based access control (Admin, User)
- Password encryption with bcrypt
- Session management
- Rate limiting and security headers

### 📊 Business Dashboard
- Real-time revenue analytics
- Customer acquisition metrics
- Affiliate performance tracking
- Sales conversion rates
- Quick access to money-making tools

### 🛍️ Product Management
- Add, edit, and manage Workitu products
- SEO optimization for products
- Image management and optimization
- Category and tagging system
- Inventory tracking

### 📱 Social Media Management
- **Multi-platform support:**
  - Facebook
  - Twitter/X
  - Instagram
  - LinkedIn
  - TikTok
  - YouTube
- Automated posting scheduler
- Content calendar
- Engagement tracking
- Media upload and management
- Cross-platform analytics

### 🔍 SEO Optimization
- On-page SEO analysis
- Keyword research and suggestions
- Meta tag optimization
- Content analysis and recommendations
- Performance monitoring
- Backlink analysis
- Competitor analysis

### 📈 Analytics & Reporting
- Comprehensive business analytics dashboard
- Social media performance metrics
- SEO ranking tracking
- Revenue and conversion tracking
- Customer behavior analysis
- Export capabilities

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **node-cron** - Scheduling

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **Context API** - State management

### Business Tools
- **Affiliate Marketing** - Link generation and tracking
- **CRM System** - Customer relationship management
- **Sales Analytics** - Revenue tracking and reporting
- **SEO Tools** - Web scraping with Cheerio
- **Social Media APIs** - Multi-platform integration

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd workitu-seo-social

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

Create `.env` files in both backend and frontend directories:

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/workitu-seo-social
JWT_SECRET=your-super-secret-jwt-key
ADMIN_CREDENTIALS=admin:admin123
DEFAULT_DOMAIN=workitu.com
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:3000
```

### 3. Launch the Application

#### Option A: Using the Launcher Script (Recommended)
```bash
# Windows
launch.bat

# Or manually run:
start-app.ps1
```

#### Option B: Manual Launch
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000 (or http://localhost:5173)
- **Backend API**: http://localhost:5000
- **Default Admin Credentials**:
  - Username: `admin`
  - Password: `admin123`

## 💼 Business Features

### Affiliate Marketing
- Generate unique affiliate links for products
- Track clicks, conversions, and revenue
- Commission rate management
- Performance analytics

### Customer Management (CRM)
- Lead scoring and qualification
- Customer lifecycle tracking
- Contact management
- Sales pipeline visualization

### Sales Tracking
- Revenue monitoring
- Order management
- Payment tracking
- Business intelligence reports

### Revenue Intelligence
- Real-time profit analysis
- Conversion rate optimization
- Customer acquisition cost tracking
- ROI analysis for marketing campaigns

## 🔧 Configuration

### Social Media APIs
Configure your social media API credentials in the backend `.env` file:

```env
# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Twitter/X
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret

# Instagram
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `workitu-seo-social`
3. Update the `MONGODB_URI` in your backend `.env` file

## 📁 Project Structure

```
workitu-seo-social/
├── backend/
│   ├── controllers/     # Business logic handlers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── services/       # External service integrations
│   ├── middleware/     # Custom middleware
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context providers
│   │   ├── services/   # API service functions
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── database/           # Database files and scripts
├── config/            # Configuration files
├── logs/              # Application logs
├── public/            # Public assets
├── launch.bat         # Windows launcher
├── start-app.ps1      # PowerShell launcher
└── README.md          # This file
```

## 🎯 Business Use Cases

### For Workitu.com
1. **Social Media Marketing**: Automate posting across all platforms
2. **SEO Optimization**: Improve search rankings for products
3. **Affiliate Revenue**: Generate income through affiliate marketing
4. **Customer Acquisition**: Track and manage leads effectively
5. **Revenue Tracking**: Monitor business performance in real-time
6. **Marketing Automation**: Streamline marketing workflows

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Rate limiting
- Input validation and sanitization
- Helmet security headers
- Environment variable protection

## 📊 Monitoring & Analytics

- Comprehensive logging with Winston
- Real-time performance monitoring
- Error tracking and reporting
- Business metrics dashboard
- Social media engagement tracking
- SEO performance monitoring

## 🚀 Deployment

### Local Development
Use the provided launcher scripts for easy startup.

### Production Deployment
1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Set up a reverse proxy (nginx)
4. Use PM2 for process management
5. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for Workitu.com

## 🆘 Support

For support and questions:
- Check the documentation
- Review the logs in the `logs/` directory
- Contact the development team

## 🎉 Getting Started with Business Features

1. **Login** with admin credentials
2. **Add Products** to your catalog
3. **Generate Affiliate Links** for revenue
4. **Add Customers** to your CRM
5. **Track Sales** and revenue
6. **Schedule Social Media Posts**
7. **Analyze SEO Performance**
8. **Monitor Business Metrics**

---

**Built for Workitu.com - Maximizing Your Business Growth! 🚀💰**


