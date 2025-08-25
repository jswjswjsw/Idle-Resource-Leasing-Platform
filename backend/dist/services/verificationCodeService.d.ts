/**
 * 验证码类型
 */
export type VerificationType = 'email' | 'sms';
/**
 * 验证码场景
 */
export type VerificationScene = 'register' | 'login' | 'reset_password' | 'change_phone' | 'change_email';
/**
 * 发送邮箱验证码
 */
export declare function sendEmailVerification(email: string, username: string, scene?: VerificationScene): Promise<{
    success: boolean;
    message: string;
    nextSendTime?: number;
}>;
/**
 * 发送短信验证码
 */
export declare function sendSmsVerification(phone: string, scene?: VerificationScene): Promise<{
    success: boolean;
    message: string;
    nextSendTime?: number;
}>;
/**
 * 验证验证码
 */
export declare function verifyCode(type: VerificationType, target: string, code: string, scene: VerificationScene): Promise<{
    success: boolean;
    message: string;
    remainingAttempts?: number;
}>;
/**
 * 清除验证码
 */
export declare function clearVerificationCode(type: VerificationType, target: string, scene: VerificationScene): Promise<void>;
/**
 * 获取验证码状态
 */
export declare function getVerificationStatus(type: VerificationType, target: string, scene: VerificationScene): Promise<{
    exists: boolean;
    canSend: boolean;
    nextSendTime?: number;
    remainingAttempts?: number;
    dailyRemaining?: number;
}>;
/**
 * 批量清理过期验证码（定时任务使用）
 */
export declare function cleanupExpiredCodes(): Promise<void>;
/**
 * 验证码管理服务类
 * 提供验证码生成、发送、验证等功能
 */
export declare class VerificationCodeService {
    private static readonly CODE_LENGTH;
    private static readonly CODE_EXPIRY_MINUTES;
    private static readonly MAX_ATTEMPTS;
    private static readonly RATE_LIMIT_MINUTES;
    private smsService;
    constructor();
    /**
     * 生成6位数字验证码
     * @returns 验证码字符串
     */
    private generateCode;
    /**
     * 验证手机号格式
     * @param phone 手机号
     * @returns 是否有效
     */
    private isValidPhone;
    /**
     * 检查发送频率限制
     * @param phone 手机号
     * @returns 是否可以发送
     */
    private canSendCode;
    /**
     * 发送验证码
     * @param phone 手机号
     * @returns 发送结果
     */
    sendVerificationCode(phone: string): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }>;
    /**
     * 验证验证码
     * @param phone 手机号
     * @param code 验证码
     * @returns 验证结果
     */
    verifyCode(phone: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 清理过期的验证码（定时任务）
     */
    cleanupExpiredCodes(): void;
    /**
     * 获取验证码统计信息（用于监控）
     */
    getStats(): {
        totalCodes: number;
        activeCodes: number;
        rateLimitedPhones: number;
    };
    /**
     * 检查手机号是否在频率限制中
     * @param phone 手机号
     * @returns 剩余等待时间（秒）
     */
    getRemainingWaitTime(phone: string): number;
}
export declare const verificationCodeService: VerificationCodeService;
export default verificationCodeService;
//# sourceMappingURL=verificationCodeService.d.ts.map