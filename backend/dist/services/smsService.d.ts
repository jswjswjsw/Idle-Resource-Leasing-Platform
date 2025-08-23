/**
 * 短信服务类
 * 负责处理所有短信发送相关的功能
 * 支持阿里云短信服务和腾讯云短信服务
 */
export declare class SmsService {
    private provider;
    private accessKeyId;
    private accessKeySecret;
    private signName;
    private templateCode;
    constructor();
    /**
     * 发送短信验证码
     * @param phone 手机号
     * @param code 验证码
     */
    sendVerificationCode(phone: string, code: string): Promise<void>;
    /**
     * 使用阿里云发送短信
     * @param phone 手机号
     * @param code 验证码
     */
    private sendAliyunSms;
    /**
     * 使用腾讯云发送短信
     * @param phone 手机号
     * @param code 验证码
     */
    private sendTencentSms;
    /**
     * 模拟发送短信（开发环境使用）
     * @param phone 手机号
     * @param code 验证码
     */
    private mockSendSms;
    /**
     * 验证手机号格式
     * @param phone 手机号
     */
    validatePhoneNumber(phone: string): boolean;
    /**
     * 发送订单状态通知短信
     * @param phone 手机号
     * @param orderInfo 订单信息
     */
    sendOrderNotification(phone: string, orderInfo: any): Promise<void>;
    /**
     * 检查短信服务配置
     */
    checkConfiguration(): boolean;
    /**
     * 获取短信发送限制信息
     */
    getSendLimits(): {
        dailyLimit: number;
        hourlyLimit: number;
        intervalLimit: number;
    };
}
export declare const smsService: SmsService;
//# sourceMappingURL=smsService.d.ts.map