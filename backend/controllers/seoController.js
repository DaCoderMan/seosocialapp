const SEOAnalysis = require('../models/SEOAnalysis');
const Product = require('../models/Product');
const axios = require('axios');
const cheerio = require('cheerio');
const { validationResult } = require('express-validator');

exports.analyzeUrl = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { url, analysisType = 'page', productId } = req.body;

    // Start analysis
    const analysis = await SEOAnalysis.create({
      url,
      analysisType,
      product: productId || null,
      status: 'running',
      createdBy: req.user.id
    });

    try {
      // Perform the analysis
      const analysisResults = await this.performSEOAnalysis(url);

      // Update analysis with results
      analysis.results = analysisResults;
      analysis.status = 'completed';
      await analysis.save();

      res.status(200).json({
        success: true,
        message: 'SEO analysis completed successfully',
        data: analysis
      });
    } catch (analysisError) {
      analysis.status = 'failed';
      analysis.error = analysisError.message;
      await analysis.save();

      res.status(400).json({
        success: false,
        message: 'SEO analysis failed',
        error: analysisError.message
      });
    }
  } catch (error) {
    console.error('SEO analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during SEO analysis',
      error: error.message
    });
  }
};

exports.getAnalysis = async (req, res, next) => {
  try {
    const analysis = await SEOAnalysis.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('product', 'name');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'SEO analysis not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analysis',
      error: error.message
    });
  }
};

exports.getAnalysisHistory = async (req, res, next) => {
  try {
    const { url, limit = 10 } = req.query;

    const query = {
      createdBy: req.user.id,
      status: 'completed'
    };

    if (url) query.url = url;

    const analyses = await SEOAnalysis.find(query)
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: analyses
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analysis history',
      error: error.message
    });
  }
};

exports.getKeywordSuggestions = async (req, res, next) => {
  try {
    const { keyword, location = 'US', language = 'en' } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required'
      });
    }

    // Use Google Keyword Planner API or similar service
    const keywordData = await this.researchKeywords(keyword, location, language);

    res.status(200).json({
      success: true,
      data: keywordData
    });
  } catch (error) {
    console.error('Keyword suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting keyword suggestions',
      error: error.message
    });
  }
};

exports.optimizeContent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, targetKeyword, title, description } = req.body;

    const optimization = await this.generateContentOptimization(content, targetKeyword, title, description);

    res.status(200).json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('Content optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error optimizing content',
      error: error.message
    });
  }
};

exports.getSEORecommendations = async (req, res, next) => {
  try {
    const { productId } = req.query;

    const recommendations = await this.generateSEORecommendations(productId);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('SEO recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting SEO recommendations',
      error: error.message
    });
  }
};

exports.updateAnalysisRecommendation = async (req, res, next) => {
  try {
    const { id, recommendationId, completed } = req.body;

    const analysis = await SEOAnalysis.findOne({
      _id: id,
      createdBy: req.user.id
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'SEO analysis not found'
      });
    }

    await analysis.completeRecommendation(recommendationId);

    res.status(200).json({
      success: true,
      message: 'Recommendation updated successfully',
      data: analysis
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating recommendation',
      error: error.message
    });
  }
};

exports.getSEOMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      createdBy: req.user.id,
      status: 'completed'
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const metrics = await SEOAnalysis.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          averageTitleScore: { $avg: '$results.title.score' },
          averageDescriptionScore: { $avg: '$results.metaDescription.score' },
          averageTechnicalScore: { $avg: '$results.technical.score' },
          analysesByType: {
            $push: '$analysisType'
          }
        }
      }
    ]);

    const result = metrics[0] || {
      totalAnalyses: 0,
      averageScore: 0,
      averageTitleScore: 0,
      averageDescriptionScore: 0,
      averageTechnicalScore: 0,
      analysesByType: []
    };

    // Get trend data
    const trendData = await SEOAnalysis.find(query)
      .sort({ createdAt: 1 })
      .select('overallScore createdAt');

    res.status(200).json({
      success: true,
      data: {
        ...result,
        trendData
      }
    });
  } catch (error) {
    console.error('Get SEO metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving SEO metrics',
      error: error.message
    });
  }
};

