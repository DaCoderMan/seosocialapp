const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Optional dependencies - handle gracefully if not installed
let TwitterApi;
let IgApiClient;

try {
  TwitterApi = require('twitter-api-v2').default;
} catch (error) {
  console.log('Twitter API not available - Twitter features disabled');
}

try {
  const instagram = require('instagram-private-api');
  IgApiClient = instagram.IgApiClient;
} catch (error) {
  console.log('Instagram API not available - Instagram features disabled');
}

class SocialMediaService {
  constructor() {
    this.platforms = {
      facebook: this.facebookService.bind(this),
      twitter: this.twitterService.bind(this),
      instagram: this.instagramService.bind(this),
      linkedin: this.linkedinService.bind(this),
      tiktok: this.tiktokService.bind(this),
      youtube: this.youtubeService.bind(this)
    };
  }

  /**
   * Main method to post to a specific platform
   */
  async postToPlatform(platform, postData, credentials = null) {
    try {
      if (!this.platforms[platform]) {
        throw new Error(`Platform ${platform} is not supported`);
      }

      const service = this.platforms[platform];
      const result = await service(postData, credentials);

      return {
        success: true,
        platform,
        postId: result.postId,
        url: result.url,
        engagement: result.engagement || {},
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error(`Error posting to ${platform}:`, error);
      return {
        success: false,
        platform,
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Facebook API Service
   */
  async facebookService(postData, credentials) {
    const { content, media, link } = postData;
    const accessToken = credentials?.accessToken || process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = credentials?.pageId || process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      throw new Error('Facebook credentials not configured');
    }

    try {
      let postParams = {
        message: content,
        access_token: accessToken
      };

      // Add link if provided
      if (link) {
        postParams.link = link;
      }

      // Handle media uploads
      if (media && media.length > 0) {
        const mediaIds = [];

        for (const mediaItem of media) {
          if (mediaItem.type === 'image') {
            // Upload photo
            const photoResponse = await axios.post(
              `https://graph.facebook.com/${pageId}/photos`,
              {
                url: mediaItem.url,
                access_token: accessToken,
                published: false
              }
            );

            if (photoResponse.data.id) {
              mediaIds.push({ media_fbid: photoResponse.data.id });
            }
          } else if (mediaItem.type === 'video') {
            // Upload video
            const videoResponse = await axios.post(
              `https://graph.facebook.com/${pageId}/videos`,
              {
                file_url: mediaItem.url,
                access_token: accessToken,
                published: false
              }
            );

            if (videoResponse.data.id) {
              mediaIds.push({ media_fbid: videoResponse.data.id });
            }
          }
        }

        if (mediaIds.length > 0) {
          postParams.attached_media = mediaIds;
        }
      }

      // Create the post
      const response = await axios.post(
        `https://graph.facebook.com/${pageId}/feed`,
        postParams
      );

      return {
        postId: response.data.id,
        url: `https://facebook.com/${response.data.id}`,
        engagement: { likes: 0, comments: 0, shares: 0 }
      };
    } catch (error) {
      throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Twitter/X API Service
   */
  async twitterService(postData, credentials) {
    const { content, media } = postData;

    if (!TwitterApi) {
      throw new Error('Twitter API is not available. Please install twitter-api-v2 package.');
    }

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: credentials?.apiKey || process.env.TWITTER_API_KEY,
      appSecret: credentials?.apiSecret || process.env.TWITTER_API_SECRET,
      accessToken: credentials?.accessToken || process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: credentials?.accessTokenSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    if (!client) {
      throw new Error('Twitter credentials not configured');
    }

    try {
      let mediaIds = [];

      // Upload media if provided
      if (media && media.length > 0) {
        for (const mediaItem of media) {
          try {
            // Download media to buffer
            const mediaResponse = await axios.get(mediaItem.url, {
              responseType: 'arraybuffer'
            });

            const mediaId = await client.v1.uploadMedia(Buffer.from(mediaResponse.data), {
              mimeType: this.getMimeType(mediaItem.url)
            });

            mediaIds.push(mediaId);
          } catch (mediaError) {
            console.error('Twitter media upload error:', mediaError);
          }
        }
      }

      // Create tweet
      const tweetData = {
        text: content
      };

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      const tweet = await client.v2.tweet(tweetData);

      return {
        postId: tweet.data.id,
        url: `https://twitter.com/i/status/${tweet.data.id}`,
        engagement: { likes: 0, retweets: 0, replies: 0 }
      };
    } catch (error) {
      throw new Error(`Twitter API error: ${error.message}`);
    }
  }

  /**
   * Instagram API Service
   */
  async instagramService(postData, credentials) {
    const { content, media } = postData;

    if (!IgApiClient) {
      throw new Error('Instagram API is not available. Please install instagram-private-api package.');
    }

    const ig = new IgApiClient();
    ig.state.generateDevice(credentials?.username || process.env.INSTAGRAM_USERNAME);

    try {
      // Login
      await ig.account.login(
        credentials?.username || process.env.INSTAGRAM_USERNAME,
        credentials?.password || process.env.INSTAGRAM_PASSWORD
      );

      if (media && media.length > 0) {
        const mediaItem = media[0]; // Instagram typically allows one media per post

        // Download media
        const mediaResponse = await axios.get(mediaItem.url, {
          responseType: 'arraybuffer'
        });

        const mediaBuffer = Buffer.from(mediaResponse.data);

        let publishResult;

        if (mediaItem.type === 'image') {
          // Upload photo
          publishResult = await ig.publish.photo({
            file: mediaBuffer,
            caption: content
          });
        } else if (mediaItem.type === 'video') {
          // Upload video
          publishResult = await ig.publish.video({
            video: mediaBuffer,
            caption: content
          });
        }

        return {
          postId: publishResult.media.id,
          url: `https://instagram.com/p/${publishResult.media.code}`,
          engagement: { likes: 0, comments: 0 }
        };
      } else {
        // Text-only post (Instagram requires media)
        throw new Error('Instagram posts require media');
      }
    } catch (error) {
      throw new Error(`Instagram API error: ${error.message}`);
    }
  }

  /**
   * LinkedIn API Service
   */
  async linkedinService(postData, credentials) {
    const { content, media, link } = postData;
    const accessToken = credentials?.accessToken || process.env.LINKEDIN_ACCESS_TOKEN;
    const organizationId = credentials?.organizationId || process.env.LINKEDIN_ORGANIZATION_ID;

    if (!accessToken) {
      throw new Error('LinkedIn credentials not configured');
    }

    try {
      const postData = {
        author: `urn:li:organization:${organizationId || 'your-organization-id'}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: media && media.length > 0 ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Add media if provided
      if (media && media.length > 0) {
        const mediaItem = media[0];

        // Upload media first
        const registerUploadResponse = await axios.post(
          'https://api.linkedin.com/v2/assets?action=registerUpload',
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: `urn:li:organization:${organizationId}`,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (registerUploadResponse.data.value) {
          const uploadUrl = registerUploadResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;

          // Download and upload media
          const mediaResponse = await axios.get(mediaItem.url, {
            responseType: 'arraybuffer'
          });

          await axios.post(uploadUrl, Buffer.from(mediaResponse.data), {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/octet-stream'
            }
          });

          postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
            {
              status: 'READY',
              description: {
                text: mediaItem.alt || 'Post media'
              },
              media: registerUploadResponse.data.value.asset,
              title: {
                text: 'Post Media'
              }
            }
          ];
        }
      }

      // Create the post
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        postId: response.data.id,
        url: `https://linkedin.com/feed/update/${response.data.id}`,
        engagement: { likes: 0, comments: 0, shares: 0 }
      };
    } catch (error) {
      throw new Error(`LinkedIn API error: ${error.response?.data?.serviceErrorCode?.message || error.message}`);
    }
  }

  /**
   * TikTok API Service
   */
  async tiktokService(postData, credentials) {
    const { content, media } = postData;
    const accessToken = credentials?.accessToken || process.env.TIKTOK_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('TikTok credentials not configured');
    }

    try {
      // TikTok API is more complex and requires specific setup
      // This is a simplified implementation
      if (!media || media.length === 0) {
        throw new Error('TikTok posts require video media');
      }

      const mediaItem = media[0];

      // Download video
      const videoResponse = await axios.get(mediaItem.url, {
        responseType: 'arraybuffer'
      });

      // For TikTok, you would typically use their SDK or direct API
      // This is a placeholder implementation
      const response = await axios.post(
        'https://open-api.tiktok.com/share/video/upload/',
        {
          video: Buffer.from(videoResponse.data),
          description: content
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        postId: response.data.data.video_id || 'tiktok-post-id',
        url: `https://tiktok.com/@username/video/${response.data.data.video_id}`,
        engagement: { likes: 0, comments: 0, shares: 0, views: 0 }
      };
    } catch (error) {
      throw new Error(`TikTok API error: ${error.message}`);
    }
  }

  /**
   * YouTube API Service
   */
  async youtubeService(postData, credentials) {
    const { content, media } = postData;

    // YouTube API requires OAuth2 setup
    // This is a simplified implementation
    if (!media || media.length === 0 || media[0].type !== 'video') {
      throw new Error('YouTube posts require video media');
    }

    const mediaItem = media[0];

    try {
      // Download video
      const videoResponse = await axios.get(mediaItem.url, {
        responseType: 'arraybuffer'
      });

      // YouTube API implementation would go here
      // This requires Google APIs and OAuth2 setup
      const response = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos',
        {
          snippet: {
            title: mediaItem.title || 'Uploaded Video',
            description: content,
            tags: postData.hashtags || [],
            categoryId: '22' // Entertainment category
          },
          status: {
            privacyStatus: 'public'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials?.accessToken || process.env.YOUTUBE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          params: {
            part: 'snippet,status',
            uploadType: 'multipart'
          }
        }
      );

      return {
        postId: response.data.id,
        url: `https://youtube.com/watch?v=${response.data.id}`,
        engagement: { likes: 0, dislikes: 0, comments: 0, views: 0 }
      };
    } catch (error) {
      throw new Error(`YouTube API error: ${error.message}`);
    }
  }

  /**
   * Get MIME type from URL
   */
  getMimeType(url) {
    const extension = path.extname(url).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(platform, postId, credentials = null) {
    try {
      switch (platform) {
        case 'facebook':
          return await this.getFacebookAnalytics(postId, credentials);
        case 'twitter':
          return await this.getTwitterAnalytics(postId, credentials);
        case 'instagram':
          return await this.getInstagramAnalytics(postId, credentials);
        case 'linkedin':
          return await this.getLinkedInAnalytics(postId, credentials);
        case 'tiktok':
          return await this.getTikTokAnalytics(postId, credentials);
        case 'youtube':
          return await this.getYouTubeAnalytics(postId, credentials);
        default:
          throw new Error(`Analytics not supported for platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error getting ${platform} analytics:`, error);
      return { error: error.message };
    }
  }

  /**
   * Get Facebook post analytics
   */
  async getFacebookAnalytics(postId, credentials) {
    const accessToken = credentials?.accessToken || process.env.FACEBOOK_ACCESS_TOKEN;

    const response = await axios.get(
      `https://graph.facebook.com/${postId}/insights`,
      {
        params: {
          metric: 'post_impressions,post_engaged_users,post_reactions_by_type_total',
          access_token: accessToken
        }
      }
    );

    return {
      impressions: response.data.data.find(d => d.name === 'post_impressions')?.values[0]?.value || 0,
      engagedUsers: response.data.data.find(d => d.name === 'post_engaged_users')?.values[0]?.value || 0,
      reactions: response.data.data.find(d => d.name === 'post_reactions_by_type_total')?.values[0]?.value || {}
    };
  }

  /**
   * Get Twitter/X analytics
   */
  async getTwitterAnalytics(postId, credentials) {
    const client = new TwitterApi({
      appKey: credentials?.apiKey || process.env.TWITTER_API_KEY,
      appSecret: credentials?.apiSecret || process.env.TWITTER_API_SECRET,
      accessToken: credentials?.accessToken || process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: credentials?.accessTokenSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const tweet = await client.v2.singleTweet(postId, {
      'tweet.fields': 'public_metrics'
    });

    return tweet.data.public_metrics;
  }

  // Similar methods for other platforms...
  async getInstagramAnalytics(postId, credentials) {
    // Instagram analytics implementation
    return { likes: 0, comments: 0, views: 0 };
  }

  async getLinkedInAnalytics(postId, credentials) {
    // LinkedIn analytics implementation
    return { likes: 0, comments: 0, shares: 0 };
  }

  async getTikTokAnalytics(postId, credentials) {
    // TikTok analytics implementation
    return { likes: 0, comments: 0, shares: 0, views: 0 };
  }

  async getYouTubeAnalytics(postId, credentials) {
    // YouTube analytics implementation
    return { likes: 0, dislikes: 0, comments: 0, views: 0 };
  }
}

module.exports = new SocialMediaService();
