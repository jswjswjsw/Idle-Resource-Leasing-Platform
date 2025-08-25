"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentStatus = exports.PaymentMethod = void 0;
const AppError_1 = require("@/utils/AppError");
const logger_1 = require("@/middleware/logger");
const cache_1 = require("@/config/cache");
const crypto_1 = __importDefault(require("crypto"));
/**
 * 支付方式枚举
 */
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["ALIPAY_SANDBOX"] = "alipay_sandbox";
    PaymentMethod["WECHAT_SANDBOX"] = "wechat_sandbox";
    PaymentMethod["MOCK"] = "mock";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
/**
 * 支付状态枚举
 */
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["REFUNDING"] = "refunding";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
/**
 * 支付宝沙箱支付提供商
 */
class AlipayProvider {
    constructor() {
        this.name = '支付宝沙箱';
        this.gatewayUrl = 'https://openapi.alipaydev.com/gateway.do';
        this.appId = process.env.ALIPAY_SANDBOX_APP_ID || '';
        this.privateKey = process.env.ALIPAY_SANDBOX_PRIVATE_KEY || '';
        this.alipayPublicKey = process.env.ALIPAY_SANDBOX_PUBLIC_KEY || '';
    }
    get isConfigured() {
        return !!(this.appId && this.privateKey && this.alipayPublicKey);
    }
    async createPayment(orderInfo) {
        if (!this.isConfigured) {
            throw AppError_1.ErrorFactory.badRequest('支付宝沙箱未配置');
        }
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 构建支付宝支付参数
        const bizContent = {
            out_trade_no: paymentId,
            total_amount: (orderInfo.amount / 100).toFixed(2), // 转换为元
            subject: orderInfo.title,
            body: orderInfo.description || orderInfo.title,
            product_code: 'FAST_INSTANT_TRADE_PAY'
        };
        const params = {
            app_id: this.appId,
            method: 'alipay.trade.page.pay',
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            version: '1.0',
            return_url: orderInfo.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
            notify_url: orderInfo.notifyUrl || `${process.env.BACKEND_URL}/api/payment/notify/alipay`,
            biz_content: JSON.stringify(bizContent)
        };
        // 生成签名
        const sign = this.generateSign(params);
        params['sign'] = sign;
        // 构建支付URL
        const paymentUrl = `${this.gatewayUrl}?${this.buildQueryString(params)}`;
        // 缓存支付信息
        await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, {
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount,
            method: PaymentMethod.ALIPAY_SANDBOX,
            status: PaymentStatus.PENDING,
            createdAt: new Date()
        }, cache_1.CACHE_TTL.LONG);
        logger_1.winstonLogger.info('支付宝沙箱支付创建成功', {
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount
        });
        return {
            success: true,
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount,
            paymentUrl,
            message: '支付订单创建成功'
        };
    }
    async queryPayment(paymentId) {
        // 查询支付状态（沙箱环境简化处理）
        const cachedPayment = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        if (cachedPayment) {
            return cachedPayment.status;
        }
        return PaymentStatus.PENDING;
    }
    async refund(refundInfo) {
        const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger_1.winstonLogger.info('支付宝沙箱退款处理', {
            paymentId: refundInfo.paymentId,
            refundId,
            amount: refundInfo.refundAmount
        });
        return {
            success: true,
            refundId,
            paymentId: refundInfo.paymentId,
            refundAmount: refundInfo.refundAmount,
            message: '退款处理成功'
        };
    }
    async verifyCallback(data) {
        // 验证支付宝回调（简化处理）
        if (data.trade_status === 'TRADE_SUCCESS') {
            return {
                paymentId: data.out_trade_no,
                orderId: data.out_trade_no,
                tradeNo: data.trade_no,
                amount: Math.round(parseFloat(data.total_amount) * 100),
                status: PaymentStatus.SUCCESS,
                timestamp: new Date()
            };
        }
        return null;
    }
    generateSign(params) {
        // 简化的签名生成（实际使用中应使用完整的RSA签名）
        const sortedParams = Object.keys(params)
            .filter(key => key !== 'sign' && params[key])
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return crypto_1.default.createHash('md5').update(sortedParams + this.privateKey).digest('hex');
    }
    buildQueryString(params) {
        return Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
    }
}
/**
 * 微信支付沙箱提供商
 */
