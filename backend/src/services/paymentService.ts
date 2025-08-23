import { ErrorFactory } from '@/utils/AppError';
import { winstonLogger } from '@/middleware/logger';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/config/cache';
import crypto from 'crypto';
import axios from 'axios';

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  ALIPAY_SANDBOX = 'alipay_sandbox',
  WECHAT_SANDBOX = 'wechat_sandbox',
  MOCK = 'mock'
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  REFUNDING = 'refunding'
}

/**
 * 订单信息接口
 */
export interface OrderInfo {
  orderId: string;
  amount: number; // 金额（分）
  title: string;
  description?: string;
  userId: string;
  returnUrl?: string;
  notifyUrl?: string;
}

/**
 * 支付结果接口
 */
export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  paymentUrl?: string;
  qrCode?: string;
  message: string;
  tradeNo?: string;
}

/**
 * 退款信息接口
 */
export interface RefundInfo {
  paymentId: string;
  refundAmount: number;
  reason: string;
  refundId?: string;
}

/**
 * 退款结果接口
 */
export interface RefundResult {
  success: boolean;
  refundId: string;
  paymentId: string;
  refundAmount: number;
  message: string;
}

/**
 * 支付回调数据接口
 */
export interface PaymentCallback {
  paymentId: string;
  orderId: string;
  tradeNo: string;
  amount: number;
  status: PaymentStatus;
  timestamp: Date;
  signature?: string;
}

/**
 * 支付提供商接口
 */
interface PaymentProvider {
  name: string;
  isConfigured: boolean;
  createPayment(orderInfo: OrderInfo): Promise<PaymentResult>;
  queryPayment(paymentId: string): Promise<PaymentStatus>;
  refund(refundInfo: RefundInfo): Promise<RefundResult>;
  verifyCallback(data: any): Promise<PaymentCallback | null>;
}

/**
 * 支付宝沙箱支付提供商
 */
class AlipayProvider implements PaymentProvider {
  name = '支付宝沙箱';
  private readonly appId: string;
  private readonly privateKey: string;
  private readonly alipayPublicKey: string;
  private readonly gatewayUrl = 'https://openapi.alipaydev.com/gateway.do';

  constructor() {
    this.appId = process.env.ALIPAY_SANDBOX_APP_ID || '';
    this.privateKey = process.env.ALIPAY_SANDBOX_PRIVATE_KEY || '';
    this.alipayPublicKey = process.env.ALIPAY_SANDBOX_PUBLIC_KEY || '';
  }

  get isConfigured(): boolean {
    return !!(this.appId && this.privateKey && this.alipayPublicKey);
  }

  async createPayment(orderInfo: OrderInfo): Promise<PaymentResult> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('支付宝沙箱未配置');
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
    await cache.set(
      `${CACHE_KEYS.PAYMENT}${paymentId}`,
      {
        paymentId,
        orderId: orderInfo.orderId,
        amount: orderInfo.amount,
        method: PaymentMethod.ALIPAY_SANDBOX,
        status: PaymentStatus.PENDING,
        createdAt: new Date()
      },
      CACHE_TTL.LONG
    );

