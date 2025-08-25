"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationCodeService = exports.VerificationCodeService = void 0;
exports.sendEmailVerification = sendEmailVerification;
exports.sendSmsVerification = sendSmsVerification;
exports.verifyCode = verifyCode;
exports.clearVerificationCode = clearVerificationCode;
exports.getVerificationStatus = getVerificationStatus;
exports.cleanupExpiredCodes = cleanupExpiredCodes;
const smsService_1 = require("./smsService");
const cache_1 = require("@/config/cache");
const logger_1 = require("@/middleware/logger");
const emailService_1 = require("./emailService");
const smsService_2 = require("./smsService");
/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    register: {
        length: 6,
        expireMinutes: 10,
        maxAttempts: 5,
        sendInterval: 60,
        dailyLimit: 10
    },
    login: {
        length: 6,
        expireMinutes: 5,
        maxAttempts: 3,
        sendInterval: 60,
        dailyLimit: 5
    },
    reset_password: {
        length: 6,
        expireMinutes: 10,
        maxAttempts: 5,
        sendInterval: 120,
        dailyLimit: 5
    },
    change_phone: {
        length: 6,
        expireMinutes: 10,
        maxAttempts: 3,
        sendInterval: 60,
        dailyLimit: 3
    },
    change_email: {
        length: 6,
        expireMinutes: 10,
        maxAttempts: 3,
        sendInterval: 60,
        dailyLimit: 3
    }
};
/**
 * 生成验证码
 */