// Core SEO Analysis Method
exports.performSEOAnalysis = async (url) => {
  try {
    // Fetch page content
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = {};

    // Title Analysis
    const title = $('title').text().trim();
    results.title = this.analyzeTitle(title);

    // Meta Description Analysis
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    results.metaDescription = this.analyzeMetaDescription(metaDescription);

    // Headings Analysis
    results.headings = this.analyzeHeadings($);

    // Content Analysis
    const bodyText = $('body').text();
    results.content = this.analyzeContent(bodyText);

    // Images Analysis
    results.images = this.analyzeImages($);

    // Links Analysis
    results.links = this.analyzeLinks($);

    // Technical SEO Analysis
    results.technical = this.analyzeTechnical($, response);

    // Performance Analysis (basic)
    results.performance = this.analyzePerformance(response);

    return results;
  } catch (error) {
    throw new Error(`Failed to analyze URL: ${error.message}`);
  }
};

// Helper Methods for Analysis
exports.analyzeTitle = (title) => {
  const score = this.calculateTitleScore(title);
  const suggestions = [];

  if (!title) {
    suggestions.push('Add a title tag to your page');
  } else {
    if (title.length < 30) suggestions.push('Title is too short (aim for 30-60 characters)');
    if (title.length > 60) suggestions.push('Title is too long (aim for 30-60 characters)');
  }

  return {
    content: title,
    length: title.length,
    score,
    suggestions
  };
};

exports.analyzeMetaDescription = (description) => {
  const score = this.calculateMetaDescriptionScore(description);
  const suggestions = [];

  if (!description) {
    suggestions.push('Add a meta description tag');
  } else {
    if (description.length < 120) suggestions.push('Meta description is too short (aim for 120-160 characters)');
    if (description.length > 160) suggestions.push('Meta description is too long (aim for 120-160 characters)');
  }

  return {
    content: description,
    length: description.length,
    score,
    suggestions
  };
};

exports.analyzeHeadings = ($) => {
  const h1Tags = $('h1').map((i, el) => $(el).text().trim()).get();
  const h2Tags = $('h2').map((i, el) => $(el).text().trim()).get();
  const h3Tags = $('h3').map((i, el) => $(el).text().trim()).get();

  const score = this.calculateHeadingsScore(h1Tags, h2Tags, h3Tags);
  const suggestions = [];

  if (h1Tags.length === 0) suggestions.push('Add at least one H1 tag');
  if (h1Tags.length > 1) suggestions.push('Use only one H1 tag per page');
  if (h2Tags.length === 0) suggestions.push('Add H2 tags for better content structure');

  return {
    h1: h1Tags.map(text => ({ content: text, length: text.length })),
    h2: h2Tags.map(text => ({ content: text, length: text.length })),
    h3: h3Tags.map(text => ({ content: text, length: text.length })),
    score,
    suggestions
  };
};

exports.analyzeContent = (bodyText) => {
  const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
  const readabilityScore = this.calculateReadabilityScore(bodyText);

  const score = this.calculateContentScore(wordCount, readabilityScore);
  const suggestions = [];

  if (wordCount < 300) suggestions.push('Content is too short (aim for at least 300 words)');
  if (readabilityScore < 60) suggestions.push('Improve content readability');
  if (wordCount > 2000) suggestions.push('Consider breaking up long content');

  return {
    wordCount,
    readabilityScore,
    score,
    suggestions
  };
};

exports.analyzeImages = ($) => {
  const images = $('img').map((i, el) => ({
    src: $(el).attr('src') || '',
    alt: $(el).attr('alt') || ''
  })).get();

  const total = images.length;
  const withAlt = images.filter(img => img.alt.trim()).length;
  const missingAlt = total - withAlt;

  const score = total === 0 ? 100 : (withAlt / total) * 100;
  const suggestions = [];

  if (missingAlt > 0) suggestions.push(`Add alt text to ${missingAlt} images`);
  if (total === 0) suggestions.push('Consider adding relevant images to improve engagement');

  return {
    total,
    withAlt,
    missingAlt,
    score,
    suggestions
  };
};

exports.analyzeLinks = ($) => {
  const links = $('a[href]').map((i, el) => ({
    href: $(el).attr('href'),
    text: $(el).text().trim()
  })).get();

  const internal = links.filter(link => {
    try {
      const url = new URL(link.href, 'http://example.com');
      return url.hostname === 'example.com';
    } catch {
      return link.href.startsWith('/') || link.href.startsWith('#');
    }
  }).length;

  const external = links.length - internal;
  const broken = links.filter(link => !link.href || link.href.trim() === '').length;

  const score = links.length === 0 ? 100 : ((links.length - broken) / links.length) * 100;
  const suggestions = [];

  if (broken > 0) suggestions.push(`Fix ${broken} broken links`);
  if (links.length === 0) suggestions.push('Add relevant links to improve SEO');

  return {
    internal,
    external,
    broken,
    score,
    suggestions
  };
};

