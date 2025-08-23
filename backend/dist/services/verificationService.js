"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationService = exports.VerificationService = exports.VerificationCodeType = void 0;
const cache_1 = require("..//config/cache");
const errorHandler_1 = require("..//utils/errorHandler");
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
const crypto_1 = __importDefault(require("crypto"));
/**
 * 验证码类型枚举
 */
var VerificationCodeType;
(function (VerificationCodeType) {
    VerificationCodeType["EMAIL_REGISTER"] = "email_register";
    VerificationCodeType["EMAIL_LOGIN"] = "email_login";
    VerificationCodeType["EMAIL_RESET_PASSWORD"] = "email_reset_password";
    VerificationCodeType["PHONE_REGISTER"] = "phone_register";
    VerificationCodeType["PHONE_LOGIN"] = "phone_login";
    VerificationCodeType["PHONE_BIND"] = "phone_bind";
})(VerificationCodeType || (exports.VerificationCodeType = VerificationCodeType = {}));
/**
 * 验证码服务类
 * 负责验证码的生成、发送、验证和管理
 */
class VerificationService {
    constructor() {
        this.CODE_LENGTH = 6; // 验证码长度
        this.CODE_EXPIRE_TIME = 300; // 验证码过期时间（秒）
        this.MAX_SEND_COUNT = 5; // 每小时最大发送次数
        this.SEND_INTERVAL = 60; // 发送间隔（秒）
    }
    /**
     * 生成数字验证码
     * @param length 验证码长度
     */
    generateCode(length = this.CODE_LENGTH) {
        let code = '';
        for (let i = 0; i < length; i++) {
            code += Math.floor(Math.random() * 10).toString();
        }
        return code;
    }
    /**
     * 生成重置token
     */
    generateResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    /**
     * 获取验证码缓存键
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    getCodeCacheKey(type, target) {
        return `${cache_1.CACHE_KEYS.VERIFICATION_CODE}${type}:${target}`;
    }
    /**
     * 获取发送次数缓存键
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    getSendCountCacheKey(type, target) {
        return `${cache_1.CACHE_KEYS.VERIFICATION_SEND_COUNT}${type}:${target}`;
    }
    /**
     * 获取最后发送时间缓存键
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    getLastSendTimeCacheKey(type, target) {
        return `${cache_1.CACHE_KEYS.VERIFICATION_LAST_SEND}${type}:${target}`;
    }
    /**
     * 检查发送限制
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    async checkSendLimits(type, target) {
        const sendCountKey = this.getSendCountCacheKey(type, target);
        const lastSendTimeKey = this.getLastSendTimeCacheKey(type, target);
        // 检查发送间隔
        const lastSendTime = await cache_1.cache.get(lastSendTimeKey);
        if (lastSendTime) {
            const timeDiff = Date.now() - parseInt(lastSendTime);
            if (timeDiff < this.SEND_INTERVAL * 1000) {
                const remainingTime = Math.ceil((this.SEND_INTERVAL * 1000 - timeDiff) / 1000);
                throw new errorHandler_1.AppError(`请等待${remainingTime}秒后再试`, 429);
            }
        }
        // 检查每小时发送次数
        const sendCount = await cache_1.cache.get(sendCountKey);
        if (sendCount && parseInt(sendCount) >= this.MAX_SEND_COUNT) {
            throw new errorHandler_1.AppError('发送次数过多，请1小时后再试', 429);
        }
    }
    /**
     * 更新发送记录
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    async updateSendRecord(type, target) {
        const sendCountKey = this.getSendCountCacheKey(type, target);
        const lastSendTimeKey = this.getLastSendTimeCacheKey(type, target);
        // 更新发送次数
        const currentCount = await cache_1.cache.get(sendCountKey);
        const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
        await cache_1.cache.set(sendCountKey, newCount.toString(), 3600); // 1小时过期
        // 更新最后发送时间
        await cache_1.cache.set(lastSendTimeKey, Date.now().toString(), this.SEND_INTERVAL);
    }
    /**
     * 发送邮箱验证码
     * @param email 邮箱地址
     * @param type 验证码类型
     */
    async sendEmailVerificationCode(email, type) {
        // 检查发送限制
        await this.checkSendLimits(type, email);
        // 生成验证码
        const code = this.generateCode();
        const cacheKey = this.getCodeCacheKey(type, email);
        // 存储验证码到缓存
        await cache_1.cache.set(cacheKey, code, this.CODE_EXPIRE_TIME);
        // 发送邮件
        await emailService_1.emailService.sendVerificationCode(email, code);
        // 更新发送记录
        await this.updateSendRecord(type, email);
        console.log(`邮箱验证码已发送: ${email}, 类型: ${type}`);
    }
    /**
     * 发送手机验证码
     * @param phone 手机号
     * @param type 验证码类型
     */
    async sendSmsVerificationCode(phone, type) {
        // 验证手机号格式
        if (!smsService_1.smsService.validatePhoneNumber(phone)) {
            throw new errorHandler_1.AppError('手机号格式不正确', 400);
        }
        // 检查发送限制
        await this.checkSendLimits(type, phone);
        // 生成验证码
        const code = this.generateCode();
        const cacheKey = this.getCodeCacheKey(type, phone);
        // 存储验证码到缓存
        await cache_1.cache.set(cacheKey, code, this.CODE_EXPIRE_TIME);
        // 发送短信
        await smsService_1.smsService.sendVerificationCode(phone, code);
        // 更新发送记录
        await this.updateSendRecord(type, phone);
        console.log(`手机验证码已发送: ${phone}, 类型: ${type}`);
    }
    /**
     * 验证验证码
     * @param target 目标（邮箱或手机号）
     * @param code 验证码
     * @param type 验证码类型
     */
    async verifyCode(target, code, type) {
        const cacheKey = this.getCodeCacheKey(type, target);
        const storedCode = await cache_1.cache.get(cacheKey);
        if (!storedCode) {
            throw new errorHandler_1.AppError('验证码已过期或不存在', 400);
        }
        if (storedCode !== code) {
            throw new errorHandler_1.AppError('验证码错误', 400);
        }
        // 验证成功后删除验证码
        await cache_1.cache.del(cacheKey);
        console.log(`验证码验证成功: ${target}, 类型: ${type}`);
        return true;
    }
    /**
     * 生成密码重置token
     * @param email 邮箱地址
     */
    async generatePasswordResetToken(email) {
        // 检查发送限制
        await this.checkSendLimits(VerificationCodeType.EMAIL_RESET_PASSWORD, email);
        // 生成重置token
        const resetToken = this.generateResetToken();
        const cacheKey = `${cache_1.CACHE_KEYS.PASSWORD_RESET_TOKEN}${email}`;
        // 存储token到缓存（1小时过期）
        await cache_1.cache.set(cacheKey, resetToken, 3600);
        // 发送重置邮件
        await emailService_1.emailService.sendPasswordResetEmail(email, resetToken);
        // 更新发送记录
        await this.updateSendRecord(VerificationCodeType.EMAIL_RESET_PASSWORD, email);
        console.log(`密码重置邮件已发送: ${email}`);
        return resetToken;
    }
    /**
     * 验证密码重置token
     * @param email 邮箱地址
     * @param token 重置token
     */
    async verifyPasswordResetToken(email, token) {
        const cacheKey = `${cache_1.CACHE_KEYS.PASSWORD_RESET_TOKEN}${email}`;
        const storedToken = await cache_1.cache.get(cacheKey);
        if (!storedToken) {
            throw new errorHandler_1.AppError('重置链接已过期或不存在', 400);
        }
        if (storedToken !== token) {
            throw new errorHandler_1.AppError('重置链接无效', 400);
        }
        // 验证成功后删除token
        await cache_1.cache.del(cacheKey);
        console.log(`密码重置token验证成功: ${email}`);
        return true;
    }
    /**
     * 清理过期的验证码和发送记录
     */
    async cleanupExpiredCodes() {
        try {
            // Redis会自动清理过期的键，这里可以添加额外的清理逻辑
            console.log('验证码清理任务执行完成');
        }
        catch (error) {
            console.error('验证码清理任务失败:', error);
        }
    }
    /**
     * 获取验证码剩余有效时间
     * @param target 目标（邮箱或手机号）
     * @param type 验证码类型
     */
    async getCodeRemainingTime(target, type) {
        const cacheKey = this.getCodeCacheKey(type, target);
        const ttl = await cache_1.cache.ttl(cacheKey);
        return Math.max(0, ttl);
    }
    /**
     * 获取发送限制信息
     * @param target 目标（邮箱或手机号）
     * @param type 验证码类型
     */
    async getSendLimitInfo(target, type) {
        const sendCountKey = this.getSendCountCacheKey(type, target);
        const lastSendTimeKey = this.getLastSendTimeCacheKey(type, target);
        const sendCount = await cache_1.cache.get(sendCountKey);
        const lastSendTime = await cache_1.cache.get(lastSendTimeKey);
        const currentSendCount = sendCount ? parseInt(sendCount) : 0;
        const remainingSendCount = Math.max(0, this.MAX_SEND_COUNT - currentSendCount);
        let nextSendTime = 0;
        if (lastSendTime) {
            const timeDiff = Date.now() - parseInt(lastSendTime);
            if (timeDiff < this.SEND_INTERVAL * 1000) {
                nextSendTime = Math.ceil((this.SEND_INTERVAL * 1000 - timeDiff) / 1000);
            }
        }
        return {
            remainingSendCount,
            nextSendTime
        };
    }
}
exports.VerificationService = VerificationService;
// 导出验证码服务实例
exports.verificationService = new VerificationService();
//# sourceMappingURL=verificationService.js.map