function generateCode(length) {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
/**
 * 生成缓存键
 */
function getCacheKey(type, target, scene) {
    return `${type === 'email' ? cache_1.CACHE_KEYS.EMAIL_CODE : cache_1.CACHE_KEYS.SMS_CODE}${target}:${scene}`;
}
/**
 * 生成每日计数缓存键
 */
function getDailyCountKey(type, target) {
    const today = new Date().toISOString().split('T')[0];
    return `verification_count:${type}:${target}:${today}`;
}
/**
 * 发送邮箱验证码
 */
async function sendEmailVerification(email, username, scene = 'register') {
    try {
        const config = DEFAULT_CONFIG[scene];
        const cacheKey = getCacheKey('email', email, scene);
        const dailyCountKey = getDailyCountKey('email', email);
        // 检查每日发送限制
        const dailyCount = await cache_1.cache.get(dailyCountKey) || 0;
        if (dailyCount >= config.dailyLimit) {
            return {
                success: false,
                message: `今日发送次数已达上限（${config.dailyLimit}次），请明天再试`
            };
        }
        // 检查发送间隔
        const existingRecord = await cache_1.cache.get(cacheKey);
        if (existingRecord) {
            const timeSinceLastSend = Date.now() - existingRecord.lastSendTime;
            if (timeSinceLastSend < config.sendInterval * 1000) {
                const remainingTime = Math.ceil((config.sendInterval * 1000 - timeSinceLastSend) / 1000);
                return {
                    success: false,
                    message: `请等待 ${remainingTime} 秒后再次发送`,
                    nextSendTime: Date.now() + (remainingTime * 1000)
                };
            }
        }
        // 生成验证码
        const code = generateCode(config.length);
        const now = Date.now();
        // 创建或更新验证码记录
        const record = {
            code,
            attempts: 0,
            sendCount: (existingRecord?.sendCount || 0) + 1,
            lastSendTime: now,
            scene,
            createdAt: now
        };
        // 存储验证码
        await cache_1.cache.set(cacheKey, record, config.expireMinutes * 60);
        // 更新每日计数
        await cache_1.cache.set(dailyCountKey, dailyCount + 1, cache_1.CACHE_TTL.VERY_LONG);
        // 发送邮件
        const emailSent = await (0, emailService_1.sendVerificationEmail)(email, username, code, config.expireMinutes);
        if (!emailSent) {
            logger_1.winstonLogger.error('邮箱验证码发送失败', { email, scene });
            return {
                success: false,
                message: '验证码发送失败，请稍后重试'
            };
        }
        logger_1.winstonLogger.info('邮箱验证码发送成功', {
            email: email.replace(/(.{2}).*(@.*)/, '$1****$2'),
            scene,
            sendCount: record.sendCount
        });
        return {
            success: true,
            message: '验证码已发送到您的邮箱，请查收',
            nextSendTime: now + (config.sendInterval * 1000)
        };
    }
    catch (error) {
        logger_1.winstonLogger.error('发送邮箱验证码异常', {
            email: email.replace(/(.{2}).*(@.*)/, '$1****$2'),
            scene,
            error: error.message
        });
        return {
            success: false,
            message: '验证码发送失败，请稍后重试'
        };
    }
}
/**
 * 发送短信验证码
 */
async function sendSmsVerification(phone, scene = 'register') {
    try {
        const config = DEFAULT_CONFIG[scene];
        const cacheKey = getCacheKey('sms', phone, scene);
        const dailyCountKey = getDailyCountKey('sms', phone);
        // 检查每日发送限制
        const dailyCount = await cache_1.cache.get(dailyCountKey) || 0;
        if (dailyCount >= config.dailyLimit) {
            return {
                success: false,
                message: `今日发送次数已达上限（${config.dailyLimit}次），请明天再试`
            };
        }
        // 检查发送间隔
        const existingRecord = await cache_1.cache.get(cacheKey);
        if (existingRecord) {
            const timeSinceLastSend = Date.now() - existingRecord.lastSendTime;
            if (timeSinceLastSend < config.sendInterval * 1000) {
                const remainingTime = Math.ceil((config.sendInterval * 1000 - timeSinceLastSend) / 1000);
                return {
                    success: false,
                    message: `请等待 ${remainingTime} 秒后再次发送`,
                    nextSendTime: Date.now() + (remainingTime * 1000)
                };
            }
        }
        // 生成验证码
        const code = generateCode(config.length);
        const now = Date.now();
        // 创建或更新验证码记录
        const record = {
            code,
            attempts: 0,
            sendCount: (existingRecord?.sendCount || 0) + 1,
            lastSendTime: now,
            scene,
            createdAt: now
        };
        // 存储验证码
        await cache_1.cache.set(cacheKey, record, config.expireMinutes * 60);
        // 更新每日计数
        await cache_1.cache.set(dailyCountKey, dailyCount + 1, cache_1.CACHE_TTL.VERY_LONG);
        // 发送短信
        const smsSent = await (0, smsService_2.sendVerificationSms)(phone, code, config.expireMinutes);
        if (!smsSent) {
            logger_1.winstonLogger.error('短信验证码发送失败', { phone: phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'), scene });
            return {
                success: false,
                message: '验证码发送失败，请稍后重试'
            };
        }
        logger_1.winstonLogger.info('短信验证码发送成功', {
            phone: phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'),
            scene,
            sendCount: record.sendCount
        });
        return {
            success: true,
            message: '验证码已发送到您的手机，请查收',
            nextSendTime: now + (config.sendInterval * 1000)
        };
    }
    catch (error) {
        logger_1.winstonLogger.error('发送短信验证码异常', {
            phone: phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'),
            scene,
            error: error.message
        });
        return {
            success: false,
            message: '验证码发送失败，请稍后重试'
        };
    }
}
/**
 * 验证验证码
 */
async function verifyCode(type, target, code, scene) {
    try {
        const config = DEFAULT_CONFIG[scene];
        const cacheKey = getCacheKey(type, target, scene);
        // 获取验证码记录
        const record = await cache_1.cache.get(cacheKey);
        if (!record) {
            return {
                success: false,
                message: '验证码不存在或已过期，请重新获取'
            };
        }
        // 检查尝试次数
        if (record.attempts >= config.maxAttempts) {
            await cache_1.cache.del(cacheKey); // 删除已超限的验证码
            return {
                success: false,
                message: '验证次数已达上限，请重新获取验证码'
            };
        }
        // 验证码比对
        if (record.code !== code) {
            // 增加尝试次数
            record.attempts += 1;
            const remainingMinutes = Math.ceil((record.createdAt + config.expireMinutes * 60 * 1000 - Date.now()) / 60000);
            await cache_1.cache.set(cacheKey, record, remainingMinutes * 60);
            const remainingAttempts = config.maxAttempts - record.attempts;
            logger_1.winstonLogger.warn('验证码验证失败', {
                type,
                target: type === 'email' ? target.replace(/(.{2}).*(@.*)/, '$1****$2') : target.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'),
                scene,
                attempts: record.attempts,
                remainingAttempts
            });
            return {
                success: false,
                message: `验证码错误，还可尝试 ${remainingAttempts} 次`,
                remainingAttempts
            };
        }
        // 验证成功，删除验证码
        await cache_1.cache.del(cacheKey);
        logger_1.winstonLogger.info('验证码验证成功', {
            type,
            target: type === 'email' ? target.replace(/(.{2}).*(@.*)/, '$1****$2') : target.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'),
            scene,
            attempts: record.attempts + 1
        });
        return {
            success: true,
            message: '验证码验证成功'
        };
    }
    catch (error) {
        logger_1.winstonLogger.error('验证验证码异常', {
            type,
            target: type === 'email' ? target.replace(/(.{2}).*(@.*)/, '$1****$2') : target.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'),
            scene,
            error: error.message
        });
        return {
            success: false,
            message: '验证过程出错，请稍后重试'
        };
    }
}
/**
 * 清除验证码
 */
async function clearVerificationCode(type, target, scene) {
    try {
        const cacheKey = getCacheKey(type, target, scene);
        await cache_1.cache.del(cacheKey);
        logger_1.winstonLogger.info('验证码已清除', {
            type,
            target: type === 'email' ? target.replace(/(.{2}).*(@.*)/, '$1****$2') : target.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2'),
            scene
        });
    }
    catch (error) {
        logger_1.winstonLogger.error('清除验证码异常', {
            type,
            target,
            scene,
            error: error.message
        });
    }
}
/**
 * 获取验证码状态
 */
async function getVerificationStatus(type, target, scene) {
    try {
        const config = DEFAULT_CONFIG[scene];
        const cacheKey = getCacheKey(type, target, scene);
        const dailyCountKey = getDailyCountKey(type, target);
        // 获取验证码记录
        const record = await cache_1.cache.get(cacheKey);
        // 获取每日发送计数
        const dailyCount = await cache_1.cache.get(dailyCountKey) || 0;
        const dailyRemaining = Math.max(0, config.dailyLimit - dailyCount);
        if (!record) {
            return {
                exists: false,
                canSend: dailyRemaining > 0,
                dailyRemaining
            };
        }
        // 检查是否可以发送新验证码
        const timeSinceLastSend = Date.now() - record.lastSendTime;
        const canSend = timeSinceLastSend >= config.sendInterval * 1000 && dailyRemaining > 0;
        const nextSendTime = canSend ? undefined : record.lastSendTime + config.sendInterval * 1000;
        // 剩余尝试次数
        const remainingAttempts = Math.max(0, config.maxAttempts - record.attempts);
        return {
            exists: true,
            canSend,
            nextSendTime,
            remainingAttempts,
            dailyRemaining
        };
    }
    catch (error) {
        logger_1.winstonLogger.error('获取验证码状态异常', {
            type,
            target,
            scene,
            error: error.message
        });
        return {
            exists: false,
            canSend: false
        };
    }
}
/**
 * 批量清理过期验证码（定时任务使用）
 */
async function cleanupExpiredCodes() {
    try {
        // 清理邮箱验证码
        await cache_1.cache.delPattern(`${cache_1.CACHE_KEYS.EMAIL_CODE}*`);
        // 清理短信验证码
        await cache_1.cache.delPattern(`${cache_1.CACHE_KEYS.SMS_CODE}*`);
        logger_1.winstonLogger.info('过期验证码清理完成');
    }
    catch (error) {
        logger_1.winstonLogger.error('清理过期验证码异常', { error: error.message });
    }
}
// 内存存储验证码（生产环境建议使用Redis）
const verificationCodes = new Map();
// 手机号发送频率限制（每个手机号每分钟最多发送1次）
const sendRateLimit = new Map();
/**
 * 验证码管理服务类
 * 提供验证码生成、发送、验证等功能
 */
class VerificationCodeService {
    constructor() {
        this.smsService = new smsService_1.SmsService();
    }
    /**
     * 生成6位数字验证码
     * @returns 验证码字符串
     */
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    /**
     * 验证手机号格式
     * @param phone 手机号
     * @returns 是否有效
     */
    isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    /**
     * 检查发送频率限制
     * @param phone 手机号
     * @returns 是否可以发送
     */
    canSendCode(phone) {
        const lastSent = sendRateLimit.get(phone);
        if (!lastSent)
            return true;
        const now = new Date();
        const timeDiff = now.getTime() - lastSent.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        return minutesDiff >= VerificationCodeService.RATE_LIMIT_MINUTES;
    }
    /**
     * 发送验证码
     * @param phone 手机号
     * @returns 发送结果
     */
    async sendVerificationCode(phone) {
        try {
            // 验证手机号格式
            if (!this.isValidPhone(phone)) {
                return {
                    success: false,
                    message: '手机号格式不正确'
                };
            }
            // 检查发送频率限制
            if (!this.canSendCode(phone)) {
                return {
                    success: false,
                    message: '发送过于频繁，请稍后再试'
                };
            }
            // 生成验证码
            const code = this.generateCode();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + VerificationCodeService.CODE_EXPIRY_MINUTES * 60 * 1000);
            // 存储验证码
            verificationCodes.set(phone, {
                phone,
                code,
                expiresAt,
                attempts: 0,
                createdAt: now
            });
            // 记录发送时间
            sendRateLimit.set(phone, now);
            // 发送短信
            await this.smsService.sendVerificationCode(phone, code);
            // 在开发环境下，返回验证码用于测试
            const responseData = {
                expiresAt: expiresAt
            };
            if (process.env.NODE_ENV === 'development') {
                responseData.code = code; // 仅在开发环境返回验证码
                console.log(`[开发模式] 手机号 ${phone} 的验证码: ${code}`);
            }
            return {
                success: true,
                message: '验证码发送成功',
                data: responseData
            };
        }
        catch (error) {
            console.error('发送验证码失败:', error);
            return {
                success: false,
                message: '验证码发送失败，请稍后重试'
            };
        }
    }
    /**
     * 验证验证码
     * @param phone 手机号
     * @param code 验证码
     * @returns 验证结果
     */
    async verifyCode(phone, code) {
        try {
            const storedCode = verificationCodes.get(phone);
            if (!storedCode) {
                return {
                    success: false,
                    message: '验证码不存在或已过期'
                };
            }
            // 检查验证码是否过期
            if (new Date() > storedCode.expiresAt) {
                verificationCodes.delete(phone);
                return {
                    success: false,
                    message: '验证码已过期'
                };
            }
            // 检查尝试次数
            if (storedCode.attempts >= VerificationCodeService.MAX_ATTEMPTS) {
                verificationCodes.delete(phone);
                return {
                    success: false,
                    message: '验证次数过多，请重新获取验证码'
                };
            }
            // 验证码错误
            if (storedCode.code !== code) {
                storedCode.attempts++;
                return {
                    success: false,
                    message: `验证码错误，还可尝试 ${VerificationCodeService.MAX_ATTEMPTS - storedCode.attempts} 次`
                };
            }
            // 验证成功，删除验证码
            verificationCodes.delete(phone);
            return {
                success: true,
                message: '验证码验证成功'
            };
        }
        catch (error) {
            console.error('验证码验证失败:', error);
            return {
                success: false,
                message: '验证码验证失败，请稍后重试'
            };
        }
    }
    /**
     * 清理过期的验证码（定时任务）
     */
    cleanupExpiredCodes() {
        const now = new Date();
        for (const [phone, codeData] of verificationCodes.entries()) {
            if (now > codeData.expiresAt) {
                verificationCodes.delete(phone);
            }
        }
        // 清理过期的发送频率限制记录
        for (const [phone, lastSent] of sendRateLimit.entries()) {
            const timeDiff = now.getTime() - lastSent.getTime();
            const minutesDiff = timeDiff / (1000 * 60);
            if (minutesDiff > 60) { // 清理1小时前的记录
                sendRateLimit.delete(phone);
            }
        }
    }
    /**
     * 获取验证码统计信息（用于监控）
     */
    getStats() {
        const now = new Date();
        let activeCodes = 0;
        for (const codeData of verificationCodes.values()) {
            if (now <= codeData.expiresAt) {
                activeCodes++;
            }
        }
        return {
            totalCodes: verificationCodes.size,
            activeCodes,
            rateLimitedPhones: sendRateLimit.size
        };
    }
    /**
     * 检查手机号是否在频率限制中
     * @param phone 手机号
     * @returns 剩余等待时间（秒）
     */
    getRemainingWaitTime(phone) {
        const lastSent = sendRateLimit.get(phone);
        if (!lastSent)
            return 0;
        const now = new Date();
        const timeDiff = now.getTime() - lastSent.getTime();
        const secondsDiff = timeDiff / 1000;
        const waitTime = VerificationCodeService.RATE_LIMIT_MINUTES * 60 - secondsDiff;
        return Math.max(0, Math.ceil(waitTime));
    }
}
exports.VerificationCodeService = VerificationCodeService;
VerificationCodeService.CODE_LENGTH = 6; // 验证码长度
VerificationCodeService.CODE_EXPIRY_MINUTES = 5; // 验证码有效期（分钟）
VerificationCodeService.MAX_ATTEMPTS = 3; // 最大验证尝试次数
VerificationCodeService.RATE_LIMIT_MINUTES = 1; // 发送频率限制（分钟）
// 创建单例实例
exports.verificationCodeService = new VerificationCodeService();
// 定时清理过期验证码（每5分钟执行一次）
setInterval(() => {
    exports.verificationCodeService.cleanupExpiredCodes();
}, 5 * 60 * 1000);
exports.default = exports.verificationCodeService;
//# sourceMappingURL=verificationCodeService.js.map