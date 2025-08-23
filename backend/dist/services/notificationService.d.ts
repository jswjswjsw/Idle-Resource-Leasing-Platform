export declare const notificationService: {
    getNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            message: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            data: string | null;
            userId: string;
            type: string;
            isRead: boolean;
            actionUrl: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createNotification(notificationData: {
        userId: string;
        type: string;
        title: string;
        content: string;
        data?: any;
        actionUrl?: string;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        data: string | null;
        userId: string;
        type: string;
        isRead: boolean;
        actionUrl: string | null;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    sendOrderNotification(orderId: string, type: string, data: any): Promise<never[]>;
};
//# sourceMappingURL=notificationService.d.ts.map