"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // 默认错误
    let error = { ...err };
    error.message = err.message;
    // Prisma错误处理
    if (err.code === 'P2002') {
        const message = '数据已存在，违反唯一约束';
        error = new AppError_1.AppError(message, 409, 'DUPLICATE_ENTRY');
    }
    // Prisma记录未找到错误
    if (err.code === 'P2025') {
        const message = '记录未找到';
        error = new AppError_1.AppError(message, 404, 'NOT_FOUND');
    }
    // JWT错误处理
    if (err.name === 'JsonWebTokenError') {
        const message = '无效的token';
        error = new AppError_1.AppError(message, 401, 'INVALID_TOKEN');
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'token已过期';
        error = new AppError_1.AppError(message, 401, 'TOKEN_EXPIRED');
    }
    // 验证错误
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new AppError_1.AppError(message, 400, 'VALIDATION_ERROR');
    }
    // 请求体过大错误
    if (err.type === 'entity.too.large') {
        const message = '请求体过大';
        error = new AppError_1.AppError(message, 413, 'PAYLOAD_TOO_LARGE');
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '服务器内部错误',
        code: error.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map