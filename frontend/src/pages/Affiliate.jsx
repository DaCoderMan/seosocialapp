import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Affiliate = () => {
  const { user } = useAuth();
  const [affiliateLinks, setAffiliateLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    originalUrl: '',
    affiliateNetwork: 'custom',
    commission: {
      percentage: '',
      fixed: ''
    },
    expiresAt: ''
  });

  useEffect(() => {
    loadAffiliateLinks();
    loadAnalytics();
  }, []);

  const loadAffiliateLinks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/affiliate');
      setAffiliateLinks(response.data.data);
    } catch (error) {
      console.error('Error loading affiliate links:', error);
      toast.error('Failed to load affiliate links');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/affiliate/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await api.put(`/affiliate/${editingLink._id}`, formData);
        toast.success('Affiliate link updated successfully');
      } else {
        await api.post('/affiliate', formData);
        toast.success('Affiliate link created successfully');
      }
      setShowAddModal(false);
      setEditingLink(null);
      setFormData({
        name: '',
        originalUrl: '',
        affiliateNetwork: 'custom',
        commission: {
          percentage: '',
          fixed: ''
        },
        expiresAt: ''
      });
      loadAffiliateLinks();
      loadAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save affiliate link');
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      originalUrl: link.originalUrl,
      affiliateNetwork: link.affiliateNetwork,
      commission: {
        percentage: link.commission?.percentage || '',
        fixed: link.commission?.fixed || ''
      },
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (linkId) => {
    if (window.confirm('Are you sure you want to delete this affiliate link?')) {
      try {
        await api.delete(`/affiliate/${linkId}`);
        toast.success('Affiliate link deleted successfully');
        loadAffiliateLinks();
        loadAnalytics();
      } catch (error) {
        toast.error('Failed to delete affiliate link');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Affiliate Marketing</h1>
          <p className="text-gray-600">Create and manage affiliate links to earn commissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          Create Link
        </button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <i className="fas fa-link text-white"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Links</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalLinks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg mr-3">
                <i className="fas fa-mouse-pointer text-white"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg mr-3">
                <i className="fas fa-shopping-cart text-white"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalConversions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                <i className="fas fa-dollar-sign text-white"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Links Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Affiliate Links</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {affiliateLinks.map((link) => (
                <tr key={link._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{link.name}</div>
                    <div className="text-sm text-gray-500">{link.affiliateNetwork}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={link.affiliateUrl}
                        readOnly
                        className="text-sm bg-gray-100 p-1 rounded flex-1"
                      />
                      <button
                        onClick={() => copyToClipboard(link.affiliateUrl)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.clickCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.conversionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${link.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      link.status === 'active' ? 'bg-green-100 text-green-800' :
                      link.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {link.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(link)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {affiliateLinks.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-link text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No affiliate links yet</h3>
            <p className="text-gray-500 mb-4">Create your first affiliate link to start earning commissions</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Your First Link
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Affiliate Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLink ? 'Edit Affiliate Link' : 'Create New Affiliate Link'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLink(null);
                  setFormData({
                    name: '',
                    originalUrl: '',
                    affiliateNetwork: 'custom',
                    commission: {
                      percentage: '',
                      fixed: ''
                    },
                    expiresAt: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Affiliate Network
                  </label>
                  <select
                    value={formData.affiliateNetwork}
                    onChange={(e) => setFormData({...formData, affiliateNetwork: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="custom">Custom</option>
                    <option value="amazon">Amazon Associates</option>
                    <option value="clickbank">ClickBank</option>
                    <option value="shareasale">ShareASale</option>
                    <option value="cj_affiliate">CJ Affiliate</option>
                    <option value="rakuten">Rakuten</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original URL *
                </label>
                <input
                  type="url"
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({...formData, originalUrl: e.target.value})}
                  placeholder="https://example.com/product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission.percentage}
                    onChange={(e) => setFormData({
                      ...formData,
                      commission: {...formData.commission, percentage: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fixed Commission ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.commission.fixed}
                    onChange={(e) => setFormData({
                      ...formData,
                      commission: {...formData.commission, fixed: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLink(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingLink ? 'Update Link' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Affiliate;


