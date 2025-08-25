/**
 * 应用错误类 - 统一错误处理
 * 提供结构化的错误信息，便于前端统一处理和用户友好提示
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly timestamp: string;
    readonly details?: any;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean, details?: any);
    /**
     * 转换为API响应格式
     */
    toJSON(): any;
}
/**
 * 常用错误工厂函数
 */
export declare class ErrorFactory {
    static badRequest(message?: string, details?: any): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(resource?: string): AppError;
    static conflict(message?: string): AppError;
    static validation(message?: string, details?: any): AppError;
    static tooManyRequests(message?: string): AppError;
    static internal(message?: string, details?: any): AppError;
    static serviceUnavailable(message?: string): AppError;
    static businessError(message: string, code: string, details?: any): AppError;
}
/**
 * 错误类型常量
 */
export declare const ERROR_CODES: {
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE";
    readonly RESOURCE_ALREADY_BOOKED: "RESOURCE_ALREADY_BOOKED";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_CANNOT_BE_CANCELLED: "ORDER_CANNOT_BE_CANCELLED";
    readonly ORDER_ALREADY_PAID: "ORDER_ALREADY_PAID";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly PAYMENT_CANCELLED: "PAYMENT_CANCELLED";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED";
    readonly UPLOAD_FAILED: "UPLOAD_FAILED";
    readonly OAUTH_ERROR: "OAUTH_ERROR";
    readonly SMS_SEND_FAILED: "SMS_SEND_FAILED";
    readonly EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
//# sourceMappingURL=AppError.d.ts.map