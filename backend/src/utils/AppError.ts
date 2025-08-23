/**
 * 应用错误类 - 统一错误处理
 * 提供结构化的错误信息，便于前端统一处理和用户友好提示
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;
    this.name = 'AppError';

    // 确保错误堆栈正确
    Error.captureStackTrace(this, AppError);
  }

  /**
   * 转换为API响应格式
   */
  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * 常用错误工厂函数
 */
export class ErrorFactory {
  // 400 错误
  static badRequest(message: string = '请求参数错误', details?: any): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', true, details);
  }

  // 401 错误
  static unauthorized(message: string = '未授权访问'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  // 403 错误
  static forbidden(message: string = '禁止访问'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  // 404 错误
  static notFound(resource: string = '资源'): AppError {
    return new AppError(`${resource}不存在`, 404, 'NOT_FOUND');
  }

  // 409 错误
  static conflict(message: string = '资源冲突'): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  // 422 错误
  static validation(message: string = '数据验证失败', details?: any): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', true, details);
  }

  // 429 错误
  static tooManyRequests(message: string = '请求过于频繁'): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS');
  }

  // 500 错误
  static internal(message: string = '服务器内部错误', details?: any): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', false, details);
  }

  // 503 错误
  static serviceUnavailable(message: string = '服务暂时不可用'): AppError {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE');
  }

  // 业务逻辑错误
  static businessError(message: string, code: string, details?: any): AppError {
    return new AppError(message, 400, code, true, details);
  }
}

/**
 * 错误类型常量
 */
export const ERROR_CODES = {
  // 通用错误
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // 用户相关错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // 资源相关错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  RESOURCE_ALREADY_BOOKED: 'RESOURCE_ALREADY_BOOKED',
  
  // 订单相关错误
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_CANNOT_BE_CANCELLED: 'ORDER_CANNOT_BE_CANCELLED',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  
  // 支付相关错误
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  
  // 文件相关错误
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // 第三方服务错误
  OAUTH_ERROR: 'OAUTH_ERROR',
  SMS_SEND_FAILED: 'SMS_SEND_FAILED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];