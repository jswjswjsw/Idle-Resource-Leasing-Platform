"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationCodeService = exports.VerificationCodeService = void 0;
const smsService_1 = require("./smsService");
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