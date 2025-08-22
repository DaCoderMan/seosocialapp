import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      console.error('Request timeout:', error.message);
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API endpoints organized by feature
const endpoints = {
  // Authentication
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
    changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  },

  // Products
  products: {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post('/products', productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`),
    uploadImage: (formData) => api.post('/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  // Social Media
  socialMedia: {
    getAccounts: () => api.get('/social-media/accounts'),
    connectAccount: (platform, data) => api.post(`/social-media/connect/${platform}`, data),
    disconnectAccount: (platform) => api.delete(`/social-media/disconnect/${platform}`),
    post: (platform, postData) => api.post(`/social-media/post/${platform}`, postData),
    getPosts: (platform, params) => api.get(`/social-media/posts/${platform}`, { params }),
    schedulePost: (platform, postData) => api.post(`/social-media/schedule/${platform}`, postData),
    getScheduledPosts: (platform) => api.get(`/social-media/scheduled/${platform}`),
  },

  // SEO
  seo: {
    analyze: (url) => api.post('/seo/analyze', { url }),
    optimize: (data) => api.post('/seo/optimize', data),
    getKeywords: (keyword) => api.get(`/seo/keywords/${keyword}`),
    generateContent: (data) => api.post('/seo/generate-content', data),
    checkRankings: (domain) => api.get(`/seo/rankings/${domain}`),
    submitToSearchEngines: (data) => api.post('/seo/submit', data),
  },

  // Analytics
  analytics: {
    getOverview: (params) => api.get('/analytics/overview', { params }),
    getSocialMetrics: (platform, params) => api.get(`/analytics/social/${platform}`, { params }),
    getSEOMetrics: (params) => api.get('/analytics/seo', { params }),
    getEngagement: (params) => api.get('/analytics/engagement', { params }),
    exportData: (type, params) => api.get(`/analytics/export/${type}`, {
      params,
      responseType: 'blob'
    }),
  },

  // Scheduler
  scheduler: {
    getJobs: () => api.get('/scheduler/jobs'),
    createJob: (jobData) => api.post('/scheduler/jobs', jobData),
    updateJob: (id, jobData) => api.put(`/scheduler/jobs/${id}`, jobData),
    deleteJob: (id) => api.delete(`/scheduler/jobs/${id}`),
    pauseJob: (id) => api.put(`/scheduler/jobs/${id}/pause`),
    resumeJob: (id) => api.put(`/scheduler/jobs/${id}/resume`),
    getLogs: (id, params) => api.get(`/scheduler/jobs/${id}/logs`, { params }),
  },

  // Health check
  health: () => api.get('/health'),
};

// Helper function for file uploads
export const uploadFile = async (file, endpoint, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  };

  return api.post(endpoint, formData, config);
};

// Helper function for downloading files
export const downloadFile = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' });

  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
};

export default api;
export { endpoints };


