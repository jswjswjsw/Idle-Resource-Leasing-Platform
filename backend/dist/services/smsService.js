"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = exports.SmsService = void 0;
const errorHandler_1 = require("..//utils/errorHandler");
/**
 * 短信服务类
 * 负责处理所有短信发送相关的功能
 * 支持阿里云短信服务和腾讯云短信服务
 */
class SmsService {
    constructor() {
        // 从环境变量获取配置
        this.provider = process.env.SMS_PROVIDER || 'aliyun'; // aliyun 或 tencent
        this.accessKeyId = process.env.SMS_ACCESS_KEY_ID || '';
        this.accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET || '';
        this.signName = process.env.SMS_SIGN_NAME || '闲置资源租赁平台';
        this.templateCode = process.env.SMS_TEMPLATE_CODE || 'SMS_123456789';
    }
    /**
     * 发送短信验证码
     * @param phone 手机号
     * @param code 验证码
     */
    async sendVerificationCode(phone, code) {
        try {
            if (this.provider === 'aliyun') {
                await this.sendAliyunSms(phone, code);
            }
            else if (this.provider === 'tencent') {
                await this.sendTencentSms(phone, code);
            }
            else {
                // 开发环境模拟发送
                await this.mockSendSms(phone, code);
            }
            console.log(`短信验证码已发送到: ${phone}`);
        }
        catch (error) {
            console.error('短信发送失败:', error);
            throw new errorHandler_1.AppError('短信发送失败', 500);
        }
    }
    /**
     * 使用阿里云发送短信
     * @param phone 手机号
     * @param code 验证码
     */
    async sendAliyunSms(phone, code) {
        // 这里需要安装阿里云SDK: npm install @alicloud/dysmsapi20170525
        // 由于这是示例代码，我们使用模拟实现
        if (!this.accessKeyId || !this.accessKeySecret) {
            throw new Error('阿里云短信服务配置不完整');
        }
        // 模拟阿里云短信发送
        const params = {
            PhoneNumbers: phone,
            SignName: this.signName,
            TemplateCode: this.templateCode,
            TemplateParam: JSON.stringify({ code })
        };
        console.log('阿里云短信发送参数:', params);
        // 实际项目中这里应该调用阿里云SDK
        /*
        const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525');
        const OpenApi = require('@alicloud/openapi-client');
        
        const config = new OpenApi.Config({
          accessKeyId: this.accessKeyId,
          accessKeySecret: this.accessKeySecret,
          endpoint: 'dysmsapi.aliyuncs.com'
        });
        
        const client = new Dysmsapi20170525(config);
        const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest(params);
        
        const response = await client.sendSms(sendSmsRequest);
        
        if (response.body.code !== 'OK') {
          throw new Error(`短信发送失败: ${response.body.message}`);
        }
        */
    }
    /**
     * 使用腾讯云发送短信
     * @param phone 手机号
     * @param code 验证码
     */
    async sendTencentSms(phone, code) {
        // 这里需要安装腾讯云SDK: npm install tencentcloud-sdk-nodejs
        // 由于这是示例代码，我们使用模拟实现
        if (!this.accessKeyId || !this.accessKeySecret) {
            throw new Error('腾讯云短信服务配置不完整');
        }
        // 模拟腾讯云短信发送
        const params = {
            PhoneNumberSet: [phone],
            SignName: this.signName,
            TemplateId: this.templateCode,
            TemplateParamSet: [code]
        };
        console.log('腾讯云短信发送参数:', params);
        // 实际项目中这里应该调用腾讯云SDK
        /*
        const tencentcloud = require('tencentcloud-sdk-nodejs');
        const SmsClient = tencentcloud.sms.v20210111.Client;
        
        const clientConfig = {
          credential: {
            secretId: this.accessKeyId,
            secretKey: this.accessKeySecret,
          },
          region: 'ap-beijing',
          profile: {
            httpProfile: {
              endpoint: 'sms.tencentcloudapi.com',
            },
          },
        };
        
        const client = new SmsClient(clientConfig);
        const response = await client.SendSms(params);
        
        if (response.SendStatusSet[0].Code !== 'Ok') {
          throw new Error(`短信发送失败: ${response.SendStatusSet[0].Message}`);
        }
        */
    }
    /**
     * 模拟发送短信（开发环境使用）
     * @param phone 手机号
     * @param code 验证码
     */
    async mockSendSms(phone, code) {
        console.log(`[模拟短信] 发送到 ${phone}: 您的验证码是 ${code}，有效期5分钟。`);
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 在开发环境中，我们可以将验证码写入日志文件或控制台
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n=== 开发环境短信验证码 ===`);
            console.log(`手机号: ${phone}`);
            console.log(`验证码: ${code}`);
            console.log(`时间: ${new Date().toLocaleString()}`);
            console.log(`========================\n`);
        }
    }
    /**
     * 验证手机号格式
     * @param phone 手机号
     */
    validatePhoneNumber(phone) {
        // 中国大陆手机号正则表达式
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    /**
     * 发送订单状态通知短信
     * @param phone 手机号
     * @param orderInfo 订单信息
     */
    async sendOrderNotification(phone, orderInfo) {
        try {
            const message = `您的订单${orderInfo.id}状态已更新为${orderInfo.status}，请及时查看。`;
            if (process.env.NODE_ENV === 'development') {
                console.log(`[模拟短信通知] 发送到 ${phone}: ${message}`);
            }
            else {
                // 实际环境中发送短信
                if (this.provider === 'aliyun') {
                    // 调用阿里云短信API
                }
                else if (this.provider === 'tencent') {
                    // 调用腾讯云短信API
                }
            }
            console.log(`订单通知短信已发送到: ${phone}`);
        }
        catch (error) {
            console.error('订单通知短信发送失败:', error);
            // 订单通知短信发送失败不应该影响主要业务流程
            console.warn('订单通知短信发送失败，但不影响订单处理');
        }
    }
    /**
     * 检查短信服务配置
     */
    checkConfiguration() {
        if (process.env.NODE_ENV === 'development') {
            return true; // 开发环境使用模拟发送
        }
        if (!this.accessKeyId || !this.accessKeySecret) {
            console.error('短信服务配置不完整: 缺少访问密钥');
            return false;
        }
        if (!this.signName || !this.templateCode) {
            console.error('短信服务配置不完整: 缺少签名或模板');
            return false;
        }
        return true;
    }
    /**
     * 获取短信发送限制信息
     */
    getSendLimits() {
        return {
            dailyLimit: 10, // 每天最多发送10条
            hourlyLimit: 5, // 每小时最多发送5条
            intervalLimit: 60 // 发送间隔60秒
        };
    }
}
exports.SmsService = SmsService;
// 导出短信服务实例
exports.smsService = new SmsService();
//# sourceMappingURL=smsService.js.map