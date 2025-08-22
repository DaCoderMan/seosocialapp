import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const SocialMedia = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectedAccounts();
    loadPosts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const response = await api.get('/social-media/accounts');
      setConnectedAccounts(response.data.data);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      // Load posts from different platforms
      const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
      const allPosts = [];

      for (const platform of platforms) {
        try {
          const response = await api.get(`/social-media/posts/${platform}`);
          allPosts.push(...response.data.data.map(post => ({ ...post, platform })));
        } catch (error) {
          console.error(`Error loading ${platform} posts:`, error);
        }
      }

      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const platformColors = {
    facebook: 'bg-blue-600',
    twitter: 'bg-sky-500',
    instagram: 'bg-pink-500',
    linkedin: 'bg-blue-700',
    tiktok: 'bg-black',
    youtube: 'bg-red-600'
  };

  const platformIcons = {
    facebook: 'fab fa-facebook-f',
    twitter: 'fab fa-twitter',
    instagram: 'fab fa-instagram',
    linkedin: 'fab fa-linkedin-in',
    tiktok: 'fab fa-tiktok',
    youtube: 'fab fa-youtube'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Management</h1>
          <p className="text-gray-600">Manage your social media presence across all platforms</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
          <i className="fas fa-plus mr-2"></i>
          New Post
        </button>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(connectedAccounts).map(([platform, account]) => (
            <div key={platform} className="text-center">
              <div className={`w-16 h-16 ${platformColors[platform]} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <i className={`${platformIcons[platform]} text-white text-xl`}></i>
              </div>
              <h3 className="font-medium text-gray-900 capitalize">{platform}</h3>
              <p className={`text-sm ${account.connected ? 'text-green-600' : 'text-red-600'}`}>
                {account.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: 'fa-chart-line' },
              { id: 'posts', name: 'Posts', icon: 'fa-share-alt' },
              { id: 'schedule', name: 'Schedule', icon: 'fa-calendar' },
              { id: 'analytics', name: 'Analytics', icon: 'fa-chart-bar' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3">
                      <i className="fas fa-share-alt text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Total Posts</p>
                      <p className="text-2xl font-bold text-blue-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-500 rounded-lg mr-3">
                      <i className="fas fa-heart text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Total Engagement</p>
                      <p className="text-2xl font-bold text-green-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-500 rounded-lg mr-3">
                      <i className="fas fa-eye text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">Total Reach</p>
                      <p className="text-2xl font-bold text-purple-900">0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                      <i className="fas fa-calendar text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600">Scheduled</p>
                      <p className="text-2xl font-bold text-yellow-900">0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <i className="fas fa-rocket text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Social Media Dashboard</h3>
                <p className="text-gray-500">Manage all your social media accounts from one place</p>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${platformColors[post.platform]} rounded-full flex items-center justify-center mr-3`}>
                          <i className={`${platformIcons[post.platform]} text-white text-sm`}></i>
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{post.platform}</span>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(post.publishedDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700">{post.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-share-alt text-4xl mb-4"></i>
                  <p>No posts found</p>
                  <p className="text-sm">Start by creating your first social media post</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <i className="fas fa-calendar text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Post Scheduling</h3>
              <p className="text-gray-500">Schedule your posts in advance across all platforms</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <i className="fas fa-chart-bar text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Social Analytics</h3>
              <p className="text-gray-500">Track performance and engagement across all platforms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;


