/**
 * API配置文件
 * 定义后端API的基础URL和相关配置
 */

// 根据环境变量确定API基础URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API请求超时时间（毫秒）
export const API_TIMEOUT = 30000;

// API版本
export const API_VERSION = 'v1';

// 完整的API端点前缀
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
  },
  
  // 微信OAuth相关
  WECHAT_OAUTH: {
    LOGIN: '/api/auth/wechat/login',
    CALLBACK: '/api/auth/wechat/callback',
    MOBILE: '/api/auth/wechat/mobile',
    BIND: '/api/auth/wechat/bind',
    UNBIND: '/api/auth/wechat/unbind',
    STATUS: '/api/auth/wechat/status',
  },
  
  // 用户相关
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
    AVATAR: '/api/users/avatar',
    PASSWORD: '/api/users/password',
  },
  
  // 资源相关
  RESOURCE: {
    LIST: '/api/resources',
    CREATE: '/api/resources',
    DETAIL: '/api/resources',
    UPDATE: '/api/resources',
    DELETE: '/api/resources',
    SEARCH: '/api/resources/search',
    CATEGORIES: '/api/resources/categories',
  },
  
  // 订单相关
  ORDER: {
    LIST: '/api/orders',
    CREATE: '/api/orders',
    DETAIL: '/api/orders',
    UPDATE: '/api/orders',
    CANCEL: '/api/orders',
  },
  
  // 支付相关
  PAYMENT: {
    CREATE: '/api/payments',
    STATUS: '/api/payments',
    CALLBACK: '/api/payments/callback',
  },
  
  // 聊天相关
  CHAT: {
    CONVERSATIONS: '/api/chat/conversations',
    MESSAGES: '/api/chat/messages',
    SEND: '/api/chat/send',
    UNREAD_COUNT: '/api/chat/unread-count',
  },
  
  // 通知相关
  NOTIFICATION: {
    LIST: '/api/notifications',
    MARK_READ: '/api/notifications/read',
    MARK_ALL_READ: '/api/notifications/read-all',
    UNREAD_COUNT: '/api/notifications/unread-count',
  },
  
  // 文件上传相关
  FILE: {
    UPLOAD: '/api/files/upload',
    DELETE: '/api/files',
  },
  
  // 位置相关
  LOCATION: {
    SEARCH: '/api/location/search',
    GEOCODE: '/api/location/geocode',
    REVERSE_GEOCODE: '/api/location/reverse-geocode',
  },
};

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // 认证错误
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // 业务错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // OAuth错误
  OAUTH_ERROR: 'OAUTH_ERROR',
  OAUTH_CALLBACK_ERROR: 'OAUTH_CALLBACK_ERROR',
  OAUTH_STATE_MISMATCH: 'OAUTH_STATE_MISMATCH',
  WECHAT_AUTH_FAILED: 'WECHAT_AUTH_FAILED',
} as const;

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// 文件上传相关配置
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  API_VERSION,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_HEADERS,
  FILE_UPLOAD,
};