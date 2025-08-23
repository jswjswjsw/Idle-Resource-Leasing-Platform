/**
 * API响应类型定义
 * 定义前后端数据交互的标准格式
 */

/**
 * 通用API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 错误响应格式
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
    field?: string;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  user: UserResponseData;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * OAuth登录响应数据
 */
export interface OAuthLoginResponseData {
  user: UserResponseData;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
  oauthProvider: string;
}

/**
 * 用户响应数据
 */
export interface UserResponseData {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isOAuthUser: boolean;
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
  price: number;
  priceUnit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  category: CategoryResponseData;
  owner: UserResponseData;
  images: string[];
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'DELETED';
  location: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    district: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 分类响应数据
 */
export interface CategoryResponseData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  children?: CategoryResponseData[];
}

/**
 * 订单响应数据
 */
export interface OrderResponseData {
  id: string;
  resource: ResourceResponseData;
  renter: UserResponseData;
  owner: UserResponseData;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
}

/**
 * 支付响应数据
 */
export interface PaymentResponseData {
  id: string;
  orderId: string;
  amount: number;
  method: 'ALIPAY' | 'WECHAT' | 'BANK_CARD';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 消息响应数据
 */
export interface MessageResponseData {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

/**
 * 对话响应数据
 */
export interface ConversationResponseData {
  id: string;
  participants: UserResponseData[];
  lastMessage?: MessageResponseData;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 通知响应数据
 */
export interface NotificationResponseData {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'ORDER' | 'PAYMENT' | 'MESSAGE' | 'SYSTEM';
  isRead: boolean;
  data?: any;
  createdAt: string;
}

/**
 * 文件上传响应数据
 */
export interface FileUploadResponseData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

/**
 * 位置搜索响应数据
 */
export interface LocationSearchResponseData {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  type: string;
}

/**
 * 地理编码响应数据
 */
export interface GeocodeResponseData {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  province: string;
  country: string;
}

/**
 * HTTP状态码枚举
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
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 认证错误
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // 业务错误
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // OAuth错误
  OAUTH_ERROR = 'OAUTH_ERROR',
  OAUTH_CALLBACK_ERROR = 'OAUTH_CALLBACK_ERROR',
  OAUTH_STATE_MISMATCH = 'OAUTH_STATE_MISMATCH',
  WECHAT_AUTH_FAILED = 'WECHAT_AUTH_FAILED',
}

/**
 * 请求参数类型
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  price: number;
  priceUnit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  categoryId: string;
  images: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    district: string;
  };
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
}

export interface CreateOrderRequest {
  resourceId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
}

export interface SearchResourcesRequest {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  priceUnit?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // 搜索半径（公里）
  };
  sortBy?: 'price' | 'distance' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * 微信OAuth相关类型
 */
export interface WechatOAuthRequest {
  code: string;
  state?: string;
}

export interface WechatBindRequest {
  code: string;
}

export interface WechatOAuthResponse {
  user: UserResponseData;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
}

export interface WechatUserInfo {
  openid: string;
  nickname: string;
  headimgurl?: string;
  unionid?: string;
}

export interface WechatBindStatusResponse {
  isBound: boolean;
  wechatInfo?: WechatUserInfo;
}