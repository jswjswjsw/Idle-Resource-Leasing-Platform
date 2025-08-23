/**
 * 验证码类型枚举
 */
export declare enum VerificationCodeType {
    EMAIL_REGISTER = "email_register",
    EMAIL_LOGIN = "email_login",
    EMAIL_RESET_PASSWORD = "email_reset_password",
    PHONE_REGISTER = "phone_register",
    PHONE_LOGIN = "phone_login",
    PHONE_BIND = "phone_bind"
}
/**
 * 验证码服务类
 * 负责验证码的生成、发送、验证和管理
 */
export declare class VerificationService {
    private readonly CODE_LENGTH;
    private readonly CODE_EXPIRE_TIME;
    private readonly MAX_SEND_COUNT;
    private readonly SEND_INTERVAL;
    /**
     * 生成数字验证码
     * @param length 验证码长度
     */
    private generateCode;
    /**
     * 生成重置token
     */
    private generateResetToken;
    /**
     * 获取验证码缓存键
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    private getCodeCacheKey;
    /**
     * 获取发送次数缓存键
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    private getSendCountCacheKey;
    /**
     * 获取最后发送时间缓存键
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    private getLastSendTimeCacheKey;
    /**
     * 检查发送限制
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    private checkSendLimits;
    /**
     * 更新发送记录
     * @param type 验证码类型
     * @param target 目标（邮箱或手机号）
     */
    private updateSendRecord;
    /**
     * 发送邮箱验证码
     * @param email 邮箱地址
     * @param type 验证码类型
     */
    sendEmailVerificationCode(email: string, type: VerificationCodeType): Promise<void>;
    /**
     * 发送手机验证码
     * @param phone 手机号
     * @param type 验证码类型
     */
    sendSmsVerificationCode(phone: string, type: VerificationCodeType): Promise<void>;
    /**
     * 验证验证码
     * @param target 目标（邮箱或手机号）
     * @param code 验证码
     * @param type 验证码类型
     */
    verifyCode(target: string, code: string, type: VerificationCodeType): Promise<boolean>;
    /**
     * 生成密码重置token
     * @param email 邮箱地址
     */
    generatePasswordResetToken(email: string): Promise<string>;
    /**
     * 验证密码重置token
     * @param email 邮箱地址
     * @param token 重置token
     */
    verifyPasswordResetToken(email: string, token: string): Promise<boolean>;
    /**
     * 清理过期的验证码和发送记录
     */
    cleanupExpiredCodes(): Promise<void>;
    /**
     * 获取验证码剩余有效时间
     * @param target 目标（邮箱或手机号）
     * @param type 验证码类型
     */
    getCodeRemainingTime(target: string, type: VerificationCodeType): Promise<number>;
    /**
     * 获取发送限制信息
     * @param target 目标（邮箱或手机号）
     * @param type 验证码类型
     */
    getSendLimitInfo(target: string, type: VerificationCodeType): Promise<{
        remainingSendCount: number;
        nextSendTime: number;
    }>;
}
export declare const verificationService: VerificationService;
//# sourceMappingURL=verificationService.d.ts.map