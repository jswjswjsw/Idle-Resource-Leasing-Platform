"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const cache_1 = require("../config/cache");
const database_1 = require("../config/database"); // 统一Prisma实例
exports.paymentService = {
    // 创建支付订单
    async createPayment(data) {
        const { orderId, amount, paymentMethod, userId } = data;
        // 验证订单是否存在且属于该用户
        const order = await database_1.prisma.order.findFirst({
            where: { id: orderId, renterId: userId },
            include: { resource: true }
        });
        if (!order) {
            throw new errorHandler_1.AppError('订单不存在或无权访问', 404, 'ORDER_NOT_FOUND');
        }
        if (Number(order.totalPrice) !== amount) {
            throw new errorHandler_1.AppError('支付金额不匹配', 400, 'AMOUNT_MISMATCH');
        }
        // 创建支付记录
        const payment = await database_1.prisma.payment.create({
            data: {
                orderId,
                amount,
                paymentMethod: paymentMethod,
                paymentGateway: 'SYSTEM',
                status: 'PENDING',
            }
        });
        return payment;
    },
    // 获取支付状态
    async getPaymentStatus(paymentId) {
        const cacheKey = `${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`;
        return await cache_1.cache.getOrSet(cacheKey, async () => {
            const payment = await database_1.prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    order: {
                        select: {
                            id: true,
                            status: true,
                            totalPrice: true,
                            resource: {
                                select: {
                                    title: true,
                                    images: true
                                }
                            }
                        }
                    }
                }
            });
            if (!payment) {
                throw new errorHandler_1.AppError('支付记录不存在', 404, 'PAYMENT_NOT_FOUND');
            }
            return payment;
        }, cache_1.CACHE_TTL.SHORT);
    },
    // 更新支付状态
    async updatePaymentStatus(paymentId, status, transactionId) {
        const payment = await database_1.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: status,
                transactionId,
                paidAt: status === 'PAID' ? new Date() : undefined
            }
        });
        // 清除缓存
        await cache_1.cache.del(`${cache_1.CACHE_KEYS.PAYMENT}${paymentId}`);
        // 如果支付成功，更新订单状态
        if (status === 'PAID') {
            await database_1.prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'CONFIRMED' }
            });
        }
        return payment;
    },
    // 申请退款
    async requestRefund(orderId, reason, userId) {
        const order = await database_1.prisma.order.findFirst({
            where: { id: orderId, renterId: userId }
        });
        if (!order) {
            throw new errorHandler_1.AppError('订单不存在或无权访问', 404, 'ORDER_NOT_FOUND');
        }
        if (!['CONFIRMED', 'COMPLETED'].includes(order.status)) {
            throw new errorHandler_1.AppError('订单状态不允许退款', 400, 'INVALID_ORDER_STATUS');
        }
        const payment = await database_1.prisma.payment.findFirst({
            where: { orderId, status: 'PAID' }
        });
        if (!payment) {
            throw new errorHandler_1.AppError('未找到成功的支付记录', 404, 'PAYMENT_NOT_FOUND');
        }
        // 更新支付记录为退款状态
        const updatedPayment = await database_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
                refundAmount: payment.amount,
                refundReason: reason,
            }
        });
        return updatedPayment;
    },
    // 获取支付配置
    async getPaymentConfig() {
        return {
            alipay: {
                enabled: true,
                appId: process.env.ALIPAY_APP_ID,
                publicKey: process.env.ALIPAY_PUBLIC_KEY,
            },
            wechat: {
                enabled: true,
                appId: process.env.WECHAT_APP_ID,
                mchId: process.env.WECHAT_MCH_ID,
            },
            supportedMethods: ['alipay', 'wechat_pay', 'bank_card']
        };
    },
    // 获取用户支付记录
    async getUserPayments(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            database_1.prisma.payment.findMany({
                where: {
                    order: {
                        renterId: userId
                    }
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            status: true,
                            resource: {
                                select: {
                                    title: true,
                                    images: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.payment.count({
                where: {
                    order: {
                        renterId: userId
                    }
                }
            })
        ]);
        return {
            data: payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};
//# sourceMappingURL=paymentService.js.map