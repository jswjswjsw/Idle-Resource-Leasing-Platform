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