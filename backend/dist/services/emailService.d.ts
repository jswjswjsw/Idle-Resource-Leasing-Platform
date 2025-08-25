/**
 * 邮件服务配置
 * 支持多个免费邮件服务提供商
 */
export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    data?: Record<string, any>;
}
/**
 * 发送邮件
 */
export declare function sendEmail(options: EmailOptions): Promise<boolean>;
/**
 * 发送验证码邮件
 */
export declare function sendVerificationEmail(email: string, username: string, code: string, expireMinutes?: number): Promise<boolean>;
/**
 * 发送密码重置邮件
 */
export declare function sendPasswordResetEmail(email: string, username: string, resetUrl: string, expireMinutes?: number): Promise<boolean>;
/**
 * 发送登录通知邮件
 */
export declare function sendLoginNotificationEmail(email: string, username: string, loginTime: string, ip: string, location?: string): Promise<boolean>;
/**
 * 发送订单通知邮件
 */
export declare function sendOrderNotificationEmail(email: string, username: string, orderNumber: string, resourceTitle: string, totalAmount: number, action: string): Promise<boolean>;
/**
 * 邮件服务状态检查
 */
export declare function getEmailServiceStatus(): {
    available: boolean;
    configured: boolean;
};
/**
 * 邮件服务类
 * 负责处理所有邮件发送相关的功能
 */
export declare class EmailService {
    private transporter;
    constructor();
    /**
     * 发送邮箱验证码
     * @param email 目标邮箱
     * @param code 验证码
     */
    sendVerificationCode(email: string, code: string): Promise<void>;
    /**
     * 发送密码重置邮件
     * @param email 目标邮箱
     * @param resetToken 重置token
     */
    sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
    /**
     * 发送订单通知邮件
     * @param email 目标邮箱
     * @param orderInfo 订单信息
     */
    sendOrderNotification(email: string, orderInfo: any): Promise<void>;
    /**
     * 发送欢迎邮件
     * @param email 目标邮箱
     * @param username 用户名
     */
    sendWelcomeEmail(email: string, username: string): Promise<void>;
    /**
     * 验证邮件服务配置
     */
    verifyConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map