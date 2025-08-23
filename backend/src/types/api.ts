/**
 * API响应类型定义
 * 统一API响应格式，确保前后端数据交互的一致性
 */

/**
 * 标准API响应格式
 * @template T 响应数据的类型
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 错误代码（可选） */
  errorCode?: string;
  /** 时间戳（可选） */
  timestamp?: string;
}

/**
 * 分页响应格式
 * @template T 列表项的类型
 */
export interface PaginatedResponse<T = any> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 错误响应格式
 */
export interface ErrorResponse {
  /** 请求是否成功（始终为false） */
  success: false;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  errorCode?: string;
  /** 错误详情（开发环境） */
  details?: any;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  /** 用户信息 */
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    isOAuthUser: boolean;
    verified: boolean;
  };
  /** 令牌信息 */
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  /** 是否为新用户 */
  isNewUser?: boolean;
}

/**
 * OAuth登录响应数据
 */
export interface OAuthLoginResponseData extends LoginResponseData {
  /** OAuth提供商 */
  provider: string;
  /** 是否为新用户 */
  isNewUser: boolean;
}

/**
 * 用户信息响应数据
 */
export interface UserResponseData {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  creditScore: number;
  verified: boolean;
  isActive: boolean;
  isOAuthUser: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 资源响应数据
 */
export interface ResourceResponseData {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  priceUnit: string;
  images: string[];
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  rating: number;
  reviewCount: number;
  tags?: string[];
  ownerId: string;
  deposit: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    username: string;
    avatar?: string;
    creditScore: number;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
}

/**
 * 订单响应数据
 */
export interface OrderResponseData {
  id: string;
  resourceId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  deposit: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  resource?: ResourceResponseData;
  renter?: UserResponseData;
  owner?: UserResponseData;
}

/**
 * 聊天消息响应数据
 */
export interface ChatMessageResponseData {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

/**
 * 通知响应数据
 */
export interface NotificationResponseData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * 文件上传响应数据
 */
export interface FileUploadResponseData {
  /** 文件URL */
  url: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 */
  mimetype: string;
  /** 上传时间 */
  uploadedAt: string;
}

/**
 * 统计数据响应格式
 */
export interface StatsResponseData {
  /** 统计项名称 */
  name: string;
  /** 统计值 */
  value: number;
  /** 变化百分比（可选） */
  change?: number;
  /** 统计时间段（可选） */
  period?: string;
}

/**
 * 搜索建议响应数据
 */
export interface SearchSuggestionResponseData {
  /** 建议文本 */
  text: string;
  /** 建议类型 */
  type: 'keyword' | 'category' | 'location';
  /** 匹配数量（可选） */
  count?: number;
}

/**
 * 地理位置响应数据
 */
export interface LocationResponseData {
  /** 地址 */
  address: string;
  /** 纬度 */
  latitude: number;
  /** 经度 */
  longitude: number;
  /** 城市 */
  city?: string;
  /** 省份 */
  province?: string;
  /** 国家 */
  country?: string;
  /** 邮政编码 */
  postalCode?: string;
}

/**
 * 支付响应数据
 */
export interface PaymentResponseData {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentGateway: string;
  transactionId?: string;
  status: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 常用HTTP状态码
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * 常用错误代码
 */
export enum ErrorCode {
  // 认证相关
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // 用户相关
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  
  // 资源相关
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  RESOURCE_ALREADY_RENTED = 'RESOURCE_ALREADY_RENTED',
  
  // 订单相关
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_CANNOT_BE_CANCELLED = 'ORDER_CANNOT_BE_CANCELLED',
  ORDER_ALREADY_PAID = 'ORDER_ALREADY_PAID',
  
  // 支付相关
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // 文件相关
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  
  // 验证相关
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  INVALID_EMAIL = 'INVALID_EMAIL',
  VERIFICATION_CODE_EXPIRED = 'VERIFICATION_CODE_EXPIRED',
  VERIFICATION_CODE_INVALID = 'VERIFICATION_CODE_INVALID',
  
  // OAuth相关
  OAUTH_ERROR = 'OAUTH_ERROR',
  OAUTH_ACCOUNT_ALREADY_BOUND = 'OAUTH_ACCOUNT_ALREADY_BOUND',
  OAUTH_ACCOUNT_NOT_FOUND = 'OAUTH_ACCOUNT_NOT_FOUND',
  
  // 系统相关
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}