import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    socialPosts: 0,
    seoScore: 0,
    analytics: {}
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/recent-activity')
      ]);

      setStats(statsResponse.data.data);
      setRecentActivity(activityResponse.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`fas ${trend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')}`}>
          <i className={`${icon} text-2xl ${color.replace('border-', 'text-').replace('-600', '-600')}`}></i>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.profile?.firstName || user?.username}!
            </h2>
            <p className="text-purple-100">
              Here's what's happening with your SEO and social media campaigns today.
            </p>
          </div>
          <div className="hidden md:block">
            <i className="fas fa-rocket text-6xl opacity-20"></i>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue?.toLocaleString() || 0}`}
          icon="fas fa-dollar-sign"
          color="border-green-600"
          trend={stats.revenueTrend}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers || 0}
          icon="fas fa-users"
          color="border-blue-600"
          trend={stats.customersTrend}
        />
        <StatCard
          title="Affiliate Clicks"
          value={stats.affiliateClicks || 0}
          icon="fas fa-link"
          color="border-purple-600"
          trend={stats.affiliateTrend}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate || 0}%`}
          icon="fas fa-chart-line"
          color="border-yellow-600"
          trend={stats.conversionTrend}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Money-Making Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
            <i className="fas fa-link text-gray-400 group-hover:text-green-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">Affiliate Link</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
            <i className="fas fa-users text-gray-400 group-hover:text-blue-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Add Customer</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
            <i className="fas fa-shopping-cart text-gray-400 group-hover:text-purple-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">New Sale</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group">
            <i className="fas fa-chart-line text-gray-400 group-hover:text-red-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-red-600">Revenue Report</span>
          </button>
        </div>
      </div>

      {/* Business Tools */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 Marketing & Growth Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors group">
            <i className="fas fa-plus text-gray-400 group-hover:text-indigo-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">Add Product</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors group">
            <i className="fas fa-share-alt text-gray-400 group-hover:text-pink-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-pink-600">Social Post</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors group">
            <i className="fas fa-search text-gray-400 group-hover:text-teal-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-teal-600">SEO Analysis</span>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group">
            <i className="fas fa-bullseye text-gray-400 group-hover:text-orange-500 text-2xl mb-2 block"></i>
            <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Lead Scoring</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'social' ? 'bg-blue-100' :
                    activity.type === 'seo' ? 'bg-green-100' :
                    activity.type === 'product' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <i className={`fas ${
                      activity.type === 'social' ? 'fa-share-alt text-blue-600' :
                      activity.type === 'seo' ? 'fa-search text-green-600' :
                      activity.type === 'product' ? 'fa-box text-purple-600' : 'fa-info text-gray-600'
                    }`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <i className="fas fa-inbox text-4xl mb-4"></i>
              <p>No recent activity</p>
              <p className="text-sm">Your recent actions will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <i className="fas fa-circle text-xs mr-1"></i>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <i className="fas fa-circle text-xs mr-1"></i>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Social APIs</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <i className="fas fa-circle text-xs mr-1"></i>
                Partial
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Tips</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <i className="fas fa-lightbulb text-yellow-500 mt-1"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Optimize for SEO</p>
                <p className="text-xs text-gray-500">Use relevant keywords in your product descriptions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-clock text-blue-500 mt-1"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Schedule Posts</p>
                <p className="text-xs text-gray-500">Plan your social media content in advance</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-chart-line text-green-500 mt-1"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Monitor Performance</p>
                <p className="text-xs text-gray-500">Check analytics regularly to improve results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
