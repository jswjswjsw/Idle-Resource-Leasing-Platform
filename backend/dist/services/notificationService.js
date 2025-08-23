"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const database_1 = require("../config/database"); // 统一Prisma实例
exports.notificationService = {
    // 获取通知列表
    async getNotifications(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            database_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.notification.count({ where: { userId } })
        ]);
        return {
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },
    // 创建通知
    async createNotification(notificationData) {
        const { userId, type, title, content, data, actionUrl } = notificationData;
        const notification = await database_1.prisma.notification.create({
            data: {
                userId,
                type: typeof type === 'string' ? 'SYSTEM' : type,
                title,
                message: content,
                data: data ? JSON.stringify(data) : null,
                actionUrl,
                isRead: false
            }
        });
        return notification;
    },
    // 标记通知为已读
    async markAsRead(notificationId, userId) {
        await database_1.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
        return { success: true };
    },
    // 标记所有通知为已读
    async markAllAsRead(userId) {
        await database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        return { success: true };
    },
    // 获取未读通知数量
    async getUnreadCount(userId) {
        const count = await database_1.prisma.notification.count({
            where: { userId, isRead: false }
        });
        return count;
    },
    // 发送订单相关通知
    async sendOrderNotification(orderId, type, data) {
        // 简化版本，返回空数组
        return [];
    }
};
//# sourceMappingURL=notificationService.js.map