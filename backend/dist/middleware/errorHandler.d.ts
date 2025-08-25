import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
/**
 * 错误类型枚举
 */
export declare enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
    CONFLICT_ERROR = "CONFLICT_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
    SYSTEM_ERROR = "SYSTEM_ERROR"
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
export declare class AppError extends Error {
    readonly type: ErrorType;
    readonly statusCode: number;
    readonly code: string;
    readonly details?: ErrorDetail[];
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, type?: ErrorType, code?: string, details?: ErrorDetail[], isOperational?: boolean);
    private generateErrorCode;
}
/**
 * 错误工厂类
 */
export declare class ErrorFactory {
    static badRequest(message?: string, details?: ErrorDetail[]): AppError;
    static unauthorized(message?: string, details?: ErrorDetail[]): AppError;
    static forbidden(message?: string, details?: ErrorDetail[]): AppError;
    static notFound(message?: string, details?: ErrorDetail[]): AppError;
    static conflict(message?: string, details?: ErrorDetail[]): AppError;
    static tooManyRequests(message?: string, details?: ErrorDetail[]): AppError;
    static internalServerError(message?: string, details?: ErrorDetail[]): AppError;
    static serviceUnavailable(message?: string, details?: ErrorDetail[]): AppError;
    static businessLogicError(message: string, code?: string, details?: ErrorDetail[]): AppError;
    static databaseError(message?: string, details?: ErrorDetail[]): AppError;
    static validationError(message?: string, details?: ErrorDetail[]): AppError;
}
/**
 * 错误处理器类
 */
export declare class ErrorHandler {
    /**
     * 处理Joi验证错误
     */
    static handleJoiError(error: ValidationError): AppError;
    /**
     * 处理Prisma错误
     */
    static handlePrismaError(error: any): AppError;
    /**
     * 处理JWT错误
     */
    static handleJwtError(error: any): AppError;
    /**
     * 处理MongoDB错误
     */
    static handleMongoError(error: any): AppError;
    /**
     * 处理网络请求错误
     */
    static handleAxiosError(error: any): AppError;
}
/**
 * 全局错误处理中间件
 */
export declare const globalErrorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
/**
 * 未处理的路由错误处理
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 异步错误处理包装器
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 进程异常处理
 */
export declare const setupProcessHandlers: () => void;
//# sourceMappingURL=errorHandler.d.ts.map