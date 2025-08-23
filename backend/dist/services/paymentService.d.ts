export declare const paymentService: {
    createPayment(data: {
        orderId: string;
        amount: number;
        paymentMethod: string;
        userId: string;
    }): Promise<{
        paymentMethod: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentGateway: string;
        transactionId: string | null;
        paidAt: Date | null;
        refundedAt: Date | null;
        refundAmount: import("@prisma/client/runtime/library").Decimal | null;
        refundReason: string | null;
        metadata: string | null;
    }>;
    getPaymentStatus(paymentId: string): Promise<{
        order: {
            resource: {
                title: string;
                images: string;
            };
            id: string;
            status: string;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        paymentMethod: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentGateway: string;
        transactionId: string | null;
        paidAt: Date | null;
        refundedAt: Date | null;
        refundAmount: import("@prisma/client/runtime/library").Decimal | null;
        refundReason: string | null;
        metadata: string | null;
    }>;
    updatePaymentStatus(paymentId: string, status: string, transactionId?: string): Promise<{
        paymentMethod: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentGateway: string;
        transactionId: string | null;
        paidAt: Date | null;
        refundedAt: Date | null;
        refundAmount: import("@prisma/client/runtime/library").Decimal | null;
        refundReason: string | null;
        metadata: string | null;
    }>;
    requestRefund(orderId: string, reason: string, userId: string): Promise<{
        paymentMethod: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentGateway: string;
        transactionId: string | null;
        paidAt: Date | null;
        refundedAt: Date | null;
        refundAmount: import("@prisma/client/runtime/library").Decimal | null;
        refundReason: string | null;
        metadata: string | null;
    }>;
    getPaymentConfig(): Promise<{
        alipay: {
            enabled: boolean;
            appId: string | undefined;
            publicKey: string | undefined;
        };
        wechat: {
            enabled: boolean;
            appId: string | undefined;
            mchId: string | undefined;
        };
        supportedMethods: string[];
    }>;
    getUserPayments(userId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            order: {
                resource: {
                    title: string;
                    images: string;
                };
                id: string;
                status: string;
            };
        } & {
            paymentMethod: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            paymentGateway: string;
            transactionId: string | null;
            paidAt: Date | null;
            refundedAt: Date | null;
            refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            refundReason: string | null;
            metadata: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
};
//# sourceMappingURL=paymentService.d.ts.map