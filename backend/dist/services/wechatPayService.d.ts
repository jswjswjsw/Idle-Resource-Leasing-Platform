declare class WechatPayService {
    private mchId;
    private appId;
    private apiKey;
    private apiV3Key;
    private privateKey;
    private certificateSerialNo;
    private baseURL;
    constructor();
    /**
     * 生成签名
     */
    private generateSignature;
    /**
     * 创建微信支付订单
     */
    createOrder(orderId: string, amount: number, description: string, openid: string, notifyUrl?: string): Promise<{
        prepay_id: any;
        appId: string;
        timeStamp: string;
        nonceStr: string;
        package: string;
        signType: string;
        paySign: string;
        orderId: string;
        amount: number;
    }>;
    /**
     * 生成支付签名
     */
    private generatePaySign;
    /**
     * 生成随机字符串
     */
    private generateNonceStr;
    /**
     * 查询订单状态
     */
    queryOrderStatus(orderId: string): Promise<{
        success: boolean;
        status: any;
        tradeNo: any;
        amount: number;
        successTime: any;
    }>;
    /**
     * 处理微信支付通知
     */
    handleNotify(body: any, signature: string, serial: string, nonce: string, timestamp: string): Promise<{
        code: string;
        message: string;
    }>;
    /**
     * 验证签名
     */
    private verifySignature;
    /**
     * 解密通知数据
     */
    private decryptNotify;
    /**
     * 申请退款
     */
    refund(orderId: string, refundAmount: number, reason: string): Promise<{
        success: boolean;
        refundId: any;
        refundAmount: number;
        status: any;
    }>;
}
export declare const wechatPayService: WechatPayService;
export {};
//# sourceMappingURL=wechatPayService.d.ts.map