exports.analyzeTechnical = ($, response) => {
  const suggestions = [];
  let score = 100;

  // Check for robots.txt
  const hasRobotsTxt = true; // This would need actual checking
  if (!hasRobotsTxt) {
    suggestions.push('Add robots.txt file');
    score -= 20;
  }

  // Check for sitemap
  const hasSitemap = true; // This would need actual checking
  if (!hasSitemap) {
    suggestions.push('Add XML sitemap');
    score -= 15;
  }

  // Check response time
  const responseTime = response.duration || 0;
  if (responseTime > 2000) {
    suggestions.push('Improve page load time (currently ' + responseTime + 'ms)');
    score -= 10;
  }

  // Check mobile friendliness
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    suggestions.push('Add viewport meta tag for mobile friendliness');
    score -= 25;
  }

  // Check SSL
  const isHttps = response.request.protocol === 'https:';
  if (!isHttps) {
    suggestions.push('Use HTTPS for security');
    score -= 20;
  }

  return {
    responseTime,
    mobileFriendly: !!viewport,
    sslCertificate: isHttps,
    robotsTxt: hasRobotsTxt,
    sitemap: hasSitemap,
    score: Math.max(0, score),
    suggestions
  };
};

exports.analyzePerformance = (response) => {
  const responseTime = response.duration || 0;
  const contentSize = response.data.length;

  const suggestions = [];

  if (responseTime > 3000) suggestions.push('Page load time is slow');
  if (contentSize > 2000000) suggestions.push('Page size is large, consider optimization');

  return {
    lighthouseScore: {
      performance: this.calculatePerformanceScore(responseTime, contentSize),
      accessibility: 85, // Placeholder
      bestPractices: 90, // Placeholder
      seo: 88 // Placeholder
    },
    coreWebVitals: {
      lcp: responseTime * 0.8, // Placeholder calculation
      fid: 50, // Placeholder
      cls: 0.05 // Placeholder
    },
    suggestions
  };
};

// Score Calculation Methods
exports.calculateTitleScore = (title) => {
  if (!title) return 0;
  if (title.length >= 30 && title.length <= 60) return 100;
  if (title.length >= 20 && title.length <= 70) return 80;
  return 60;
};

exports.calculateMetaDescriptionScore = (description) => {
  if (!description) return 0;
  if (description.length >= 120 && description.length <= 160) return 100;
  if (description.length >= 100 && description.length <= 170) return 80;
  return 60;
};

exports.calculateHeadingsScore = (h1, h2, h3) => {
  let score = 100;
  if (h1.length === 0) score -= 40;
  if (h1.length > 1) score -= 20;
  if (h2.length === 0) score -= 20;
  if (h3.length > 0) score += 10;
  return Math.max(0, score);
};

exports.calculateContentScore = (wordCount, readability) => {
  let score = 100;
  if (wordCount < 300) score -= 30;
  if (readability < 60) score -= 20;
  if (wordCount > 2000) score -= 10;
  return Math.max(0, score);
};

exports.calculatePerformanceScore = (responseTime, contentSize) => {
  let score = 100;
  if (responseTime > 3000) score -= 30;
  if (contentSize > 2000000) score -= 20;
  return Math.max(0, score);
};

exports.calculateReadabilityScore = (text) => {
  // Simple readability calculation (Flesch Reading Ease)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + (word.match(/[aeiouy]{1,2}/gi) || []).length;
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const readability = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, readability));
};

// Keyword Research Method
exports.researchKeywords = async (keyword, location = 'US', language = 'en') => {
  // This is a simplified keyword research implementation
  // In a real application, you would integrate with Google Keyword Planner,
  // SEMrush, Ahrefs, or similar services

  const baseKeywords = [
    keyword,
    `${keyword} services`,
    `${keyword} tools`,
    `${keyword} software`,
    `best ${keyword}`,
    `${keyword} online`,
    `${keyword} free`,
    `${keyword} tutorial`,
    `${keyword} guide`,
    `${keyword} tips`
  ];

  const keywordData = baseKeywords.map((kw, index) => ({
    keyword: kw,
    searchVolume: Math.floor(Math.random() * 10000) + 100,
    difficulty: Math.floor(Math.random() * 80) + 20,
    currentRanking: Math.floor(Math.random() * 50) + 1,
    opportunity: Math.floor(Math.random() * 80) + 20,
    competition: Math.random() > 0.5 ? 'High' : 'Medium',
    cpc: Math.random() * 5 + 0.5
  }));

  return {
    keyword,
    relatedKeywords: keywordData,
    totalSearchVolume: keywordData.reduce((sum, kw) => sum + kw.searchVolume, 0),
    averageDifficulty: keywordData.reduce((sum, kw) => sum + kw.difficulty, 0) / keywordData.length
  };
};

