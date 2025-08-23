// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  creditScore: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// 用户注册请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// 用户登录请求类型
export interface LoginRequest {
  email: string;
  password: string;
}

// 用户信息更新请求类型
export interface UpdateUserRequest {
  username?: string;
  phone?: string;
  avatar?: string;
}

// 资源分类枚举
export type ResourceCategory = 
  | 'electronics'      // 电子设备
  | 'furniture'        // 家具
  | 'clothing'         // 服装
  | 'sports'          // 运动器材
  | 'books'           // 图书
  | 'tools'           // 工具
  | 'vehicles'        // 交通工具
  | 'spaces'          // 场地空间
  | 'other';          // 其他

// 资源状态枚举
export type ResourceStatus = 'available' | 'rented' | 'maintenance' | 'unavailable';

// 资源类型定义
export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  price: number;
  priceUnit: 'hour' | 'day' | 'week' | 'month';
  images: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  ownerId: string;
  owner: User;
  status: ResourceStatus;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建资源请求类型
export interface CreateResourceRequest {
  title: string;
  description: string;
  category: ResourceCategory;
  price: number;
  priceUnit: 'hour' | 'day' | 'week' | 'month';
  images: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  tags: string[];
}

// 更新资源请求类型
export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  price?: number;
  priceUnit?: 'hour' | 'day' | 'week' | 'month';
  images?: string[];
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  status?: ResourceStatus;
}

// 订单状态枚举
export type OrderStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

// 支付状态枚举
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

// 订单类型定义
export interface Order {
  id: string;
  resourceId: string;
  resource: Resource;
  renterId: string;
  renter: User;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建订单请求类型
export interface CreateOrderRequest {
  resourceId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

// 更新订单状态请求类型
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

// 订单评价类型
export interface OrderReview {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewer: User;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
}

// 响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 分页类型定义
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

// 搜索筛选类型定义
export interface SearchFilters {
  keyword?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  location?: string;
  sortBy?: 'price' | 'rating' | 'createdAt' | 'distance';
  sortOrder?: 'asc' | 'desc';
  rating?: number;
  verified?: boolean;
}

// 聊天消息类型枚举
export type ChatMessageType = 'text' | 'image' | 'system' | 'location' | 'file';

// 聊天消息类型定义
export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: ChatMessageType;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, any>;
}

// 创建聊天消息请求类型
export interface CreateChatMessageRequest {
  orderId: string;
  receiverId: string;
  message: string;
  type: ChatMessageType;
  metadata?: Record<string, any>;
}

// 通知类型枚举
export type NotificationType = 'order' | 'message' | 'system' | 'promotion' | 'payment' | 'review';

// 通知类型定义
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
  createdAt: string;
}

// 支付相关类型定义
export interface PaymentMethod {
  id: string;
  type: 'alipay' | 'wechat' | 'card';
  name: string;
  isDefault: boolean;
  details: Record<string, any>;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  message?: string;
}

// 文件上传相关类型定义
export interface FileUploadRequest {
  file: File;
  type: 'image' | 'video' | 'document';
  purpose: 'resource' | 'user' | 'review';
}

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

// 表单验证错误类型
export interface FormError {
  field: string;
  message: string;
}

// API错误响应类型
export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: FormError[];
}

// 地理位置类型
export interface Location {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

// 统计信息类型
export interface DashboardStats {
  totalUsers: number;
  totalResources: number;
  totalOrders: number;
  totalRevenue: number;
  activeRentals: number;
  pendingOrders: number;
}

// 用户偏好设置类型
export interface UserPreferences {
  language: 'zh-CN' | 'en-US';
  currency: 'CNY';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
  };
}