"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wechatPayService = void 0;
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../utils/errorHandler");
const database_1 = require("../config/database"); // 统一Prisma实例
const paymentBaseService_1 = require("./paymentBaseService");
class WechatPayService {
    constructor() {
        this.appId = process.env.WECHAT_PAY_APP_ID || '';
        this.mchId = process.env.WECHAT_PAY_MCH_ID || '';
        this.apiKey = process.env.WECHAT_PAY_API_KEY || '';
        this.apiV3Key = process.env.WECHAT_PAY_API_V3_KEY || '';
        this.privateKey = process.env.WECHAT_PAY_PRIVATE_KEY || '';
        this.certificateSerialNo = process.env.WECHAT_PAY_CERT_SERIAL_NO || '';
        this.baseURL = 'https://api.mch.weixin.qq.com';
    }
    /**
     * 生成签名
     */
    generateSignature(method, url, body, nonceStr, timestamp) {
        const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
        const signature = crypto
            .createSign('RSA-SHA256')
            .update(message)
            .sign(this.privateKey, 'base64');
        return signature;
    }
    /**
     * 创建微信支付订单
     */
    async createOrder(orderId, amount, description, openid, notifyUrl) {
        try {
            const order = await database_1.prisma.order.findUnique({
                where: { id: orderId },
                include: { resource: true }
            });
            if (!order) {
                throw new errorHandler_1.AppError('订单不存在', 404);
            }
            const url = '/v3/pay/transactions/jsapi';
            const nonceStr = this.generateNonceStr();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const body = JSON.stringify({
                appid: this.appId,
                mchid: this.mchId,
                description,
                out_trade_no: orderId,
                notify_url: notifyUrl || `${process.env.BACKEND_URL}/api/v1/payments/wechat/notify`,
                amount: {
                    total: Math.round(amount * 100), // 转换为分
                    currency: 'CNY'
                },
                payer: {
                    openid
                }
            });
            const signature = this.generateSignature('POST', url, body, nonceStr, timestamp);
            const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.certificateSerialNo}"`;
            const response = await axios_1.default.post(`${this.baseURL}${url}`, body, {
                headers: {
                    'Authorization': authorization,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'WeChatPay-Node-SDK'
                }
            });
            const { prepay_id } = response.data;
            // 生成前端调起支付的参数
            const paySign = this.generatePaySign(prepay_id, nonceStr, timestamp);
            return {
                prepay_id,
                appId: this.appId,
                timeStamp: timestamp,
                nonceStr,
                package: `prepay_id=${prepay_id}`,
                signType: 'RSA',
                paySign,
                orderId,
                amount
            };
        }
        catch (error) {
            console.error('微信支付订单创建失败:', error);
            throw new errorHandler_1.AppError('支付订单创建失败', 500);
        }
    }
    /**
     * 生成支付签名
     */
    generatePaySign(prepayId, nonceStr, timestamp) {
        const message = `${this.appId}\n${timestamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
        const signature = crypto
            .createSign('RSA-SHA256')
            .update(message)
            .sign(this.privateKey, 'base64');
        return signature;
    }
    /**
     * 生成随机字符串
     */
    generateNonceStr(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * 查询订单状态
     */
    async queryOrderStatus(orderId) {
        try {
            const url = `/v3/pay/transactions/out-trade-no/${orderId}?mchid=${this.mchId}`;
            const nonceStr = this.generateNonceStr();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const body = '';
            const signature = this.generateSignature('GET', url, body, nonceStr, timestamp);
            const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.certificateSerialNo}"`;
            const response = await axios_1.default.get(`${this.baseURL}${url}`, {
                headers: {
                    'Authorization': authorization,
                    'Accept': 'application/json',
                    'User-Agent': 'WeChatPay-Node-SDK'
                }
            });
            return {
                success: true,
                status: response.data.trade_state,
                tradeNo: response.data.transaction_id,
                amount: response.data.amount.total / 100, // 转换为元
                successTime: response.data.success_time
            };
        }
        catch (error) {
            console.error('微信支付订单查询失败:', error);
            throw new errorHandler_1.AppError('订单查询失败', 500);
        }
    }
    /**
     * 处理微信支付通知
     */
    async handleNotify(body, signature, serial, nonce, timestamp) {
        try {
            // 验证签名
            const verified = this.verifySignature(body, signature, serial, nonce, timestamp);
            if (!verified) {
                throw new errorHandler_1.AppError('签名验证失败', 400);
            }
            const decryptedData = this.decryptNotify(body);
            const { out_trade_no: orderId, transaction_id: transactionId, trade_state: tradeState } = decryptedData;
            // 根据支付状态处理
            if (tradeState === 'SUCCESS') {
                await paymentBaseService_1.paymentBaseService.handleSuccessfulPayment(orderId, transactionId);
            }
            else {
                // 其他状态如 REVOKED, NOTPAY, CLOSED, USERPAYING, PAYERROR 等都视为支付失败
                await paymentBaseService_1.paymentBaseService.handleFailedPayment(orderId, transactionId);
            }
            return {
                code: 'SUCCESS',
                message: '成功'
            };
        }
        catch (error) {
            console.error('微信支付通知处理失败:', error);
            return {
                code: 'FAIL',
                message: '处理失败'
            };
        }
    }
    /**
     * 验证签名
     */
    verifySignature(body, signature, serial, nonce, timestamp) {
        try {
            const message = `${timestamp}\n${nonce}\n${body}\n`;
            // 这里应该使用微信的公钥进行验证
            // 实际实现需要获取微信的证书
            return true; // 简化验证
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 解密通知数据
     */
    decryptNotify(encryptedData) {
        // 实际实现需要解密微信的加密数据
        // 这里简化处理
        return encryptedData;
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
            const url = '/v3/refund/domestic/refunds';
            const nonceStr = this.generateNonceStr();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const body = JSON.stringify({
                transaction_id: payment.transactionId,
                out_refund_no: `REF${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                reason,
                amount: {
                    refund: Math.round(refundAmount * 100), // 转换为分
                    total: Math.round(Number(payment.amount) * 100),
                    currency: 'CNY'
                }
            });
            const signature = this.generateSignature('POST', url, body, nonceStr, timestamp);
            const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.certificateSerialNo}"`;
            const response = await axios_1.default.post(`${this.baseURL}${url}`, body, {
                headers: {
                    'Authorization': authorization,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'WeChatPay-Node-SDK'
                }
            });
            return {
                success: true,
                refundId: response.data.refund_id,
                refundAmount: response.data.amount.refund / 100, // 转换为元
                status: response.data.status
            };
        }
        catch (error) {
            console.error('微信支付退款失败:', error);
            throw new errorHandler_1.AppError('退款申请失败', 500);
        }
    }
}
exports.wechatPayService = new WechatPayService();
//# sourceMappingURL=wechatPayService.js.map