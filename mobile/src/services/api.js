import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token retrieval error:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      // You might want to redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: async (phone, userType) => {
    const response = await api.post('/auth/send-otp', { phone, userType });
    return { success: true, data: response.data };
  },

  verifyOTP: async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return { success: true, data: response.data };
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', { profile: profileData });
    return response;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return { success: true, data: response.data };
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response;
  },
};

// Stores API
export const storesAPI = {
  getNearbyStores: async (latitude, longitude, radius = 10, category) => {
    const params = { latitude, longitude, radius };
    if (category) params.category = category;
    
    const response = await api.get('/stores/nearby', { params });
    return { success: true, data: response.data };
  },

  searchStores: async (query, category, city) => {
    const params = {};
    if (query) params.q = query;
    if (category) params.category = category;
    if (city) params.city = city;
    
    const response = await api.get('/stores/search', { params });
    return { success: true, data: response.data };
  },

  getStoreDetails: async (storeId) => {
    const response = await api.get(`/stores/${storeId}`);
    return { success: true, data: response.data };
  },

  createStore: async (storeData) => {
    const response = await api.post('/stores', storeData);
    return { success: true, data: response.data };
  },

  updateStore: async (storeId, storeData) => {
    const response = await api.put(`/stores/${storeId}`, storeData);
    return { success: true, data: response.data };
  },

  uploadStoreImage: async (storeId, imageData, imageType) => {
    const response = await api.post(`/stores/${storeId}/upload-image`, {
      imageData,
      imageType,
    });
    return { success: true, data: response.data };
  },

  getStoreAnalytics: async (storeId) => {
    const response = await api.get(`/stores/${storeId}/analytics`);
    return { success: true, data: response.data };
  },
};

// Products API
export const productsAPI = {
  getProducts: async (filters = {}) => {
    const response = await api.get('/products', { params: filters });
    return { success: true, data: response.data };
  },

  searchProducts: async (query, store, category, limit = 20) => {
    const params = { q: query, limit };
    if (store) params.store = store;
    if (category) params.category = category;
    
    const response = await api.get('/products/search', { params });
    return { success: true, data: response.data };
  },

  getProductDetails: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return { success: true, data: response.data };
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return { success: true, data: response.data };
  },

  updateProduct: async (productId, productData) => {
    const response = await api.put(`/products/${productId}`, productData);
    return { success: true, data: response.data };
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return { success: true, data: response.data };
  },

  uploadProductImage: async (productId, imageData, isPrimary = false) => {
    const response = await api.post(`/products/${productId}/upload-image`, {
      imageData,
      isPrimary,
    });
    return { success: true, data: response.data };
  },

  updateProductStock: async (productId, quantity, operation) => {
    const response = await api.patch(`/products/${productId}/stock`, {
      quantity,
      operation,
    });
    return { success: true, data: response.data };
  },
};

// Cart API
export const cartAPI = {
  getCart: async () => {
    const response = await api.get('/cart');
    return { success: true, data: response.data };
  },

  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/cart/add', { productId, quantity });
    return { success: true, data: response.data };
  },

  updateCartItem: async (productId, quantity) => {
    const response = await api.put('/cart/update', { productId, quantity });
    return { success: true, data: response.data };
  },

  removeFromCart: async (productId) => {
    const response = await api.delete(`/cart/remove/${productId}`);
    return { success: true, data: response.data };
  },

  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return { success: true, data: response.data };
  },

  getCartSummary: async () => {
    const response = await api.get('/cart/summary');
    return { success: true, data: response.data };
  },
};

// Orders API
export const ordersAPI = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders/checkout', orderData);
    return { success: true, data: response.data };
  },

  getMyOrders: async (filters = {}) => {
    const response = await api.get('/orders/my-orders', { params: filters });
    return { success: true, data: response.data };
  },

  getOrderDetails: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return { success: true, data: response.data };
  },

  updateOrderStatus: async (orderId, status, note) => {
    const response = await api.patch(`/orders/${orderId}/status`, {
      status,
      note,
    });
    return { success: true, data: response.data };
  },

  cancelOrder: async (orderId, reason) => {
    const response = await api.patch(`/orders/${orderId}/cancel`, { reason });
    return { success: true, data: response.data };
  },

  addOrderRating: async (orderId, rating, review) => {
    const response = await api.post(`/orders/${orderId}/rating`, {
      rating,
      review,
    });
    return { success: true, data: response.data };
  },

  getStoreOrders: async (filters = {}) => {
    const response = await api.get('/orders/store/orders', { params: filters });
    return { success: true, data: response.data };
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async (parent, active = true) => {
    const params = { active };
    if (parent) params.parent = parent;
    
    const response = await api.get('/categories', { params });
    return { success: true, data: response.data };
  },

  getCategoryTree: async () => {
    const response = await api.get('/categories/tree');
    return { success: true, data: response.data };
  },

  getRootCategories: async () => {
    const response = await api.get('/categories/root');
    return { success: true, data: response.data };
  },

  getCategoryDetails: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return { success: true, data: response.data };
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return { success: true, data: response.data };
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return { success: true, data: response.data };
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return { success: true, data: response.data };
  },

  initializeCategories: async () => {
    const response = await api.post('/categories/initialize');
    return { success: true, data: response.data };
  },
};

export default api;





