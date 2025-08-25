"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProcessHandlers = exports.asyncHandler = exports.notFoundHandler = exports.globalErrorHandler = exports.ErrorHandler = exports.ErrorFactory = exports.AppError = exports.ErrorType = void 0;
const AppError_1 = require("@/utils/AppError");
const logger_1 = require("@/middleware/logger");
const client_1 = require("@prisma/client");
/**
 * 错误类型枚举
 */
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorType["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorType["NOT_FOUND_ERROR"] = "NOT_FOUND_ERROR";
    ErrorType["CONFLICT_ERROR"] = "CONFLICT_ERROR";
    ErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    ErrorType["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorType["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorType["BUSINESS_LOGIC_ERROR"] = "BUSINESS_LOGIC_ERROR";
    ErrorType["SYSTEM_ERROR"] = "SYSTEM_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
/**
 * 自定义应用错误类
 */
class AppError extends Error {
    constructor(message, statusCode = 500, type = ErrorType.SYSTEM_ERROR, code, details, isOperational = true) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.code = code || this.generateErrorCode(type, statusCode);
        this.details = details;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
    generateErrorCode(type, statusCode) {
        const typePrefix = type.replace('_ERROR', '').substring(0, 3);
        return `${typePrefix}_${statusCode}`;
    }
}
exports.AppError = AppError;
/**
 * 错误工厂类
 */
class ErrorFactory {
    static badRequest(message = '请求参数错误', details) {
        return new AppError(message, 400, ErrorType.VALIDATION_ERROR, 'BAD_REQUEST', details);
    }
    static unauthorized(message = '未授权访问', details) {
        return new AppError(message, 401, ErrorType.AUTHENTICATION_ERROR, 'UNAUTHORIZED', details);
    }
    static forbidden(message = '禁止访问', details) {
        return new AppError(message, 403, ErrorType.AUTHORIZATION_ERROR, 'FORBIDDEN', details);
    }
    static notFound(message = '资源不存在', details) {
        return new AppError(message, 404, ErrorType.NOT_FOUND_ERROR, 'NOT_FOUND', details);
    }
    static conflict(message = '资源冲突', details) {
        return new AppError(message, 409, ErrorType.CONFLICT_ERROR, 'CONFLICT', details);
    }
    static tooManyRequests(message = '请求过于频繁', details) {
        return new AppError(message, 429, ErrorType.RATE_LIMIT_ERROR, 'TOO_MANY_REQUESTS', details);
    }
    static internalServerError(message = '服务器内部错误', details) {
        return new AppError(message, 500, ErrorType.SYSTEM_ERROR, 'INTERNAL_SERVER_ERROR', details);
    }
    static serviceUnavailable(message = '服务不可用', details) {
        return new AppError(message, 503, ErrorType.EXTERNAL_SERVICE_ERROR, 'SERVICE_UNAVAILABLE', details);
    }
    static businessLogicError(message, code, details) {
        return new AppError(message, 400, ErrorType.BUSINESS_LOGIC_ERROR, code || 'BUSINESS_LOGIC_ERROR', details);
    }
    static databaseError(message = '数据库操作失败', details) {
        return new AppError(message, 500, ErrorType.DATABASE_ERROR, 'DATABASE_ERROR', details);
    }
    static validationError(message = '数据验证失败', details) {
        return new AppError(message, 400, ErrorType.VALIDATION_ERROR, 'VALIDATION_ERROR', details);
    }
}
exports.ErrorFactory = ErrorFactory;
/**
 * 错误处理器类
 */
class ErrorHandler {
    /**
     * 处理Joi验证错误
     */
    static handleJoiError(error) {
        const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
        }));
        return AppError_1.ErrorFactory.validationError('数据验证失败', details);
    }
    /**
     * 处理Prisma错误
     */
    static handlePrismaError(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2000':
                    return AppError_1.ErrorFactory.badRequest('输入数据过长');
                case 'P2001':
                    return AppError_1.ErrorFactory.notFound('记录不存在');
                case 'P2002':
                    return AppError_1.ErrorFactory.conflict('数据重复，违反唯一约束');
                case 'P2003':
                    return AppError_1.ErrorFactory.badRequest('外键约束失败');
                case 'P2004':
                    return AppError_1.ErrorFactory.badRequest('数据库约束失败');
                case 'P2005':
                    return AppError_1.ErrorFactory.badRequest('字段值无效');
                case 'P2006':
                    return AppError_1.ErrorFactory.badRequest('提供的值对字段无效');
                case 'P2007':
                    return AppError_1.ErrorFactory.badRequest('数据验证错误');
                case 'P2008':
                    return AppError_1.ErrorFactory.internalServerError('查询解析失败');
                case 'P2009':
                    return AppError_1.ErrorFactory.internalServerError('查询验证失败');
                case 'P2010':
                    return AppError_1.ErrorFactory.internalServerError('原始查询失败');
                case 'P2011':
                    return AppError_1.ErrorFactory.badRequest('空约束违规');
                case 'P2012':
                    return AppError_1.ErrorFactory.badRequest('缺少必需值');
                case 'P2013':
                    return AppError_1.ErrorFactory.badRequest('缺少必需参数');
                case 'P2014':
                    return AppError_1.ErrorFactory.badRequest('关系违规');
                case 'P2015':
                    return AppError_1.ErrorFactory.notFound('相关记录不存在');
                case 'P2016':
                    return AppError_1.ErrorFactory.internalServerError('查询解释错误');
                case 'P2017':
                    return AppError_1.ErrorFactory.badRequest('记录未连接');
                case 'P2018':
                    return AppError_1.ErrorFactory.notFound('必需的连接记录不存在');
                case 'P2019':
                    return AppError_1.ErrorFactory.badRequest('输入错误');
                case 'P2020':
                    return AppError_1.ErrorFactory.badRequest('值超出范围');
                case 'P2021':
                    return AppError_1.ErrorFactory.internalServerError('表不存在');
                case 'P2022':
                    return AppError_1.ErrorFactory.internalServerError('列不存在');
                case 'P2023':
                    return AppError_1.ErrorFactory.internalServerError('列数据不一致');
                case 'P2024':
                    return AppError_1.ErrorFactory.internalServerError('连接池超时');
                case 'P2025':
                    return AppError_1.ErrorFactory.notFound('依赖记录不存在');
                default:
                    return AppError_1.ErrorFactory.databaseError(`数据库错误: ${error.message}`);
            }
        }
        if (error instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
            return AppError_1.ErrorFactory.databaseError('未知数据库错误');
        }
        if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
            return AppError_1.ErrorFactory.internalServerError('数据库引擎错误');
        }
        if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
            return AppError_1.ErrorFactory.serviceUnavailable('数据库连接失败');
        }
        if (error instanceof client_1.Prisma.PrismaClientValidationError) {
            return AppError_1.ErrorFactory.badRequest('查询验证错误');
        }
        return AppError_1.ErrorFactory.databaseError('数据库操作失败');
    }
    /**
     * 处理JWT错误
     */
    static handleJwtError(error) {
        if (error.name === 'TokenExpiredError') {
            return AppError_1.ErrorFactory.unauthorized('令牌已过期');
        }
        if (error.name === 'JsonWebTokenError') {
            return AppError_1.ErrorFactory.unauthorized('无效的令牌');
        }
        if (error.name === 'NotBeforeError') {
            return AppError_1.ErrorFactory.unauthorized('令牌尚未生效');
        }
        return AppError_1.ErrorFactory.unauthorized('令牌验证失败');
    }
    /**
     * 处理MongoDB错误
     */
    static handleMongoError(error) {
        if (error.code === 11000) {
            return AppError_1.ErrorFactory.conflict('数据重复');
        }
        if (error.name === 'ValidationError') {
            const details = Object.values(error.errors).map((err) => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));
            return AppError_1.ErrorFactory.validationError('数据验证失败', details);
        }
        if (error.name === 'CastError') {
            return AppError_1.ErrorFactory.badRequest('数据类型错误');
        }
        return AppError_1.ErrorFactory.databaseError('数据库操作失败');
    }
    /**
     * 处理网络请求错误
     */
    static handleAxiosError(error) {
        if (error.response) {
            // 服务器响应了错误状态码
            const status = error.response.status;
            const message = error.response.data?.message || error.message;
            if (status >= 400 && status < 500) {
                return AppError_1.ErrorFactory.badRequest(`外部服务错误: ${message}`);
            }
            if (status >= 500) {
                return AppError_1.ErrorFactory.serviceUnavailable(`外部服务不可用: ${message}`);
            }
        }
        else if (error.request) {
            // 请求发出但没有收到响应
            return AppError_1.ErrorFactory.serviceUnavailable('外部服务无响应');
        }
        else {
            // 其他错误
            return AppError_1.ErrorFactory.internalServerError(`请求配置错误: ${error.message}`);
        }
        return AppError_1.ErrorFactory.serviceUnavailable('外部服务错误');
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * 全局错误处理中间件
 */
const globalErrorHandler = (error, req, res, next) => {
    let appError;
    // 判断错误类型并转换为AppError
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error.isJoi) {
        appError = ErrorHandler.handleJoiError(error);
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError ||
        error instanceof client_1.Prisma.PrismaClientUnknownRequestError ||
        error instanceof client_1.Prisma.PrismaClientRustPanicError ||
        error instanceof client_1.Prisma.PrismaClientInitializationError ||
        error instanceof client_1.Prisma.PrismaClientValidationError) {
        appError = ErrorHandler.handlePrismaError(error);
    }
    else if (error.name && ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
        appError = ErrorHandler.handleJwtError(error);
    }
    else if (error.name && ['ValidationError', 'CastError'].includes(error.name)) {
        appError = ErrorHandler.handleMongoError(error);
    }
    else if (error.isAxiosError) {
        appError = ErrorHandler.handleAxiosError(error);
    }
    else {
        // 未知错误
        appError = AppError_1.ErrorFactory.internalServerError(process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message);
    }
    // 生成请求ID
    const requestId = req.headers['x-request-id'] || generateRequestId();
    // 构建错误响应
    const errorResponse = {
        success: false,
        message: appError.message,
        type: appError.type,
        code: appError.code,
        details: appError.details,
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: requestId
    };
    // 在开发环境中包含堆栈跟踪
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = appError.stack;
    }
    // 记录错误日志
    const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
    logger_1.winstonLogger.log(logLevel, '请求错误', {
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
        userId: req.user?.id,
        stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined
    });
    // 发送错误响应
    res.status(appError.statusCode).json(errorResponse);
};
exports.globalErrorHandler = globalErrorHandler;
/**
 * 未处理的路由错误处理
 */
const notFoundHandler = (req, res, next) => {
    const error = AppError_1.ErrorFactory.notFound(`路由 ${req.originalUrl} 不存在`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * 生成请求ID
 */
function generateRequestId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
/**
 * 异步错误处理包装器
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * 进程异常处理
 */
const setupProcessHandlers = () => {
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
        logger_1.winstonLogger.error('未捕获的异常', {
            error: error.message,
            stack: error.stack
        });
        // 优雅地关闭应用
        process.exit(1);
    });
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.winstonLogger.error('未处理的Promise拒绝', {
            reason: reason?.message || reason,
            stack: reason?.stack
        });
        // 优雅地关闭应用
        process.exit(1);
    });
    // 处理进程终止信号
    process.on('SIGTERM', () => {
        logger_1.winstonLogger.info('收到SIGTERM信号，正在优雅关闭应用');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        logger_1.winstonLogger.info('收到SIGINT信号，正在优雅关闭应用');
        process.exit(0);
    });
};
exports.setupProcessHandlers = setupProcessHandlers;
//# sourceMappingURL=errorHandler.js.map