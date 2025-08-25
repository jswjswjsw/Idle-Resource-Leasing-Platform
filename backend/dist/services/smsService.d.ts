/**
 * 短信服务配置
 * 支持阿里云短信服务（提供免费额度）
 * 也支持其他免费短信服务作为备选
 */
export interface SmsTemplate {
    code: string;
    content: string;
}
export interface SmsOptions {
    phone: string;
    template: string;
    params?: Record<string, string>;
}
/**
 * 发送短信
 */
export declare function sendSms(options: SmsOptions): Promise<boolean>;
/**
 * 发送验证码短信
 */
export declare function sendVerificationSms(phone: string, code: string, expireMinutes?: number): Promise<boolean>;
/**
 * 发送密码重置短信
 */
export declare function sendPasswordResetSms(phone: string, code: string, expireMinutes?: number): Promise<boolean>;
/**
 * 发送登录通知短信
 */
export declare function sendLoginNotificationSms(phone: string): Promise<boolean>;
/**
 * 发送订单通知短信
 */
export declare function sendOrderNotificationSms(phone: string, orderNumber: string, action: string): Promise<boolean>;
/**
 * 短信服务状态检查
 */
export declare function getSmsServiceStatus(): {
    available: boolean;
    configured: boolean;
    type: string;
};
//# sourceMappingURL=smsService.d.ts.map