import { ErrorFactory } from '@/utils/AppError';
import { winstonLogger } from '@/middleware/logger';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/config/cache';
import { emailService } from '@/services/emailService';
import { sendSms } from '@/services/smsService';

/**
 * 通知类型枚举
 */
export enum NotificationType {
  SYSTEM = 'system',
  ORDER = 'order',
  MESSAGE = 'message',
  PAYMENT = 'payment',
  USER = 'user',
  SECURITY = 'security'
}

/**
 * 通知优先级枚举
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 通知渠道枚举
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

/**
 * 通知状态枚举
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
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
  expiresIn?: number; // 过期时间（秒）
}

/**
 * 通知服务类
 */
export class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化通知模板
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'welcome',
        type: NotificationType.USER,
        title: '欢迎加入交易平台',
        content: '欢迎您，{{username}}！感谢注册我们的交易平台，开始您的交易之旅吧！',
        variables: ['username'],
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        priority: NotificationPriority.NORMAL
      },
      {
        id: 'order_created',
        type: NotificationType.ORDER,
        title: '订单创建成功',
        content: '您的订单 {{orderNumber}} 已创建成功，订单金额：{{amount}}元',
        variables: ['orderNumber', 'amount'],
        channels: [NotificationChannel.IN_APP],
        priority: NotificationPriority.NORMAL
      },
      {
        id: 'order_paid',
        type: NotificationType.ORDER,
        title: '订单支付成功',
        content: '您的订单 {{orderNumber}} 已支付成功，金额：{{amount}}元',
        variables: ['orderNumber', 'amount'],
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority: NotificationPriority.HIGH
      },
      {
        id: 'payment_success',
        type: NotificationType.PAYMENT,
        title: '支付成功',
        content: '您的支付已成功，交易号：{{tradeNo}}，金额：{{amount}}元',
        variables: ['tradeNo', 'amount'],
        channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
        priority: NotificationPriority.HIGH
      },
      {
        id: 'payment_failed',
        type: NotificationType.PAYMENT,
        title: '支付失败',
        content: '您的支付失败，请检查支付方式或联系客服。订单号：{{orderNumber}}',
        variables: ['orderNumber'],
        channels: [NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH
      },
      {
        id: 'new_message',
        type: NotificationType.MESSAGE,
        title: '新消息',
        content: '您收到来自 {{senderName}} 的新消息',
        variables: ['senderName'],
        channels: [NotificationChannel.IN_APP],
        priority: NotificationPriority.NORMAL
      },
      {
        id: 'security_alert',
        type: NotificationType.SECURITY,
        title: '安全提醒',
        content: '检测到您的账户在 {{location}} 登录，如非本人操作请立即修改密码',
        variables: ['location'],
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority: NotificationPriority.URGENT
      },
      {
        id: 'password_changed',
        type: NotificationType.SECURITY,
        title: '密码已修改',
        content: '您的账户密码已成功修改，修改时间：{{time}}',
        variables: ['time'],
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        priority: NotificationPriority.HIGH
      },
      {
        id: 'system_maintenance',
        type: NotificationType.SYSTEM,
        title: '系统维护通知',
        content: '系统将于 {{startTime}} 至 {{endTime}} 进行维护，期间服务可能中断',
        variables: ['startTime', 'endTime'],
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        priority: NotificationPriority.HIGH
      }
    ];\n\n    templates.forEach(template => {\n      this.templates.set(template.id, template);\n    });\n  }\n\n  /**\n   * 发送通知\n   */\n  async sendNotification(request: SendNotificationRequest): Promise<string[]> {\n    const userIds = Array.isArray(request.userId) ? request.userId : [request.userId];\n    const notificationIds: string[] = [];\n\n    for (const userId of userIds) {\n      try {\n        const notification = await this.createNotification(userId, request);\n        await this.deliverNotification(notification);\n        notificationIds.push(notification.id);\n      } catch (error) {\n        winstonLogger.error('发送通知失败', {\n          userId,\n          type: request.type,\n          error: error.message\n        });\n      }\n    }\n\n    return notificationIds;\n  }\n\n  /**\n   * 获取用户通知列表\n   */\n  async getNotifications(\n    userId: string,\n    options: {\n      page?: number;\n      limit?: number;\n      type?: NotificationType;\n      status?: NotificationStatus;\n      unreadOnly?: boolean;\n    } = {}\n  ): Promise<{notifications: Notification[]; total: number; unreadCount: number }> {\n    const {\n      page = 1,\n      limit = 20,\n      type,\n      status,\n      unreadOnly = false\n    } = options;\n\n    const userNotificationsKey = `${CACHE_KEYS.NOTIFICATIONS}${userId}`;\n    let notifications = await cache.get(userNotificationsKey) || [];\n\n    // 过滤过期通知\n    notifications = notifications.filter((n: Notification) => !n.expiresAt || n.expiresAt > new Date());\n\n    // 应用筛选条件\n    if (type) {\n      notifications = notifications.filter((n: Notification) => n.type === type);\n    }\n\n    if (status) {\n      notifications = notifications.filter((n: Notification) => n.status === status);\n    }\n\n    if (unreadOnly) {\n      notifications = notifications.filter((n: Notification) => !n.readAt);\n    }\n\n    const total = notifications.length;\n    const unreadCount = notifications.filter((n: Notification) => !n.readAt).length;\n\n    // 分页\n    const startIndex = (page - 1) * limit;\n    const paginatedNotifications = notifications.slice(startIndex, startIndex + limit);\n\n    return {\n      notifications: paginatedNotifications,\n      total,\n      unreadCount\n    };\n  }\n\n  /**\n   * 创建通知\n   */\n  private async createNotification(\n    userId: string, \n    request: SendNotificationRequest\n  ): Promise<Notification> {\n    const notificationId = this.generateNotificationId();\n    const now = new Date();\n    \n    let { title, content, channels, priority } = request;\n    \n    // 如果使用模板\n    if (request.templateId) {\n      const template = this.templates.get(request.templateId);\n      if (!template) {\n        throw ErrorFactory.badRequest('通知模板不存在');\n      }\n      \n      title = this.renderTemplate(template.title, request.templateData || {});\n      content = this.renderTemplate(template.content, request.templateData || {});\n      channels = template.channels;\n      priority = template.priority;\n    }\n    \n    const notification: Notification = {\n      id: notificationId,\n      userId,\n      type: request.type,\n      priority: priority || NotificationPriority.NORMAL,\n      title,\n      content,\n      data: request.data,\n      channels: channels || [NotificationChannel.IN_APP],\n      status: NotificationStatus.PENDING,\n      createdAt: now,\n      updatedAt: now,\n      expiresAt: request.expiresIn ? new Date(now.getTime() + request.expiresIn * 1000) : undefined\n    };\n    \n    // 保存通知到缓存\n    await this.saveNotification(notification);\n    \n    winstonLogger.info('通知创建成功', {\n      notificationId,\n      userId,\n      type: request.type,\n      priority\n    });\n    \n    return notification;\n  }\n\n  /**\n   * 投递通知\n   */\n  private async deliverNotification(notification: Notification): Promise<void> {\n    const deliveryPromises: Promise<void>[] = [];\n    \n    for (const channel of notification.channels) {\n      switch (channel) {\n        case NotificationChannel.IN_APP:\n          deliveryPromises.push(this.deliverInAppNotification(notification));\n          break;\n        case NotificationChannel.EMAIL:\n          deliveryPromises.push(this.deliverEmailNotification(notification));\n          break;\n        case NotificationChannel.SMS:\n          deliveryPromises.push(this.deliverSmsNotification(notification));\n          break;\n        case NotificationChannel.PUSH:\n          deliveryPromises.push(this.deliverPushNotification(notification));\n          break;\n      }\n    }\n    \n    // 等待所有渠道投递完成\n    await Promise.allSettled(deliveryPromises);\n    \n    // 更新通知状态\n    notification.status = NotificationStatus.SENT;\n    notification.updatedAt = new Date();\n    await this.saveNotification(notification);\n  }\n\n  /**\n   * 投递应用内通知\n   */\n  private async deliverInAppNotification(notification: Notification): Promise<void> {\n    try {\n      // 将通知添加到用户的通知列表\n      const userNotificationsKey = `${CACHE_KEYS.NOTIFICATIONS}${notification.userId}`;\n      const userNotifications = await cache.get(userNotificationsKey) || [];\n      \n      userNotifications.unshift(notification);\n      \n      // 保持最多1000条通知\n      if (userNotifications.length > 1000) {\n        userNotifications.splice(1000);\n      }\n      \n      await cache.set(userNotificationsKey, userNotifications, CACHE_TTL.VERY_LONG);\n      \n      // 更新未读计数\n      await this.updateUnreadCount(notification.userId, 1);\n      \n      winstonLogger.debug('应用内通知投递成功', {\n        notificationId: notification.id,\n        userId: notification.userId\n      });\n    } catch (error) {\n      winstonLogger.error('应用内通知投递失败', {\n        notificationId: notification.id,\n        userId: notification.userId,\n        error: error.message\n      });\n    }\n  }\n\n  /**\n   * 投递邮件通知\n   */\n  private async deliverEmailNotification(notification: Notification): Promise<void> {\n    try {\n      // 这里需要根据userId获取用户邮箱\n      // 简化处理，假设可以从缓存或数据库获取\n      const userEmail = await this.getUserEmail(notification.userId);\n      \n      if (userEmail) {\n        await emailService.sendNotification(\n          userEmail,\n          notification.title,\n          notification.content,\n          notification.data\n        );\n        \n        winstonLogger.debug('邮件通知投递成功', {\n          notificationId: notification.id,\n          userId: notification.userId,\n          email: userEmail.replace(/(.{3}).+(.{3}@.+)/, '$1***$2')\n        });\n      }\n    } catch (error) {\n      winstonLogger.error('邮件通知投递失败', {\n        notificationId: notification.id,\n        userId: notification.userId,\n        error: error.message\n      });\n    }\n  }\n\n  /**\n   * 投递短信通知\n   */\n  private async deliverSmsNotification(notification: Notification): Promise<void> {\n    try {\n      const userPhone = await this.getUserPhone(notification.userId);\n      \n      if (userPhone) {\n        await sendSms({\n          phone: userPhone,\n          template: 'notification',\n          params: {\n            title: notification.title,\n            content: notification.content\n          }\n        });\n        \n        winstonLogger.debug('短信通知投递成功', {\n          notificationId: notification.id,\n          userId: notification.userId,\n          phone: userPhone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2')\n        });\n      }\n    } catch (error) {\n      winstonLogger.error('短信通知投递失败', {\n        notificationId: notification.id,\n        userId: notification.userId,\n        error: error.message\n      });\n    }\n  }\n\n  /**\n   * 投递推送通知\n   */\n  private async deliverPushNotification(notification: Notification): Promise<void> {\n    try {\n      // 这里可以集成第三方推送服务（如极光推送、个推等）\n      // 目前暂时记录日志\n      winstonLogger.debug('推送通知投递（暂未实现）', {\n        notificationId: notification.id,\n        userId: notification.userId\n      });\n    } catch (error) {\n      winstonLogger.error('推送通知投递失败', {\n        notificationId: notification.id,\n        userId: notification.userId,\n        error: error.message\n      });\n    }\n  }\n\n  /**\n   * 标记通知为已读\n   */\n  async markAsRead(notificationId: string, userId: string): Promise<void> {\n    const userNotificationsKey = `${CACHE_KEYS.NOTIFICATIONS}${userId}`;\n    const notifications = await cache.get(userNotificationsKey) || [];\n    \n    const notification = notifications.find((n: Notification) => n.id === notificationId);\n    if (!notification) {\n      throw ErrorFactory.notFound('通知不存在');\n    }\n    \n    if (!notification.readAt) {\n      notification.readAt = new Date();\n      notification.status = NotificationStatus.READ;\n      notification.updatedAt = new Date();\n      \n      await cache.set(userNotificationsKey, notifications, CACHE_TTL.VERY_LONG);\n      await this.updateUnreadCount(userId, -1);\n      \n      winstonLogger.debug('通知已标记为已读', {\n        notificationId,\n        userId\n      });\n    }\n  }\n\n  /**\n   * 标记所有通知为已读\n   */\n  async markAllAsRead(userId: string): Promise<number> {\n    const userNotificationsKey = `${CACHE_KEYS.NOTIFICATIONS}${userId}`;\n    const notifications = await cache.get(userNotificationsKey) || [];\n    \n    let markedCount = 0;\n    const now = new Date();\n    \n    notifications.forEach((notification: Notification) => {\n      if (!notification.readAt) {\n        notification.readAt = now;\n        notification.status = NotificationStatus.READ;\n        notification.updatedAt = now;\n        markedCount++;\n      }\n    });\n    \n    if (markedCount > 0) {\n      await cache.set(userNotificationsKey, notifications, CACHE_TTL.VERY_LONG);\n      await this.setUnreadCount(userId, 0);\n      \n      winstonLogger.info('所有通知已标记为已读', {\n        userId,\n        markedCount\n      });\n    }\n    \n    return markedCount;\n  }\n\n  /**\n   * 获取未读通知数量\n   */\n  async getUnreadCount(userId: string): Promise<number> {\n    const countKey = `${CACHE_KEYS.NOTIFICATIONS}unread:${userId}`;\n    const count = await cache.get(countKey);\n    return count || 0;\n  }\n\n  /**\n   * 生成通知ID\n   */\n  private generateNotificationId(): string {\n    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n  }\n\n  /**\n   * 渲染模板\n   */\n  private renderTemplate(template: string, data: Record<string, any>): string {\n    let rendered = template;\n    \n    Object.entries(data).forEach(([key, value]) => {\n      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');\n      rendered = rendered.replace(placeholder, String(value));\n    });\n    \n    return rendered;\n  }\n\n  /**\n   * 保存通知\n   */\n  private async saveNotification(notification: Notification): Promise<void> {\n    const notificationKey = `${CACHE_KEYS.NOTIFICATIONS}single:${notification.id}`;\n    await cache.set(notificationKey, notification, CACHE_TTL.VERY_LONG);\n  }\n\n  /**\n   * 更新未读计数\n   */\n  private async updateUnreadCount(userId: string, delta: number): Promise<void> {\n    const countKey = `${CACHE_KEYS.NOTIFICATIONS}unread:${userId}`;\n    const currentCount = await cache.get(countKey) || 0;\n    const newCount = Math.max(0, currentCount + delta);\n    await cache.set(countKey, newCount, CACHE_TTL.VERY_LONG);\n  }\n\n  /**\n   * 设置未读计数\n   */\n  private async setUnreadCount(userId: string, count: number): Promise<void> {\n    const countKey = `${CACHE_KEYS.NOTIFICATIONS}unread:${userId}`;\n    await cache.set(countKey, Math.max(0, count), CACHE_TTL.VERY_LONG);\n  }\n\n  /**\n   * 获取用户邮箱（简化实现）\n   */\n  private async getUserEmail(userId: string): Promise<string | null> {\n    // 这里应该从数据库或缓存获取用户邮箱\n    // 简化实现，返回null\n    return null;\n  }\n\n  /**\n   * 获取用户手机号（简化实现）\n   */\n  private async getUserPhone(userId: string): Promise<string | null> {\n    // 这里应该从数据库或缓存获取用户手机号\n    // 简化实现，返回null\n    return null;\n  }\n}

// 导出服务实例
export const notificationService = new NotificationService();