    winstonLogger.info('支付宝沙箱支付创建成功', {
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

  async queryPayment(paymentId: string): Promise<PaymentStatus> {
    // 查询支付状态（沙箱环境简化处理）
    const cachedPayment = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
    if (cachedPayment) {
      return cachedPayment.status;
    }
    return PaymentStatus.PENDING;
  }

  async refund(refundInfo: RefundInfo): Promise<RefundResult> {
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    winstonLogger.info('支付宝沙箱退款处理', {
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

  async verifyCallback(data: any): Promise<PaymentCallback | null> {
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

  private generateSign(params: any): string {
    // 简化的签名生成（实际使用中应使用完整的RSA签名）
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'sign' && params[key])
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto.createHash('md5').update(sortedParams + this.privateKey).digest('hex');
  }

  private buildQueryString(params: any): string {
    return Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}

/**
 * 微信支付沙箱提供商
 */
class WechatProvider implements PaymentProvider {
  name = '微信支付沙箱';
  private readonly appId: string;
  private readonly mchId: string;
  private readonly apiKey: string;

  constructor() {
    this.appId = process.env.WECHAT_SANDBOX_APP_ID || '';
    this.mchId = process.env.WECHAT_SANDBOX_MCH_ID || '';
    this.apiKey = process.env.WECHAT_SANDBOX_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!(this.appId && this.mchId && this.apiKey);
  }

  async createPayment(orderInfo: OrderInfo): Promise<PaymentResult> {
    if (!this.isConfigured) {
      throw ErrorFactory.badRequest('微信支付沙箱未配置');
    }

    const paymentId = `wxpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 模拟微信支付二维码生成
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=weixin://wxpay/bizpayurl?pr=${paymentId}`;

    // 缓存支付信息
    await cache.set(
      `${CACHE_KEYS.PAYMENT}${paymentId}`,
      {
        paymentId,
        orderId: orderInfo.orderId,
        amount: orderInfo.amount,
        method: PaymentMethod.WECHAT_SANDBOX,
        status: PaymentStatus.PENDING,
        createdAt: new Date()
      },
      CACHE_TTL.LONG
    );

    winstonLogger.info('微信支付沙箱支付创建成功', {
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

  async queryPayment(paymentId: string): Promise<PaymentStatus> {
    const cachedPayment = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
    if (cachedPayment) {
      return cachedPayment.status;
    }
    return PaymentStatus.PENDING;
  }

  async refund(refundInfo: RefundInfo): Promise<RefundResult> {
    const refundId = `wxrefund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    winstonLogger.info('微信支付沙箱退款处理', {
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

  async verifyCallback(data: any): Promise<PaymentCallback | null> {
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
class MockProvider implements PaymentProvider {
  name = '模拟支付';

  get isConfigured(): boolean {
    return true; // 模拟支付始终可用
  }

  async createPayment(orderInfo: OrderInfo): Promise<PaymentResult> {
    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 缓存支付信息
    await cache.set(
      `${CACHE_KEYS.PAYMENT}${paymentId}`,
      {
        paymentId,
        orderId: orderInfo.orderId,
        amount: orderInfo.amount,
        method: PaymentMethod.MOCK,
        status: PaymentStatus.PENDING,
        createdAt: new Date()
      },
      CACHE_TTL.LONG
    );

    // 模拟支付URL
    const paymentUrl = `${process.env.FRONTEND_URL}/payment/mock?paymentId=${paymentId}`;

    winstonLogger.info('模拟支付订单创建', {
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

  async queryPayment(paymentId: string): Promise<PaymentStatus> {
    const cachedPayment = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
    if (cachedPayment) {
      return cachedPayment.status;
    }
    return PaymentStatus.PENDING;
  }

  async refund(refundInfo: RefundInfo): Promise<RefundResult> {
    const refundId = `mock_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    winstonLogger.info('模拟退款处理', {
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

  async verifyCallback(data: any): Promise<PaymentCallback | null> {
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
export class PaymentService {
  private providers: PaymentProvider[];
  private defaultProvider: PaymentProvider;

  constructor() {
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
  private selectDefaultProvider(): void {
    // 优先选择已配置的真实支付提供商
    this.defaultProvider = this.providers.find(provider => 
      provider.isConfigured && provider.name !== '模拟支付'
    ) || this.providers.find(provider => provider.name === '模拟支付')!;
    
    winstonLogger.info(`默认支付提供商: ${this.defaultProvider.name}`);
  }

  /**
   * 获取可用的支付方式
   */
  getAvailablePaymentMethods(): Array<{method: PaymentMethod, name: string, configured: boolean}> {
    return this.providers.map(provider => ({
      method: this.getProviderMethod(provider),
      name: provider.name,
      configured: provider.isConfigured
    }));
  }

  /**
   * 根据提供商获取支付方式
   */
  private getProviderMethod(provider: PaymentProvider): PaymentMethod {
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
  private getProvider(method?: PaymentMethod): PaymentProvider {
    if (!method) {
      return this.defaultProvider;
    }
    
    const provider = this.providers.find(p => this.getProviderMethod(p) === method);
    if (!provider) {
      throw ErrorFactory.badRequest('不支持的支付方式');
    }
    
    if (!provider.isConfigured) {
      throw ErrorFactory.badRequest(`${provider.name}未配置`);
    }
    
    return provider;
  }

  /**
   * 创建支付订单
   */
  async createPayment(
    orderInfo: OrderInfo, 
    method?: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      // 验证订单信息
      this.validateOrderInfo(orderInfo);
      
      const provider = this.getProvider(method);
      
      winstonLogger.info('创建支付订单', {
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
    } catch (error) {
      winstonLogger.error('创建支付订单失败', {
        orderId: orderInfo.orderId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // 先从缓存获取支付信息
      const paymentInfo = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
      if (!paymentInfo) {
        throw ErrorFactory.notFound('支付订单不存在');
      }
      
      const provider = this.getProvider(paymentInfo.method);
      const status = await provider.queryPayment(paymentId);
      
      // 更新缓存中的状态
      if (status !== paymentInfo.status) {
        paymentInfo.status = status;
        paymentInfo.updatedAt = new Date();
        await cache.set(`${CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, CACHE_TTL.LONG);
        
        // 记录状态变更事件
        await this.recordPaymentEvent(paymentId, 'STATUS_CHANGED', {
          oldStatus: paymentInfo.status,
          newStatus: status
        });
      }
      
      return status;
    } catch (error) {
      winstonLogger.error('查询支付状态失败', {
        paymentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 处理支付退款
   */
  async refundPayment(
    paymentId: string,
    refundAmount: number,
    reason: string
  ): Promise<RefundResult> {
    try {
      // 获取支付信息
      const paymentInfo = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
      if (!paymentInfo) {
        throw ErrorFactory.notFound('支付订单不存在');
      }
      
      if (paymentInfo.status !== PaymentStatus.SUCCESS) {
        throw ErrorFactory.badRequest('只能对成功的支付进行退款');
      }
      
      if (refundAmount > paymentInfo.amount) {
        throw ErrorFactory.badRequest('退款金额不能超过支付金额');
      }
      
      const provider = this.getProvider(paymentInfo.method);
      
      winstonLogger.info('处理支付退款', {
        paymentId,
        refundAmount,
        reason,
        provider: provider.name
      });
      
      const refundInfo: RefundInfo = {
        paymentId,
        refundAmount,
        reason
      };
      
      const result = await provider.refund(refundInfo);
      
      // 更新支付状态
      paymentInfo.status = PaymentStatus.REFUNDING;
      paymentInfo.updatedAt = new Date();
      await cache.set(`${CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, CACHE_TTL.LONG);
      
      // 记录退款事件
      await this.recordPaymentEvent(paymentId, 'REFUND_REQUESTED', {
        refundId: result.refundId,
        refundAmount,
        reason
      });
      
      return result;
    } catch (error) {
      winstonLogger.error('处理支付退款失败', {
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
  async handlePaymentCallback(
    method: PaymentMethod,
    callbackData: any
  ): Promise<PaymentCallback | null> {
    try {
      const provider = this.getProvider(method);
      
      winstonLogger.info('处理支付回调', {
        method,
        provider: provider.name,
        data: callbackData
      });
      
      const callback = await provider.verifyCallback(callbackData);
      
      if (callback) {
        // 更新支付状态
        const paymentInfo = await cache.get(`${CACHE_KEYS.PAYMENT}${callback.paymentId}`);
        if (paymentInfo) {
          paymentInfo.status = callback.status;
          paymentInfo.tradeNo = callback.tradeNo;
          paymentInfo.updatedAt = new Date();
          await cache.set(`${CACHE_KEYS.PAYMENT}${callback.paymentId}`, paymentInfo, CACHE_TTL.LONG);
        }
        
        // 记录回调事件
        await this.recordPaymentEvent(callback.paymentId, 'CALLBACK_RECEIVED', {
          status: callback.status,
          tradeNo: callback.tradeNo
        });
      }
      
      return callback;
    } catch (error) {
      winstonLogger.error('处理支付回调失败', {
        method,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 获取支付信息
   */
  async getPaymentInfo(paymentId: string): Promise<any> {
    const paymentInfo = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
    if (!paymentInfo) {
      throw ErrorFactory.notFound('支付订单不存在');
    }
    return paymentInfo;
  }

  /**
   * 取消支付
   */
  async cancelPayment(paymentId: string): Promise<void> {
    const paymentInfo = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
    if (!paymentInfo) {
      throw ErrorFactory.notFound('支付订单不存在');
    }
    
    if (paymentInfo.status !== PaymentStatus.PENDING) {
      throw ErrorFactory.badRequest('只能取消待支付的订单');
    }
    
    paymentInfo.status = PaymentStatus.CANCELLED;
    paymentInfo.updatedAt = new Date();
    await cache.set(`${CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, CACHE_TTL.LONG);
    
    await this.recordPaymentEvent(paymentId, 'CANCELLED', {
      reason: '用户取消'
    });
    
    winstonLogger.info('支付订单已取消', { paymentId });
  }

  /**
   * 验证订单信息
   */
  private validateOrderInfo(orderInfo: OrderInfo): void {
    if (!orderInfo.orderId || !orderInfo.amount || !orderInfo.title || !orderInfo.userId) {
      throw ErrorFactory.badRequest('订单信息不完整');
    }
    
    if (orderInfo.amount <= 0) {
      throw ErrorFactory.badRequest('支付金额必须大于0');
    }
    
    if (orderInfo.amount > 100000000) { // 最大100万元
      throw ErrorFactory.badRequest('支付金额过大');
    }
  }

  /**
   * 记录支付事件
   */
  private async recordPaymentEvent(
    paymentId: string,
    event: string,
    data: any
  ): Promise<void> {
    const eventKey = `${CACHE_KEYS.PAYMENT}events:${paymentId}`;
    const events = await cache.get(eventKey) || [];
    
    events.push({
      event,
      data,
      timestamp: new Date()
    });
    
    await cache.set(eventKey, events, CACHE_TTL.VERY_LONG);
  }

  /**
   * 获取支付事件历史
   */
  async getPaymentEvents(paymentId: string): Promise<any[]> {
    const eventKey = `${CACHE_KEYS.PAYMENT}events:${paymentId}`;
    return await cache.get(eventKey) || [];
  }

  /**
   * 模拟支付成功（测试用）
   */
  async simulatePaymentSuccess(paymentId: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw ErrorFactory.forbidden('生产环境不允许模拟支付');
    }
    
    const paymentInfo = await cache.get(`${CACHE_KEYS.PAYMENT}${paymentId}`);
    if (!paymentInfo) {
      throw ErrorFactory.notFound('支付订单不存在');
    }
    
    paymentInfo.status = PaymentStatus.SUCCESS;
    paymentInfo.tradeNo = `mock_${Date.now()}`;
    paymentInfo.updatedAt = new Date();
    await cache.set(`${CACHE_KEYS.PAYMENT}${paymentId}`, paymentInfo, CACHE_TTL.LONG);
    
    await this.recordPaymentEvent(paymentId, 'SIMULATED_SUCCESS', {
      note: '测试环境模拟支付成功'
    });
    
    winstonLogger.info('模拟支付成功', { paymentId });
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
export const paymentService = new PaymentService();