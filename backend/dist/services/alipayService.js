"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alipayService = void 0;
const alipay_sdk_1 = __importDefault(require("alipay-sdk"));
const errorHandler_1 = require("..//utils/errorHandler");
const database_1 = require("../config/database"); // 统一Prisma实例
const paymentBaseService_1 = require("./paymentBaseService");
class AlipayService {
    constructor() {
        this.alipaySdk = new alipay_sdk_1.default({
            appId: process.env.ALIPAY_APP_ID || '',
            privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
            alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
            gateway: 'https://openapi.alipay.com/gateway.do',
            signType: 'RSA2',
            charset: 'utf-8',
            version: '1.0',
        });
    }
    /**
     * 创建支付宝支付订单
     */
    async createOrder(orderId, amount, subject, returnUrl, notifyUrl) {
        try {
            const order = await database_1.prisma.order.findUnique({
                where: { id: orderId },
                include: { resource: true, renter: true }
            });
            if (!order) {
                throw new errorHandler_1.AppError('订单不存在', 404);
            }
            const bizContent = {
                out_trade_no: orderId,
                product_code: 'FAST_INSTANT_TRADE_PAY',
                total_amount: amount.toFixed(2),
                subject: subject,
                body: `租赁资源：${order.resource.title}`,
                timeout_express: '30m',
                passback_params: encodeURIComponent(JSON.stringify({
                    orderId,
                    userId: order.renterId
                }))
            };
            const method = 'alipay.trade.page.pay';
            const params = {
                biz_content: JSON.stringify(bizContent),
                return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                notify_url: notifyUrl || `${process.env.BACKEND_URL}/api/v1/payments/alipay/notify`
            };
            const result = await this.alipaySdk.exec(method, params);
            return {
                paymentUrl: result,
                orderId,
                amount
            };
        }
        catch (error) {
            console.error('支付宝订单创建失败:', error);
            throw new errorHandler_1.AppError('支付订单创建失败', 500);
        }
    }
    /**
     * 创建手机网站支付订单
     */
    async createWapOrder(orderId, amount, subject, returnUrl, notifyUrl) {
        try {
            const order = await database_1.prisma.order.findUnique({
                where: { id: orderId },
                include: { resource: true, renter: true }
            });
            if (!order) {
                throw new errorHandler_1.AppError('订单不存在', 404);
            }
            const bizContent = {
                out_trade_no: orderId,
                product_code: 'QUICK_WAP_WAY',
                total_amount: amount.toFixed(2),
                subject: subject,
                body: `租赁资源：${order.resource.title}`,
                timeout_express: '30m',
                quit_url: `${process.env.FRONTEND_URL}/orders`
            };
            const method = 'alipay.trade.wap.pay';
            const params = {
                biz_content: JSON.stringify(bizContent),
                return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                notify_url: notifyUrl || `${process.env.BACKEND_URL}/api/v1/payments/alipay/notify`
            };
            const result = await this.alipaySdk.exec(method, params);
            return {
                paymentUrl: result,
                orderId,
                amount
            };
        }
        catch (error) {
            console.error('支付宝手机支付订单创建失败:', error);
            throw new errorHandler_1.AppError('支付订单创建失败', 500);
        }
    }
    /**
     * 查询订单状态
     */
    async queryOrderStatus(orderId) {
        try {
            const bizContent = { out_trade_no: orderId };
            const method = 'alipay.trade.query';
            const params = { biz_content: JSON.stringify(bizContent) };
            const result = await this.alipaySdk.exec(method, params);
            if (result.code === '10000') {
                return {
                    success: true,
                    status: result.trade_status,
                    tradeNo: result.trade_no,
                    buyerUserId: result.buyer_user_id,
                    totalAmount: result.total_amount
                };
            }
            else {
                throw new errorHandler_1.AppError(result.sub_msg || '查询失败', 400);
            }
        }
        catch (error) {
            console.error('支付宝订单查询失败:', error);
            throw new errorHandler_1.AppError('订单查询失败', 500);
        }
    }
    /**
     * 处理支付宝异步通知
     */
    async handleNotify(data) {
        try {
            const verified = this.alipaySdk.checkNotifySign(data);
            if (!verified) {
                throw new errorHandler_1.AppError('签名验证失败', 400);
            }
            const { out_trade_no: orderId, trade_no: tradeNo, trade_status: tradeStatus, } = data;
            if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
                await paymentBaseService_1.paymentBaseService.handleSuccessfulPayment(orderId, tradeNo);
            }
            else if (tradeStatus === 'TRADE_CLOSED') {
                await paymentBaseService_1.paymentBaseService.handleFailedPayment(orderId, tradeNo);
            }
            return 'success';
        }
        catch (error) {
            console.error('支付宝通知处理失败:', error);
            return 'fail';
        }
    }
    /**
     * 申请退款
     */
    async refund(orderId, refundAmount, reason) {
        try {
            const order = await database_1.prisma.order.findUnique({
                where: { id: orderId },
                include: { payments: true }
            });
            if (!order) {
                throw new errorHandler_1.AppError('订单不存在', 404);
            }
            const payment = order.payments.find((p) => p.status === 'PAID');
            if (!payment) {
                throw new errorHandler_1.AppError('未找到成功的支付记录', 404);
            }
            const bizContent = {
                out_trade_no: orderId,
                refund_amount: refundAmount.toFixed(2),
                refund_reason: reason,
                out_request_no: `REF${Date.now()}${Math.random().toString(36).substr(2, 9)}`
            };
            const method = 'alipay.trade.refund';
            const params = { biz_content: JSON.stringify(bizContent) };
            const result = await this.alipaySdk.exec(method, params);
            if (result.code === '10000') {
                // 更新支付记录的退款信息
                await database_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'REFUNDED',
                        refundedAt: new Date(),
                        refundAmount: refundAmount,
                        refundReason: reason
                    }
                });
                return {
                    success: true,
                    refundNo: result.out_request_no,
                    refundAmount: result.refund_fee
                };
            }
            else {
                throw new errorHandler_1.AppError(result.sub_msg || '退款失败', 400);
            }
        }
        catch (error) {
            console.error('支付宝退款失败:', error);
            throw new errorHandler_1.AppError('退款申请失败', 500);
        }
    }
}
exports.alipayService = new AlipayService();
//# sourceMappingURL=alipayService.js.map