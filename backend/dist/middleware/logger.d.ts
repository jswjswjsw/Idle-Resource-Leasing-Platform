import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
export declare const logger: winston.Logger;
/**
 * HTTP 请求日志中间件
 * 记录所有HTTP请求的详细信息，包括响应时间、状态码等
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 性能监控日志
 */
export declare const performanceLogger: {
    /**
     * 记录慢查询
     */
    slowQuery: (query: string, duration: number, threshold?: number) => void;
    /**
     * 记录内存使用情况
     */
    memoryUsage: () => void;
    /**
     * 记录第三方API调用
     */
    thirdPartyAPI: (service: string, method: string, duration: number, success: boolean) => void;
};
/**
 * 安全日志
 */
export declare const securityLogger: {
    /**
     * 记录登录尝试
     */
    loginAttempt: (email: string, success: boolean, ip: string, userAgent?: string) => void;
    /**
     * 记录可疑活动
     */
    suspiciousActivity: (activity: string, details: any, ip: string) => void;
    /**
     * 记录权限拒绝
     */
    accessDenied: (resource: string, userId?: string, ip?: string) => void;
};
export { requestLogger as logger };
export { logger as winstonLogger };
//# sourceMappingURL=logger.d.ts.map