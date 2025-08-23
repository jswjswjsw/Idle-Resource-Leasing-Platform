/**
 * @class PaymentBaseService
 * @description 提供了处理支付通用逻辑的基础服务，例如支付成功后的订单和资源状态更新。
 */
declare class PaymentBaseService {
    /**
     * 处理成功的支付通知
     * @param orderId - 订单ID
     * @param tradeNo - 支付平台返回的交易号
     */
    handleSuccessfulPayment(orderId: string, tradeNo: string): Promise<void>;
    /**
     * 处理失败的支付通知
     * @param orderId - 订单ID
     * @param tradeNo - 支付平台返回的交易号 (可选)
     */
    handleFailedPayment(orderId: string, tradeNo?: string): Promise<void>;
}
export declare const paymentBaseService: PaymentBaseService;
export {};
//# sourceMappingURL=paymentBaseService.d.ts.map