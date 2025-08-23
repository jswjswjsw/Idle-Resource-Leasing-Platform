import { Request, Response, NextFunction } from 'express';
import { ErrorFactory } from '@/utils/AppError';
import { winstonLogger } from '@/middleware/logger';
import { ValidationError } from 'joi';
import { Prisma } from '@prisma/client';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

/**
 * 错误详情接口
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * 标准化错误响应接口
 */
export interface ErrorResponse {
  success: false;
  message: string;
  type: ErrorType;
  code: string;
  details?: ErrorDetail[];
  timestamp: string;
  path: string;
  requestId?: string;
  stack?: string;
}

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    type: ErrorType = ErrorType.SYSTEM_ERROR,
    code?: string,
    details?: ErrorDetail[],
    isOperational: boolean = true
  ) {
    super(message);
    
    this.type = type;
    this.statusCode = statusCode;
    this.code = code || this.generateErrorCode(type, statusCode);
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }

  private generateErrorCode(type: ErrorType, statusCode: number): string {
    const typePrefix = type.replace('_ERROR', '').substring(0, 3);
    return `${typePrefix}_${statusCode}`;
  }
}

/**
 * 错误工厂类
 */
export class ErrorFactory {
  static badRequest(
    message: string = '请求参数错误',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      400,
      ErrorType.VALIDATION_ERROR,
      'BAD_REQUEST',
      details
    );
  }

  static unauthorized(
    message: string = '未授权访问',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      401,
      ErrorType.AUTHENTICATION_ERROR,
      'UNAUTHORIZED',
      details
    );
  }

  static forbidden(
    message: string = '禁止访问',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      403,
      ErrorType.AUTHORIZATION_ERROR,
      'FORBIDDEN',
      details
    );
  }

  static notFound(
    message: string = '资源不存在',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      404,
      ErrorType.NOT_FOUND_ERROR,
      'NOT_FOUND',
      details
    );
  }

  static conflict(
    message: string = '资源冲突',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      409,
      ErrorType.CONFLICT_ERROR,
      'CONFLICT',
      details
    );
  }

  static tooManyRequests(
    message: string = '请求过于频繁',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      429,
      ErrorType.RATE_LIMIT_ERROR,
      'TOO_MANY_REQUESTS',
      details
    );
  }

  static internalServerError(
    message: string = '服务器内部错误',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      500,
      ErrorType.SYSTEM_ERROR,
      'INTERNAL_SERVER_ERROR',
      details
    );
  }

  static serviceUnavailable(
    message: string = '服务不可用',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      503,
      ErrorType.EXTERNAL_SERVICE_ERROR,
      'SERVICE_UNAVAILABLE',
      details
    );
  }

  static businessLogicError(
    message: string,
    code?: string,
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      400,
      ErrorType.BUSINESS_LOGIC_ERROR,
      code || 'BUSINESS_LOGIC_ERROR',
      details
    );
  }

  static databaseError(
    message: string = '数据库操作失败',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      500,
      ErrorType.DATABASE_ERROR,
      'DATABASE_ERROR',
      details
    );
  }

  static validationError(
    message: string = '数据验证失败',
    details?: ErrorDetail[]
  ): AppError {
    return new AppError(
      message,
      400,
      ErrorType.VALIDATION_ERROR,
      'VALIDATION_ERROR',
      details
    );
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 处理Joi验证错误
   */
  static handleJoiError(error: ValidationError): AppError {
    const details: ErrorDetail[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return ErrorFactory.validationError('数据验证失败', details);
  }

  /**
   * 处理Prisma错误
   */
  static handlePrismaError(error: any): AppError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2000':
          return ErrorFactory.badRequest('输入数据过长');
        case 'P2001':
          return ErrorFactory.notFound('记录不存在');
        case 'P2002':
          return ErrorFactory.conflict('数据重复，违反唯一约束');
        case 'P2003':
          return ErrorFactory.badRequest('外键约束失败');
        case 'P2004':
          return ErrorFactory.badRequest('数据库约束失败');
        case 'P2005':
          return ErrorFactory.badRequest('字段值无效');
        case 'P2006':
          return ErrorFactory.badRequest('提供的值对字段无效');
        case 'P2007':
          return ErrorFactory.badRequest('数据验证错误');
        case 'P2008':
          return ErrorFactory.internalServerError('查询解析失败');
        case 'P2009':
          return ErrorFactory.internalServerError('查询验证失败');
        case 'P2010':
          return ErrorFactory.internalServerError('原始查询失败');
        case 'P2011':
          return ErrorFactory.badRequest('空约束违规');
        case 'P2012':
          return ErrorFactory.badRequest('缺少必需值');
        case 'P2013':
          return ErrorFactory.badRequest('缺少必需参数');
        case 'P2014':
          return ErrorFactory.badRequest('关系违规');
        case 'P2015':
          return ErrorFactory.notFound('相关记录不存在');
        case 'P2016':
          return ErrorFactory.internalServerError('查询解释错误');
        case 'P2017':
          return ErrorFactory.badRequest('记录未连接');
        case 'P2018':
          return ErrorFactory.notFound('必需的连接记录不存在');
        case 'P2019':
          return ErrorFactory.badRequest('输入错误');
        case 'P2020':
          return ErrorFactory.badRequest('值超出范围');
        case 'P2021':
          return ErrorFactory.internalServerError('表不存在');
        case 'P2022':
          return ErrorFactory.internalServerError('列不存在');
        case 'P2023':
          return ErrorFactory.internalServerError('列数据不一致');
        case 'P2024':
          return ErrorFactory.internalServerError('连接池超时');
        case 'P2025':
          return ErrorFactory.notFound('依赖记录不存在');
        default:
          return ErrorFactory.databaseError(`数据库错误: ${error.message}`);
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return ErrorFactory.databaseError('未知数据库错误');
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return ErrorFactory.internalServerError('数据库引擎错误');
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return ErrorFactory.serviceUnavailable('数据库连接失败');
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return ErrorFactory.badRequest('查询验证错误');
    }

    return ErrorFactory.databaseError('数据库操作失败');
  }

  /**
   * 处理JWT错误
   */
  static handleJwtError(error: any): AppError {
    if (error.name === 'TokenExpiredError') {
      return ErrorFactory.unauthorized('令牌已过期');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return ErrorFactory.unauthorized('无效的令牌');
    }
    
    if (error.name === 'NotBeforeError') {
      return ErrorFactory.unauthorized('令牌尚未生效');
    }
    
    return ErrorFactory.unauthorized('令牌验证失败');
  }

  /**
   * 处理MongoDB错误
   */
  static handleMongoError(error: any): AppError {
    if (error.code === 11000) {
      return ErrorFactory.conflict('数据重复');
    }
    
    if (error.name === 'ValidationError') {
      const details: ErrorDetail[] = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return ErrorFactory.validationError('数据验证失败', details);
    }
    
    if (error.name === 'CastError') {
      return ErrorFactory.badRequest('数据类型错误');
    }
    
    return ErrorFactory.databaseError('数据库操作失败');
  }

  /**
   * 处理网络请求错误
   */
  static handleAxiosError(error: any): AppError {
    if (error.response) {
      // 服务器响应了错误状态码
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status >= 400 && status < 500) {
        return ErrorFactory.badRequest(`外部服务错误: ${message}`);
      }
      
      if (status >= 500) {
        return ErrorFactory.serviceUnavailable(`外部服务不可用: ${message}`);
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      return ErrorFactory.serviceUnavailable('外部服务无响应');
    } else {
      // 其他错误
      return ErrorFactory.internalServerError(`请求配置错误: ${error.message}`);
    }
    
    return ErrorFactory.serviceUnavailable('外部服务错误');
  }
}

