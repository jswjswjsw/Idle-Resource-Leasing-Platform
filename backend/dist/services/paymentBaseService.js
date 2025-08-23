"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentBaseService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../utils/errorHandler");
const paymentService_1 = require("./paymentService");
/**
 * @class PaymentBaseService
 * @description 提供了处理支付通用逻辑的基础服务，例如支付成功后的订单和资源状态更新。
 */
class PaymentBaseService {
    /**
     * 处理成功的支付通知
     * @param orderId - 订单ID
     * @param tradeNo - 支付平台返回的交易号
     */
    async handleSuccessfulPayment(orderId, tradeNo) {
        try {
            // 更新支付状态
            await paymentService_1.paymentService.updatePaymentStatus(orderId, 'PAID', tradeNo);
            // 更新订单状态
            const order = await database_1.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID'
                },
                select: { resourceId: true }
            });
            if (!order) {
                throw new errorHandler_1.AppError('订单不存在', 404);
            }
            // 更新资源状态
            await database_1.prisma.resource.update({
                where: { id: order.resourceId },
                data: { status: 'RENTED' }
            });
        }
        catch (error) {
            console.error('处理成功支付时出错:', error);
            // 注意：这里不向上抛出错误，因为这通常是异步通知处理的一部分。
            // 记录错误对于调试至关重要。
        }
    }
    /**
     * 处理失败的支付通知
     * @param orderId - 订单ID
     * @param tradeNo - 支付平台返回的交易号 (可选)
     */
    async handleFailedPayment(orderId, tradeNo) {
        try {
            await paymentService_1.paymentService.updatePaymentStatus(orderId, 'FAILED', tradeNo);
        }
        catch (error) {
            console.error('处理失败支付时出错:', error);
        }
    }
}
exports.paymentBaseService = new PaymentBaseService();
//# sourceMappingURL=paymentBaseService.js.map