import axios from 'axios';
import {
  User,
  RegisterRequest,
  LoginRequest,
  UpdateUserRequest,
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  ChatMessage,
  CreateChatMessageRequest,
  Notification,
  ApiResponse,
  PaginatedResponse,
  SearchFilters,
  PaymentRequest,
  PaymentResult,
  FileUploadResult,
  FileUploadRequest,
  Location
} from '../types';

// API配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
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

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('token');
      // 重定向到登录页面
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

/**
 * 用户相关API服务
 */
export const userService = {
  // 用户注册
  register: async (data: RegisterRequest): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // 用户登录
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // 更新用户信息
  updateUser: async (data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  // 上传用户头像
  uploadAvatar: async (file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 获取用户信誉分数
  getCreditScore: async (userId: string): Promise<ApiResponse<number>> => {
    const response = await api.get(`/users/${userId}/credit-score`);
    return response.data;
  },
};

/**
 * 资源相关API服务
 */
export const resourceService = {
  // 获取资源列表
  getResources: async (
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Resource>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await api.get(`/resources?${params.toString()}`);
    return response.data;
  },

  // 获取单个资源详情
  getResource: async (id: string): Promise<ApiResponse<Resource>> => {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  // 创建新资源
  createResource: async (data: CreateResourceRequest): Promise<ApiResponse<Resource>> => {
    const response = await api.post('/resources', data);
    return response.data;
  },

  // 更新资源信息
  updateResource: async (id: string, data: UpdateResourceRequest): Promise<ApiResponse<Resource>> => {
    const response = await api.put(`/resources/${id}`, data);
    return response.data;
  },

  // 删除资源
  deleteResource: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  // 获取用户发布的资源
  getUserResources: async (userId: string, page: number = 1, limit: number = 20) => {
    const response = await api.get(`/users/${userId}/resources?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 搜索资源
  searchResources: async (
    keyword: string,
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 20
  ) => {
    const params = new URLSearchParams({
      keyword,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`/resources/search?${params.toString()}`);
    return response.data;
  },

  // 获取热门资源
  getPopularResources: async (limit: number = 10) => {
    const response = await api.get(`/resources/popular?limit=${limit}`);
    return response.data;
  },

  // 获取推荐资源
  getRecommendedResources: async (limit: number = 10) => {
    const response = await api.get(`/resources/recommended?limit=${limit}`);
    return response.data;
  },
};

/**
 * 订单相关API服务
 */
export const orderService = {
  // 创建订单
  createOrder: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  // 获取订单列表
  getOrders: async (
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  // 获取单个订单详情
  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // 更新订单状态
  updateOrderStatus: async (id: string, data: UpdateOrderStatusRequest): Promise<ApiResponse<Order>> => {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data;
  },

  // 获取用户订单
  getUserOrders: async (
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await api.get(`/users/${userId}/orders?${params.toString()}`);
    return response.data;
  },

  // 取消订单
  cancelOrder: async (orderId: string, reason?: string): Promise<ApiResponse<Order>> => {
    const response = await api.patch(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  // 确认订单
  confirmOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await api.patch(`/orders/${orderId}/confirm`);
    return response.data;
  },

  // 完成订单
  completeOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await api.patch(`/orders/${orderId}/complete`);
    return response.data;
  },
};

/**
 * 聊天相关API服务
 */
export const chatService = {
  // 获取订单聊天记录
  getChatMessages: async (orderId: string): Promise<ApiResponse<ChatMessage[]>> => {
    // 调整为后端真实路由：/api/chat/order/:orderId（此前错误为 /orders/:orderId/messages）
    const response = await api.get(`/chat/order/${orderId}`);
    return response.data;
  },

  // 发送聊天消息
  sendMessage: async (data: CreateChatMessageRequest): Promise<ApiResponse<ChatMessage>> => {
    // 调整为后端真实路由：POST /api/chat（此前错误为 /messages）
    const response = await api.post('/chat', data);
    return response.data;
  },

  // 标记消息为已读
  markAsRead: async (messageId: string): Promise<ApiResponse<void>> => {
    // 调整为后端真实路由：PATCH /api/chat/:messageId/read（此前错误为 /messages/:id/read）
    const response = await api.patch(`/chat/${messageId}/read`);
    return response.data;
  },

  // 获取未读消息数量
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    // 路由确认：GET /api/chat/unread-count
    const response = await api.get('/chat/unread-count');
    return response.data;
  },
};

/**
 * 通知相关API服务
 */
export const notificationService = {
  // 获取通知列表
  getNotifications: async (page: number = 1, limit: number = 20) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 标记通知为已读
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // 标记所有通知为已读
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  // 获取未读通知数量
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
};

/**
 * 支付相关API服务
 */
export const paymentService = {
  // 创建支付订单
  createPayment: async (data: PaymentRequest): Promise<ApiResponse<PaymentResult>> => {
    const response = await api.post('/payments/create', data);
    return response.data;
  },

  // 查询支付状态
  getPaymentStatus: async (paymentId: string): Promise<ApiResponse<PaymentResult>> => {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  },

  // 申请退款
  requestRefund: async (orderId: string, reason: string) => {
    const response = await api.post('/payments/refund', { orderId, reason });
    return response.data;
  },

  // 获取支付配置
  getPaymentConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  },
};

/**
 * 文件上传相关API服务
 */
export const fileService = {
  // 上传文件
  uploadFile: async (data: FileUploadRequest): Promise<ApiResponse<FileUploadResult>> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('type', data.type);
    formData.append('purpose', data.purpose);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 上传多个文件
  uploadMultipleFiles: async (
    files: File[],
    type: 'image' | 'video' | 'document',
    purpose: 'resource' | 'user' | 'review'
  ): Promise<ApiResponse<FileUploadResult[]>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('type', type);
    formData.append('purpose', purpose);

    const response = await api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 删除文件
  deleteFile: async (fileUrl: string): Promise<ApiResponse<void>> => {
    const response = await api.delete('/files', { data: { fileUrl } });
    return response.data;
  },
};

/**
 * 地理位置相关API服务
 */
export const locationService = {
  // 获取当前位置
  getCurrentLocation: async (): Promise<ApiResponse<Location>> => {
    const response = await api.get('/location/current');
    return response.data;
  },

  // 地址解析
  geocodeAddress: async (address: string): Promise<ApiResponse<Location[]>> => {
    const response = await api.get(`/location/geocode?address=${encodeURIComponent(address)}`);
    return response.data;
  },

  // 逆地理编码
  reverseGeocode: async (lat: number, lng: number): Promise<ApiResponse<Location>> => {
    const response = await api.get(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
    return response.data;
  },
};

/**
 * 工具函数
 */
export const apiUtils = {
  // 清除token
  clearToken: () => {
    localStorage.removeItem('token');
  },

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // 获取token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // 设置token
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },
};

export default api;