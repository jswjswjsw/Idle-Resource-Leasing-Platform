"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonLogger = exports.securityLogger = exports.performanceLogger = exports.requestLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
/**
 * Winston 日志配置
 * 支持控制台输出和文件输出，根据环境变量调整日志级别
 */
const logLevel = process.env.LOG_LEVEL || 'info';
const logDir = process.env.LOG_FILE_PATH || './logs';
const maxSize = process.env.LOG_MAX_SIZE || '10m';
const maxFiles = process.env.LOG_MAX_FILES || '5';
// 日志格式化
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
    });
}));
// 控制台格式化（开发环境）
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
// 创建日志器
const transports = [];
// 控制台输出
if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: logLevel
    }));
}
// 文件输出
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    // 错误日志
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: parseInt(maxSize.replace('m', '')) * 1024 * 1024,
        maxFiles: parseInt(maxFiles)
    }));
    // 综合日志
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'combined.log'),
        format: logFormat,
        maxsize: parseInt(maxSize.replace('m', '')) * 1024 * 1024,
        maxFiles: parseInt(maxFiles)
    }));
    // 访问日志
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'access.log'),
        level: 'info',
        format: logFormat,
        maxsize: parseInt(maxSize.replace('m', '')) * 1024 * 1024,
        maxFiles: parseInt(maxFiles)
    }));
}
// 创建日志器实例
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    // 退出时错误处理
    exitOnError: false,
    // 异常处理
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log'),
            format: logFormat
        })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log'),
            format: logFormat
        })
    ]
});
exports.winstonLogger = exports.logger;
/**
 * HTTP 请求日志中间件
 * 记录所有HTTP请求的详细信息，包括响应时间、状态码等
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = generateRequestId();
    // 将请求ID附加到请求对象，便于追踪
    req.requestId = requestId;
    // 记录请求开始
    exports.logger.info('请求开始', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('user-agent'),
        ip: getClientIP(req),
        userId: req.user?.id,
        referer: req.get('referer'),
        query: req.query,
        // 不记录敏感信息
        body: sanitizeBody(req.body)
    });
    // 监听响应结束
    res.on('finish', () => {
        const duration = Date.now() - start;
        const responseSize = res.get('content-length') || 0;
        const logLevel = getLogLevel(res.statusCode);
        const logData = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: `${responseSize} bytes`,
            ip: getClientIP(req),
            userId: req.user?.id,
            userAgent: req.get('user-agent')
        };
        exports.logger.log(logLevel, '请求完成', logData);
    });
    // 监听连接关闭
    res.on('close', () => {
        if (!res.writableFinished) {
            exports.logger.warn('请求连接关闭', {
                requestId,
                method: req.method,
                url: req.originalUrl,
                ip: getClientIP(req)
            });
        }
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * 生成请求ID
 */
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
/**
 * 获取客户端IP地址
 */
function getClientIP(req) {
    return (req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress ||
        'unknown');
}
/**
 * 根据状态码决定日志级别
 */
function getLogLevel(statusCode) {
    if (statusCode >= 500) {
        return 'error';
    }
    else if (statusCode >= 400) {
        return 'warn';
    }
    else {
        return 'info';
    }
}
/**
 * 清理请求体中的敏感信息
 */
function sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}
/**
 * 性能监控日志
 */
exports.performanceLogger = {
    /**
     * 记录慢查询
     */
    slowQuery: (query, duration, threshold = 1000) => {
        if (duration > threshold) {
            exports.logger.warn('慢查询检测', {
                query,
                duration: `${duration}ms`,
                threshold: `${threshold}ms`
            });
        }
    },
    /**
     * 记录内存使用情况
     */
    memoryUsage: () => {
        const usage = process.memoryUsage();
        exports.logger.debug('内存使用情况', {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`
        });
    },
    /**
     * 记录第三方API调用
     */
    thirdPartyAPI: (service, method, duration, success) => {
        const logLevel = success ? 'info' : 'error';
        exports.logger.log(logLevel, '第三方API调用', {
            service,
            method,
            duration: `${duration}ms`,
            success
        });
    }
};
/**
 * 安全日志
 */
exports.securityLogger = {
    /**
     * 记录登录尝试
     */
    loginAttempt: (email, success, ip, userAgent) => {
        const logLevel = success ? 'info' : 'warn';
        exports.logger.log(logLevel, success ? '登录成功' : '登录失败', {
            email,
            success,
            ip,
            userAgent,
            type: 'LOGIN_ATTEMPT'
        });
    },
    /**
     * 记录可疑活动
     */
    suspiciousActivity: (activity, details, ip) => {
        exports.logger.warn('可疑活动', {
            activity,
            details,
            ip,
            type: 'SUSPICIOUS_ACTIVITY'
        });
    },
    /**
     * 记录权限拒绝
     */
    accessDenied: (resource, userId, ip) => {
        exports.logger.warn('访问拒绝', {
            resource,
            userId,
            ip,
            type: 'ACCESS_DENIED'
        });
    }
};
//# sourceMappingURL=logger.js.map