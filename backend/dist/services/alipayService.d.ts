declare class AlipayService {
    private alipaySdk;
    constructor();
    /**
     * 创建支付宝支付订单
     */
    createOrder(orderId: string, amount: number, subject: string, returnUrl?: string, notifyUrl?: string): Promise<{
        paymentUrl: import("alipay-sdk").AlipaySdkCommonResult;
        orderId: string;
        amount: number;
    }>;
    /**
     * 创建手机网站支付订单
     */
    createWapOrder(orderId: string, amount: number, subject: string, returnUrl?: string, notifyUrl?: string): Promise<{
        paymentUrl: import("alipay-sdk").AlipaySdkCommonResult;
        orderId: string;
        amount: number;
    }>;
    /**
     * 查询订单状态
     */
    queryOrderStatus(orderId: string): Promise<{
        success: boolean;
        status: any;
        tradeNo: any;
        buyerUserId: any;
        totalAmount: any;
    }>;
    /**
     * 处理支付宝异步通知
     */
    handleNotify(data: any): Promise<"success" | "fail">;
    /**
     * 申请退款
     */
    refund(orderId: string, refundAmount: number, reason: string): Promise<{
        success: boolean;
        refundNo: any;
        refundAmount: any;
    }>;
}
export declare const alipayService: AlipayService;
export {};
//# sourceMappingURL=alipayService.d.ts.map