// Content Optimization Method
exports.generateContentOptimization = async (content, targetKeyword, title, description) => {
  const suggestions = [];

  // Keyword density analysis
  const words = content.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word =>
    word.includes(targetKeyword.toLowerCase())
  ).length;

  const keywordDensity = (keywordCount / words.length) * 100;

  if (keywordDensity < 1) {
    suggestions.push(`Increase keyword "${targetKeyword}" usage (currently ${keywordDensity.toFixed(2)}%)`);
  } else if (keywordDensity > 3) {
    suggestions.push(`Reduce keyword "${targetKeyword}" usage to avoid keyword stuffing (currently ${keywordDensity.toFixed(2)}%)`);
  }

  // Title optimization
  if (!title.toLowerCase().includes(targetKeyword.toLowerCase())) {
    suggestions.push(`Include primary keyword "${targetKeyword}" in the title`);
  }

  // Description optimization
  if (!description.toLowerCase().includes(targetKeyword.toLowerCase())) {
    suggestions.push(`Include primary keyword "${targetKeyword}" in the meta description`);
  }

  // Content length
  if (words.length < 300) {
    suggestions.push('Expand content to at least 300 words');
  }

  // Heading optimization
  const headings = content.match(/^#{1,6}\s.+$/gm) || [];
  if (headings.length === 0) {
    suggestions.push('Add proper heading structure (H1, H2, H3)');
  }

  return {
    originalContent: content,
    targetKeyword,
    analysis: {
      wordCount: words.length,
      keywordDensity,
      keywordUsage: keywordCount,
      headingsCount: headings.length
    },
    suggestions,
    optimizedContent: this.generateOptimizedContent(content, targetKeyword, suggestions)
  };
};

exports.generateOptimizedContent = (content, targetKeyword, suggestions) => {
  // This is a simplified content optimization
  // In a real application, you would use AI/ML to generate optimized content
  let optimizedContent = content;

  // Apply basic optimizations based on suggestions
  suggestions.forEach(suggestion => {
    if (suggestion.includes('Increase keyword')) {
      // Add keyword in strategic places
      optimizedContent = optimizedContent.replace(
        /(\.\s)/,
        `. ${targetKeyword} `
      );
    }
  });

  return optimizedContent;
};

// SEO Recommendations Method
exports.generateSEORecommendations = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  const recommendations = [];

  // Title recommendations
  if (!product.seoData.metaTitle) {
    recommendations.push({
      type: 'critical',
      category: 'On-page SEO',
      title: 'Add Meta Title',
      description: 'Create a compelling meta title for better click-through rates',
      impact: 85,
      effort: 'low'
    });
  }

  // Description recommendations
  if (!product.seoData.metaDescription) {
    recommendations.push({
      type: 'critical',
      category: 'On-page SEO',
      title: 'Add Meta Description',
      description: 'Write an engaging meta description to improve search visibility',
      impact: 75,
      effort: 'low'
    });
  }

  // Keyword recommendations
  if (!product.seoData.focusKeyword) {
    recommendations.push({
      type: 'high',
      category: 'Keywords',
      title: 'Set Focus Keyword',
      description: 'Choose a primary keyword to optimize your content around',
      impact: 80,
      effort: 'medium'
    });
  }

  // Image optimization
  if (product.images.some(img => !img.alt)) {
    recommendations.push({
      type: 'medium',
      category: 'Technical SEO',
      title: 'Add Alt Text to Images',
      description: 'Add descriptive alt text to all product images',
      impact: 60,
      effort: 'low'
    });
  }

  // Content recommendations
  if (product.description.length < 300) {
    recommendations.push({
      type: 'medium',
      category: 'Content',
      title: 'Expand Product Description',
      description: 'Write more detailed product descriptions for better SEO',
      impact: 70,
      effort: 'medium'
    });
  }

  return recommendations;
};


