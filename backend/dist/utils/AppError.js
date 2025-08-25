"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.ErrorFactory = exports.AppError = void 0;
/**
 * 应用错误类 - 统一错误处理
 * 提供结构化的错误信息，便于前端统一处理和用户友好提示
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true, details) {
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
exports.AppError = AppError;
/**
 * 常用错误工厂函数
 */
class ErrorFactory {
    // 400 错误
    static badRequest(message = '请求参数错误', details) {
        return new AppError(message, 400, 'BAD_REQUEST', true, details);
    }
    // 401 错误
    static unauthorized(message = '未授权访问') {
        return new AppError(message, 401, 'UNAUTHORIZED');
    }
    // 403 错误
    static forbidden(message = '禁止访问') {
        return new AppError(message, 403, 'FORBIDDEN');
    }
    // 404 错误
    static notFound(resource = '资源') {
        return new AppError(`${resource}不存在`, 404, 'NOT_FOUND');
    }
    // 409 错误
    static conflict(message = '资源冲突') {
        return new AppError(message, 409, 'CONFLICT');
    }
    // 422 错误
    static validation(message = '数据验证失败', details) {
        return new AppError(message, 422, 'VALIDATION_ERROR', true, details);
    }
    // 429 错误
    static tooManyRequests(message = '请求过于频繁') {
        return new AppError(message, 429, 'TOO_MANY_REQUESTS');
    }
    // 500 错误
    static internal(message = '服务器内部错误', details) {
        return new AppError(message, 500, 'INTERNAL_ERROR', false, details);
    }
    // 503 错误
    static serviceUnavailable(message = '服务暂时不可用') {
        return new AppError(message, 503, 'SERVICE_UNAVAILABLE');
    }
    // 业务逻辑错误
    static businessError(message, code, details) {
        return new AppError(message, 400, code, true, details);
    }
}
exports.ErrorFactory = ErrorFactory;
/**
 * 错误类型常量
 */
exports.ERROR_CODES = {
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
};
//# sourceMappingURL=AppError.js.map