/**
 * 全局错误处理中间件
 */
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // 判断错误类型并转换为AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.isJoi) {
    appError = ErrorHandler.handleJoiError(error);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError || 
             error instanceof Prisma.PrismaClientUnknownRequestError || 
             error instanceof Prisma.PrismaClientRustPanicError || 
             error instanceof Prisma.PrismaClientInitializationError || 
             error instanceof Prisma.PrismaClientValidationError) {
    appError = ErrorHandler.handlePrismaError(error);
  } else if (error.name && ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
    appError = ErrorHandler.handleJwtError(error);
  } else if (error.name && ['ValidationError', 'CastError'].includes(error.name)) {
    appError = ErrorHandler.handleMongoError(error);
  } else if (error.isAxiosError) {
    appError = ErrorHandler.handleAxiosError(error);
  } else {
    // 未知错误
    appError = ErrorFactory.internalServerError(
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
    );
  }

  // 生成请求ID
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // 构建错误响应
  const errorResponse: ErrorResponse = {
    success: false,
    message: appError.message,
    type: appError.type,
    code: appError.code,
    details: appError.details,
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: requestId as string
  };

  // 在开发环境中包含堆栈跟踪
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = appError.stack;
  }

  // 记录错误日志
  const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
  winstonLogger.log(logLevel, '请求错误', {
    requestId,
    method: req.method,
    path: req.path,
    statusCode: appError.statusCode,
    message: appError.message,
    type: appError.type,
    code: appError.code,
    details: appError.details,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined
  });

  // 发送错误响应
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 未处理的路由错误处理
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = ErrorFactory.notFound(`路由 ${req.originalUrl} 不存在`);
  next(error);
};

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 异步错误处理包装器
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 进程异常处理
 */
export const setupProcessHandlers = (): void => {
  // 处理未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    winstonLogger.error('未捕获的异常', {
      error: error.message,
      stack: error.stack
    });
    
    // 优雅地关闭应用
    process.exit(1);
  });

  // 处理未处理的Promise拒绝
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    winstonLogger.error('未处理的Promise拒绝', {
      reason: reason?.message || reason,
      stack: reason?.stack
    });
    
    // 优雅地关闭应用
    process.exit(1);
  });

  // 处理进程终止信号
  process.on('SIGTERM', () => {
    winstonLogger.info('收到SIGTERM信号，正在优雅关闭应用');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    winstonLogger.info('收到SIGINT信号，正在优雅关闭应用');
    process.exit(0);
  });
};
