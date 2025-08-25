/**
 * 聊天服务（订单会话相关）
 * - 统一复用全局 prisma 实例，避免重复实例化与类型问题
 * - 提供消息获取、发送、已读标记、未读数、最新消息、参与订单列表等能力
 */
export declare const chatService: {
    getChatMessages(orderId: string): Promise<({
        sender: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        orderId: string;
        content: string;
        senderId: string;
        receiverId: string;
        isRead: boolean;
        metadata: string | null;
    })[]>;
    sendMessage(data: {
        orderId: string;
        content: string;
        type?: string;
        senderId: string;
        receiverId: string;
    }): Promise<{
        sender: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        orderId: string;
        content: string;
        senderId: string;
        receiverId: string;
        isRead: boolean;
        metadata: string | null;
    }>;
    markAsRead(messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    getLatestMessage(orderId: string): Promise<({
        sender: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        orderId: string;
        content: string;
        senderId: string;
        receiverId: string;
        isRead: boolean;
        metadata: string | null;
    }) | null>;
    getUserChatOrders(userId: string): Promise<({
        resource: {
            title: string;
            images: string;
            owner: {
                id: string;
                username: string;
                avatar: string | null;
            };
        };
        renter: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
        renterId: string;
        resourceId: string;
        startDate: Date;
        endDate: Date;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
        notes: string | null;
        deliveryMethod: string;
        deliveryAddress: string | null;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
    })[]>;
};
//# sourceMappingURL=chatService.d.ts.map