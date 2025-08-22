const mongoose = require('mongoose');

const seoAnalysisSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    lowercase: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  analysisType: {
    type: String,
    enum: ['page', 'keyword', 'competitor', 'backlink', 'technical'],
    default: 'page'
  },
  results: {
    // On-page SEO
    title: {
      content: String,
      length: Number,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },
    metaDescription: {
      content: String,
      length: Number,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },
    headings: {
      h1: [{
        content: String,
        length: Number
      }],
      h2: [{
        content: String,
        length: Number
      }],
      h3: [{
        content: String,
        length: Number
      }],
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },
    content: {
      wordCount: Number,
      readabilityScore: Number,
      keywordDensity: mongoose.Schema.Types.Mixed,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },
    images: {
      total: Number,
      withAlt: Number,
      missingAlt: Number,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },
    links: {
      internal: Number,
      external: Number,
      broken: Number,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },

    // Technical SEO
    technical: {
      responseTime: Number,
      pageSize: Number,
      mobileFriendly: Boolean,
      sslCertificate: Boolean,
      robotsTxt: Boolean,
      sitemap: Boolean,
      structuredData: Boolean,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },

    // Performance
    performance: {
      lighthouseScore: {
        performance: { type: Number, min: 0, max: 100 },
        accessibility: { type: Number, min: 0, max: 100 },
        bestPractices: { type: Number, min: 0, max: 100 },
        seo: { type: Number, min: 0, max: 100 }
      },
      coreWebVitals: {
        lcp: Number, // Largest Contentful Paint
        fid: Number, // First Input Delay
        cls: Number  // Cumulative Layout Shift
      },
      suggestions: [String]
    },

    // Keywords
    keywords: [{
      keyword: String,
      searchVolume: Number,
      difficulty: { type: Number, min: 0, max: 100 },
      currentRanking: Number,
      targetRanking: Number,
      opportunity: { type: Number, min: 0, max: 100 }
    }],

    // Backlinks
    backlinks: {
      total: Number,
      domains: Number,
      authority: Number,
      toxic: Number,
      score: { type: Number, min: 0, max: 100 },
      suggestions: [String]
    },

    // Competitors
    competitors: [{
      domain: String,
      similarity: { type: Number, min: 0, max: 100 },
      keywords: [String],
      backlinks: Number,
      authority: Number
    }]
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'info'
    },
    category: String,
    title: String,
    description: String,
    impact: { type: Number, min: 0, max: 100 },
    effort: { type: String, enum: ['low', 'medium', 'high'] },
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,
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
seoAnalysisSchema.index({ url: 1 });
seoAnalysisSchema.index({ product: 1 });
seoAnalysisSchema.index({ analysisType: 1 });
seoAnalysisSchema.index({ overallScore: -1 });
seoAnalysisSchema.index({ createdBy: 1 });
seoAnalysisSchema.index({ createdAt: -1 });

// Virtual for grade
seoAnalysisSchema.virtual('grade').get(function() {
  const score = this.overallScore;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
});

// Virtual for critical issues count
seoAnalysisSchema.virtual('criticalIssues').get(function() {
  return this.recommendations.filter(rec => rec.type === 'critical' && !rec.completed).length;
});

// Virtual for completed recommendations
seoAnalysisSchema.virtual('completedRecommendations').get(function() {
  return this.recommendations.filter(rec => rec.completed).length;
});

// Pre-save middleware to calculate overall score
seoAnalysisSchema.pre('save', function(next) {
  if (this.isModified('results')) {
    const scores = [];

    // Collect all available scores
    if (this.results.title?.score !== undefined) scores.push(this.results.title.score);
    if (this.results.metaDescription?.score !== undefined) scores.push(this.results.metaDescription.score);
    if (this.results.headings?.score !== undefined) scores.push(this.results.headings.score);
    if (this.results.content?.score !== undefined) scores.push(this.results.content.score);
    if (this.results.images?.score !== undefined) scores.push(this.results.images.score);
    if (this.results.links?.score !== undefined) scores.push(this.results.links.score);
    if (this.results.technical?.score !== undefined) scores.push(this.results.technical.score);
    if (this.results.performance?.lighthouseScore?.seo !== undefined) scores.push(this.results.performance.lighthouseScore.seo);
    if (this.results.backlinks?.score !== undefined) scores.push(this.results.backlinks.score);

    // Calculate average score
    if (scores.length > 0) {
      this.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
  }

  next();
});

// Static method to get latest analysis for URL
seoAnalysisSchema.statics.getLatestForUrl = function(url, analysisType = 'page') {
  return this.findOne({
    url: url,
    analysisType: analysisType,
    status: 'completed'
  }).sort({ createdAt: -1 });
};

// Static method to get analysis history
seoAnalysisSchema.statics.getHistory = function(url, limit = 10) {
  return this.find({
    url: url,
    status: 'completed'
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get average scores
seoAnalysisSchema.statics.getAverageScores = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdBy: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$overallScore' },
        totalAnalyses: { $sum: 1 },
        averageTitleScore: { $avg: '$results.title.score' },
        averageDescriptionScore: { $avg: '$results.metaDescription.score' },
        averageTechnicalScore: { $avg: '$results.technical.score' }
      }
    }
  ]);
};

// Instance method to add recommendation
seoAnalysisSchema.methods.addRecommendation = function(recommendation) {
  this.recommendations.push(recommendation);
  return this.save();
};

// Instance method to mark recommendation as completed
seoAnalysisSchema.methods.completeRecommendation = function(recommendationId) {
  const recommendation = this.recommendations.id(recommendationId);
  if (recommendation) {
    recommendation.completed = true;
    recommendation.completedAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('SEOAnalysis', seoAnalysisSchema);


