"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = sendSms;
exports.sendVerificationSms = sendVerificationSms;
exports.sendPasswordResetSms = sendPasswordResetSms;
exports.sendLoginNotificationSms = sendLoginNotificationSms;
exports.sendOrderNotificationSms = sendOrderNotificationSms;
exports.getSmsServiceStatus = getSmsServiceStatus;
const AppError_1 = require("@/utils/AppError");
const logger_1 = require("@/middleware/logger");
// 预定义短信模板
const SMS_TEMPLATES = {
    // 验证码模板
    verification: {
        code: 'SMS_VERIFICATION',
        content: '您的验证码是：${code}，${expireMinutes}分钟内有效，请勿泄露。【交易平台】'
    },
    // 登录通知模板
    loginNotification: {
        code: 'SMS_LOGIN_NOTIFY',
        content: '您的账户已登录，如非本人操作请及时修改密码。【交易平台】'
    },
    // 订单通知模板
    orderNotification: {
        code: 'SMS_ORDER_NOTIFY',
        content: '您的订单${orderNumber}已${action}，请及时查看。【交易平台】'
    },
    // 密码重置模板
    passwordReset: {
        code: 'SMS_PASSWORD_RESET',
        content: '您正在重置密码，验证码：${code}，${expireMinutes}分钟内有效。【交易平台】'
    }
};
/**
 * 阿里云短信服务类
 */
class AliyunSmsService {
    constructor() {
        this.accessKeyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID || '';
        this.accessKeySecret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '';
        this.signName = process.env.ALIYUN_SMS_SIGN_NAME || '交易平台';
        this.endpoint = 'https://dysmsapi.aliyuncs.com';
    }
    /**
     * 检查服务是否已配置
     */
    isConfigured() {
        return !!(this.accessKeyId && this.accessKeySecret);
    }
    /**
     * 生成签名
     */
    generateSignature(params, method = 'POST') {
        // 这里简化处理，实际生产环境建议使用阿里云官方SDK
        // 或者参考阿里云API文档实现完整的签名算法
        const crypto = require('crypto');
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        const stringToSign = `${method}&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`;
        const signature = crypto
            .createHmac('sha1', this.accessKeySecret + '&')
            .update(stringToSign)
            .digest('base64');
        return signature;
    }
    /**
     * 发送短信
     */
    async sendSms(phone, templateCode, templateParams) {
        try {
            if (!this.isConfigured()) {
                logger_1.winstonLogger.warn('阿里云短信服务未配置');
                return false;
            }
            // 构建请求参数
            const params = {
                'Action': 'SendSms',
                'Version': '2017-05-25',
                'RegionId': 'cn-hangzhou',
                'PhoneNumbers': phone,
                'SignName': this.signName,
                'TemplateCode': templateCode,
                'TemplateParam': JSON.stringify(templateParams),
                'AccessKeyId': this.accessKeyId,
                'SignatureMethod': 'HMAC-SHA1',
                'Timestamp': new Date().toISOString(),
                'SignatureVersion': '1.0',
                'SignatureNonce': Math.random().toString(36).substring(2),
                'Format': 'JSON'
            };
            // 生成签名
            params['Signature'] = this.generateSignature(params);
            // 发送HTTP请求
            const axios = require('axios');
            const response = await axios.post(this.endpoint, null, {
                params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000
            });
            if (response.data.Code === 'OK') {
                logger_1.winstonLogger.info('短信发送成功', {
                    phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                    templateCode,
                    requestId: response.data.RequestId
                });
                return true;
            }
            else {
                logger_1.winstonLogger.error('短信发送失败', {
                    phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                    error: response.data.Message,
                    code: response.data.Code
                });
                return false;
            }
        }
        catch (error) {
            logger_1.winstonLogger.error('短信发送异常', {
                phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
                error: error.message
            });
            return false;
        }
    }
}
/**
 * 模拟短信服务（开发环境使用）
 */
class MockSmsService {
    async sendSms(phone, templateCode, templateParams) {
        // 在开发环境中，将短信内容输出到控制台
        const template = Object.values(SMS_TEMPLATES).find(t => t.code === templateCode);
        let content = template?.content || '模拟短信内容';
        // 替换模板参数
        Object.entries(templateParams).forEach(([key, value]) => {
            content = content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        });
        logger_1.winstonLogger.info('模拟短信发送', {
            phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
            templateCode,
            content,
            params: templateParams
        });
        // 在控制台显示短信内容（方便开发调试）
        console.log(`\n📱 模拟短信发送到 ${phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}:`);
        console.log(`内容: ${content}`);
        console.log('参数:', templateParams);
        console.log('---\n');
        return true;
    }
    isConfigured() {
        return true; // 模拟服务总是可用
    }
}
// 根据环境选择短信服务
const smsService = process.env.NODE_ENV === 'production'
    ? new AliyunSmsService()
    : new MockSmsService();
/**
 * 发送短信
 */
async function sendSms(options) {
    try {
        const template = SMS_TEMPLATES[options.template];
        if (!template) {
            throw AppError_1.ErrorFactory.badRequest(`未找到短信模板: ${options.template}`);
        }
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(options.phone)) {
            throw AppError_1.ErrorFactory.badRequest('手机号格式不正确');
        }
        return await smsService.sendSms(options.phone, template.code, options.params || {});
    }
    catch (error) {
        logger_1.winstonLogger.error('短信发送失败', {
            phone: options.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
            template: options.template,
            error: error.message
        });
        return false;
    }
}
/**
 * 发送验证码短信
 */
async function sendVerificationSms(phone, code, expireMinutes = 5) {
    return sendSms({
        phone,
        template: 'verification',
        params: { code, expireMinutes: expireMinutes.toString() }
    });
}
/**
 * 发送密码重置短信
 */
async function sendPasswordResetSms(phone, code, expireMinutes = 5) {
    return sendSms({
        phone,
        template: 'passwordReset',
        params: { code, expireMinutes: expireMinutes.toString() }
    });
}
/**
 * 发送登录通知短信
 */
async function sendLoginNotificationSms(phone) {
    return sendSms({
        phone,
        template: 'loginNotification',
        params: {}
    });
}
/**
 * 发送订单通知短信
 */
async function sendOrderNotificationSms(phone, orderNumber, action) {
    return sendSms({
        phone,
        template: 'orderNotification',
        params: { orderNumber, action }
    });
}
/**
 * 短信服务状态检查
 */
function getSmsServiceStatus() {
    const configured = smsService.isConfigured();
    return {
        configured,
        available: configured,
        type: process.env.NODE_ENV === 'production' ? 'aliyun' : 'mock'
    };
}
//# sourceMappingURL=smsService.js.map