class WechatProvider {
    constructor() {
        this.name = '微信支付沙箱';
        this.appId = process.env.WECHAT_SANDBOX_APP_ID || '';
        this.mchId = process.env.WECHAT_SANDBOX_MCH_ID || '';
        this.apiKey = process.env.WECHAT_SANDBOX_API_KEY || '';
    }
    get isConfigured() {
        return !!(this.appId && this.mchId && this.apiKey);
    }
    async createPayment(orderInfo) {
        if (!this.isConfigured) {
            throw AppError_1.ErrorFactory.badRequest('微信支付沙箱未配置');
        }
        const paymentId = `wxpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 模拟微信支付二维码生成
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=weixin://wxpay/bizpayurl?pr=${paymentId}`;
        // 缓存支付信息
        await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, {
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount,
            method: PaymentMethod.WECHAT_SANDBOX,
            status: PaymentStatus.PENDING,
            createdAt: new Date()
        }, cache_1.CACHE_TTL.LONG);
        logger_1.winstonLogger.info('微信支付沙箱支付创建成功', {
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount
        });
        return {
            success: true,
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount,
            qrCode,
            message: '微信支付订单创建成功'
        };
    }
    async queryPayment(paymentId) {
        const cachedPayment = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        if (cachedPayment) {
            return cachedPayment.status;
        }
        return PaymentStatus.PENDING;
    }
    async refund(refundInfo) {
        const refundId = `wxrefund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger_1.winstonLogger.info('微信支付沙箱退款处理', {
            paymentId: refundInfo.paymentId,
            refundId,
            amount: refundInfo.refundAmount
        });
        return {
            success: true,
            refundId,
            paymentId: refundInfo.paymentId,
            refundAmount: refundInfo.refundAmount,
            message: '微信退款处理成功'
        };
    }
    async verifyCallback(data) {
        if (data.result_code === 'SUCCESS') {
            return {
                paymentId: data.out_trade_no,
                orderId: data.out_trade_no,
                tradeNo: data.transaction_id,
                amount: parseInt(data.total_fee),
                status: PaymentStatus.SUCCESS,
                timestamp: new Date()
            };
        }
        return null;
    }
}
/**
 * 模拟支付提供商（开发测试用）
 */
class MockProvider {
    get isConfigured() {
        return true; // 模拟支付始终可用
    }
    async createPayment(orderInfo) {
        const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 缓存支付信息
        await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, {
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount,
            method: PaymentMethod.MOCK,
            status: PaymentStatus.PENDING,
            createdAt: new Date()
        }, cache_1.CACHE_TTL.LONG);
        // 模拟支付URL
        const paymentUrl = `${process.env.FRONTEND_URL}/payment/mock?paymentId=${paymentId}`;
        logger_1.winstonLogger.info('模拟支付订单创建', {
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount
        });
        return {
            success: true,
            paymentId,
            orderId: orderInfo.orderId,
            amount: orderInfo.amount,
            paymentUrl,
            message: '模拟支付订单创建成功'
        };
    }
    async queryPayment(paymentId) {
        const cachedPayment = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        if (cachedPayment) {
            return cachedPayment.status;
        }
        return PaymentStatus.PENDING;
    }
    async refund(refundInfo) {
        const refundId = `mock_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger_1.winstonLogger.info('模拟退款处理', {
            paymentId: refundInfo.paymentId,
            refundId,
            amount: refundInfo.refundAmount
        });
        return {
            success: true,
            refundId,
            paymentId: refundInfo.paymentId,
            refundAmount: refundInfo.refundAmount,
            message: '模拟退款处理成功'
        };
    }
    async verifyCallback(data) {
        return {
            paymentId: data.paymentId,
            orderId: data.orderId,
            tradeNo: data.tradeNo || `mock_${Date.now()}`,
            amount: data.amount,
            status: PaymentStatus.SUCCESS,
            timestamp: new Date()
            /**
             * 支付服务类
             * 支持多种支付方式，自动选择可用的支付提供商
             */
            ,
            /**
             * 支付服务类
             * 支持多种支付方式，自动选择可用的支付提供商
             */
            class: PaymentService
        };
        {
        }
    }
    constructor() {
        this.name = '模拟支付';
        // 初始化支付提供商（按优先级排序）
        this.providers = [
            new AlipayProvider(),
            new WechatProvider(),
            new MockProvider()
        ];
        // 选择默认提供商
        this.selectDefaultProvider();
    }
    /**
     * 选择默认支付提供商
     */
    selectDefaultProvider() {
        // 优先选择已配置的真实支付提供商
        this.defaultProvider = this.providers.find(provider => provider.isConfigured && provider.name !== '模拟支付') || this.providers.find(provider => provider.name === '模拟支付');
        logger_1.winstonLogger.info(`默认支付提供商: ${this.defaultProvider.name}`);
    }
    /**
     * 获取可用的支付方式
     */
    getAvailablePaymentMethods() {
        return this.providers.map(provider => ({
            method: this.getProviderMethod(provider),
            name: provider.name,
            configured: provider.isConfigured
        }));
    }
    /**
     * 根据提供商获取支付方式
     */
    getProviderMethod(provider) {
        switch (provider.name) {
            case '支付宝沙箱':
                return PaymentMethod.ALIPAY_SANDBOX;
            case '微信支付沙箱':
                return PaymentMethod.WECHAT_SANDBOX;
            default:
                return PaymentMethod.MOCK;
        }
    }
    /**
     * 根据支付方式获取提供商
     */
    getProvider(method) {
        if (!method) {
            return this.defaultProvider;
        }
        const provider = this.providers.find(p => this.getProviderMethod(p) === method);
        if (!provider) {
            throw AppError_1.ErrorFactory.badRequest('不支持的支付方式');
        }
        if (!provider.isConfigured) {
            throw AppError_1.ErrorFactory.badRequest(`${provider.name}未配置`);
        }
        return provider;
    }
    /**
     * 创建支付订单
     */
    async createPayment(orderInfo, method) {
        try {
            // 验证订单信息
            this.validateOrderInfo(orderInfo);
            const provider = this.getProvider(method);
            logger_1.winstonLogger.info('创建支付订单', {
                orderId: orderInfo.orderId,
                amount: orderInfo.amount,
                provider: provider.name,
                userId: orderInfo.userId
            });
            const result = await provider.createPayment(orderInfo);
            // 记录支付创建事件
            await this.recordPaymentEvent(result.paymentId, 'CREATED', {
                orderId: orderInfo.orderId,
                amount: orderInfo.amount,
                provider: provider.name
            });
            return result;
        }
        catch (error) {
            logger_1.winstonLogger.error('创建支付订单失败', {
                orderId: orderInfo.orderId,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * 查询支付状态
     */
    async queryPaymentStatus(paymentId) {
        try {
            // 先从缓存获取支付信息
            const paymentInfo = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
            if (!paymentInfo) {
                throw AppError_1.ErrorFactory.notFound('支付订单不存在');
            }
            const provider = this.getProvider(paymentInfo.method);
            const status = await provider.queryPayment(paymentId);
            // 更新缓存中的状态
            if (status !== paymentInfo.status) {
                paymentInfo.status = status;
                paymentInfo.updatedAt = new Date();
                await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, cache_1.CACHE_TTL.LONG);
                // 记录状态变更事件
                await this.recordPaymentEvent(paymentId, 'STATUS_CHANGED', {
                    oldStatus: paymentInfo.status,
                    newStatus: status
                });
            }
            return status;
        }
        catch (error) {
            logger_1.winstonLogger.error('查询支付状态失败', {
                paymentId,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * 处理支付退款
     */
    async refundPayment(paymentId, refundAmount, reason) {
        try {
            // 获取支付信息
            const paymentInfo = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
            if (!paymentInfo) {
                throw AppError_1.ErrorFactory.notFound('支付订单不存在');
            }
            if (paymentInfo.status !== PaymentStatus.SUCCESS) {
                throw AppError_1.ErrorFactory.badRequest('只能对成功的支付进行退款');
            }
            if (refundAmount > paymentInfo.amount) {
                throw AppError_1.ErrorFactory.badRequest('退款金额不能超过支付金额');
            }
            const provider = this.getProvider(paymentInfo.method);
            logger_1.winstonLogger.info('处理支付退款', {
                paymentId,
                refundAmount,
                reason,
                provider: provider.name
            });
            const refundInfo = {
                paymentId,
                refundAmount,
                reason
            };
            const result = await provider.refund(refundInfo);
            // 更新支付状态
            paymentInfo.status = PaymentStatus.REFUNDING;
            paymentInfo.updatedAt = new Date();
            await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, cache_1.CACHE_TTL.LONG);
            // 记录退款事件
            await this.recordPaymentEvent(paymentId, 'REFUND_REQUESTED', {
                refundId: result.refundId,
                refundAmount,
                reason
            });
            return result;
        }
        catch (error) {
            logger_1.winstonLogger.error('处理支付退款失败', {
                paymentId,
                refundAmount,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * 处理支付回调
     */
    async handlePaymentCallback(method, callbackData) {
        try {
            const provider = this.getProvider(method);
            logger_1.winstonLogger.info('处理支付回调', {
                method,
                provider: provider.name,
                data: callbackData
            });
            const callback = await provider.verifyCallback(callbackData);
            if (callback) {
                // 更新支付状态
                const paymentInfo = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${callback.paymentId}`);
                if (paymentInfo) {
                    paymentInfo.status = callback.status;
                    paymentInfo.tradeNo = callback.tradeNo;
                    paymentInfo.updatedAt = new Date();
                    await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${callback.paymentId}`, paymentInfo, cache_1.CACHE_TTL.LONG);
                }
                // 记录回调事件
                await this.recordPaymentEvent(callback.paymentId, 'CALLBACK_RECEIVED', {
                    status: callback.status,
                    tradeNo: callback.tradeNo
                });
            }
            return callback;
        }
        catch (error) {
            logger_1.winstonLogger.error('处理支付回调失败', {
                method,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * 获取支付信息
     */
    async getPaymentInfo(paymentId) {
        const paymentInfo = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        if (!paymentInfo) {
            throw AppError_1.ErrorFactory.notFound('支付订单不存在');
        }
        return paymentInfo;
    }
    /**
     * 取消支付
     */
    async cancelPayment(paymentId) {
        const paymentInfo = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        if (!paymentInfo) {
            throw AppError_1.ErrorFactory.notFound('支付订单不存在');
        }
        if (paymentInfo.status !== PaymentStatus.PENDING) {
            throw AppError_1.ErrorFactory.badRequest('只能取消待支付的订单');
        }
        paymentInfo.status = PaymentStatus.CANCELLED;
        paymentInfo.updatedAt = new Date();
        await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, cache_1.CACHE_TTL.LONG);
        await this.recordPaymentEvent(paymentId, 'CANCELLED', {
            reason: '用户取消'
        });
        logger_1.winstonLogger.info('支付订单已取消', { paymentId });
    }
    /**
     * 验证订单信息
     */
    validateOrderInfo(orderInfo) {
        if (!orderInfo.orderId || !orderInfo.amount || !orderInfo.title || !orderInfo.userId) {
            throw AppError_1.ErrorFactory.badRequest('订单信息不完整');
        }
        if (orderInfo.amount <= 0) {
            throw AppError_1.ErrorFactory.badRequest('支付金额必须大于0');
        }
        if (orderInfo.amount > 100000000) { // 最大100万元
            throw AppError_1.ErrorFactory.badRequest('支付金额过大');
        }
    }
    /**
     * 记录支付事件
     */
    async recordPaymentEvent(paymentId, event, data) {
        const eventKey = `${cache_1.CACHE_KEYS.PAYMENT}events:${paymentId}`;
        const events = await cache_1.cache.get(eventKey) || [];
        events.push({
            event,
            data,
            timestamp: new Date()
        });
        await cache_1.cache.set(eventKey, events, cache_1.CACHE_TTL.VERY_LONG);
    }
    /**
     * 获取支付事件历史
     */
    async getPaymentEvents(paymentId) {
        const eventKey = `${cache_1.CACHE_KEYS.PAYMENT}events:${paymentId}`;
        return await cache_1.cache.get(eventKey) || [];
    }
    /**
     * 模拟支付成功（测试用）
     */
    async simulatePaymentSuccess(paymentId) {
        if (process.env.NODE_ENV === 'production') {
            throw AppError_1.ErrorFactory.forbidden('生产环境不允许模拟支付');
        }
        const paymentInfo = await cache_1.cache.get(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        if (!paymentInfo) {
            throw AppError_1.ErrorFactory.notFound('支付订单不存在');
        }
        paymentInfo.status = PaymentStatus.SUCCESS;
        paymentInfo.tradeNo = `mock_${Date.now()}`;
        paymentInfo.updatedAt = new Date();
        await cache_1.cache.set(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, cache_1.CACHE_TTL.LONG);
        await this.recordPaymentEvent(paymentId, 'SIMULATED_SUCCESS', {
            note: '测试环境模拟支付成功'
        });
        logger_1.winstonLogger.info('模拟支付成功', { paymentId });
    }
    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            defaultProvider: this.defaultProvider.name,
            availableMethods: this.getAvailablePaymentMethods(),
            providers: this.providers.map(p => ({
                name: p.name,
                configured: p.isConfigured
            }))
        };
    }
}
// 导出服务实例
exports.paymentService = new PaymentService();
//# sourceMappingURL=paymentService.js.map