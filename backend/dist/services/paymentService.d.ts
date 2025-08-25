/**
 * 支付方式枚举
 */
export declare enum PaymentMethod {
    ALIPAY_SANDBOX = "alipay_sandbox",
    WECHAT_SANDBOX = "wechat_sandbox",
    MOCK = "mock"
}
/**
 * 支付状态枚举
 */
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded",
    REFUNDING = "refunding"
}
/**
 * 订单信息接口
 */
export interface OrderInfo {
    orderId: string;
    amount: number;
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
export declare const paymentService: any;
//# sourceMappingURL=paymentService.d.ts.map