/**
 * 通知类型枚举
 */
export declare enum NotificationType {
    SYSTEM = "system",
    ORDER = "order",
    MESSAGE = "message",
    PAYMENT = "payment",
    USER = "user",
    SECURITY = "security"
}
/**
 * 通知优先级枚举
 */
export declare enum NotificationPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
/**
 * 通知渠道枚举
 */
export declare enum NotificationChannel {
    IN_APP = "in_app",
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push"
}
/**
 * 通知状态枚举
 */
export declare enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed"
}
/**
 * 通知接口
 */
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    content: string;
    data?: any;
    channels: NotificationChannel[];
    status: NotificationStatus;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
/**
 * 通知模板接口
 */
export interface NotificationTemplate {
    id: string;
    type: NotificationType;
    title: string;
    content: string;
    variables: string[];
    channels: NotificationChannel[];
    priority: NotificationPriority;
}
/**
 * 发送通知请求接口
 */
export interface SendNotificationRequest {
    userId: string | string[];
    type: NotificationType;
    title: string;
    content: string;
    data?: any;
    channels?: NotificationChannel[];
    priority?: NotificationPriority;
    templateId?: string;
    templateData?: Record<string, any>;
    expiresIn?: number;
}
/**
 * 通知服务类
 */
export declare class NotificationService {
    private templates;
    constructor();
    /**
     * 初始化通知模板
     */
    private initializeTemplates;
    n: any;
    n: any; /**\n   * 发送通知\n   */
    n: any;
    sendNotification(request: SendNotificationRequest): Promise<string[]>;
    n: any;
    n: any; /**\n   * 获取用户通知列表\n   */
    n: any;
    getNotifications(n: any, userId: string, n: any, options: {}, n: any, page?: number, n: any, limit?: number, n: any, type?: NotificationType, n: any, status?: NotificationStatus, n: any, unreadOnly?: boolean, n: any): any;
}
//# sourceMappingURL=notificationService.d.ts.map