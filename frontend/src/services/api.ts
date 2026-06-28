import axios from 'axios';

// Create central Axios instance pointing to proxied backend API prefix
export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically inject access tokens into Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh when encountering HTTP 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 unauthorized and the request has not been retried yet
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Refresh token not found');
        }
        
        // Execute refresh token exchange call
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token: new_refresh_token } = response.data;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', new_refresh_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear credentials and redirect to login if session refresh fails
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('username');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// --- Backend API Services ---

export const authService = {
  async register(data: any) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  async login(data: any) {
    const response = await api.post('/auth/login', loginParams(data));
    const tokenData = response.data;
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('refresh_token', tokenData.refresh_token);
    localStorage.setItem('user_role', tokenData.role);
    localStorage.setItem('user_name', tokenData.name);
    localStorage.setItem('username', tokenData.username);
    return tokenData;
  },
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('username');
  },
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },
  getRole() {
    return localStorage.getItem('user_role') || 'User';
  },
  getName() {
    return localStorage.getItem('user_name') || 'Guest';
  }
};

// Form URL encoded mapper for standard OAuth2 login forms if required
function loginParams(data: any) {
  // We use standard JSON payload matching UserLogin schema
  return data;
}

export const predictionService = {
  async predict(data: any) {
    const response = await api.post('/predictions/predict', data);
    return response.data;
  },
  async getHistory(page = 1, size = 10, search?: number, sortBy = 'created_at', order = 'desc') {
    const params: any = { page, size, sort_by: sortBy, order };
    if (search !== undefined) {
      params.search = search;
    }
    const response = await api.get('/predictions/history', { params });
    return response.data;
  },
  async delete(id: number) {
    const response = await api.delete(`/predictions/${id}`);
    return response.data;
  },
  getReportPdfUrl(id: number) {
    // Generate full URL path for direct download links in browser
    const token = localStorage.getItem('access_token');
    return `/api/v1/predictions/${id}/pdf?token=${token}`; // Query token support if needed, otherwise handled via window.open
  },
  async downloadReportPdf(id: number) {
    const response = await api.get(`/predictions/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  async downloadHistoryCsv() {
    const response = await api.get('/predictions/export/csv', {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const systemService = {
  async getDashboardStats() {
    const response = await api.get('/system/dashboard');
    return response.data;
  },
  async getProfile() {
    const response = await api.get('/system/profile');
    return response.data;
  },
  async updateProfile(data: any) {
    const response = await api.put('/system/profile', data);
    return response.data;
  },
  async getHealth() {
    const response = await api.get('/system/admin/health');
    return response.data;
  },
  async getLogs() {
    const response = await api.get('/system/admin/logs');
    return response.data;
  }
};

export default api;
