// import { PrismaClient } from '@prisma/client'; // 已弃用：统一使用 config/database 导出的 prisma 实例
import { prisma } from '../config/database'; // 复用统一的 Prisma 客户端

/**
 * 聊天服务（订单会话相关）
 * - 统一复用全局 prisma 实例，避免重复实例化与类型问题
 * - 提供消息获取、发送、已读标记、未读数、最新消息、参与订单列表等能力
 */

// const prisma = new PrismaClient(); // 移除：不再本地实例化，防止编辑器误报与多实例问题

export const chatService = {
  // 获取订单聊天记录
  async getChatMessages(orderId: string) {
    const messages = await prisma.message.findMany({
      where: { orderId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return messages;
  },

  // 发送聊天消息
  async sendMessage(data: {
    orderId: string;
    content: string;
    type?: string;
    senderId: string;
    receiverId: string;
  }) {
    const { orderId, content, type = 'text', senderId, receiverId } = data;

    // 创建消息
    const message = await prisma.message.create({
      data: {
        orderId,
        content,
        type: type ? (typeof type === 'string' ? 'TEXT' : type) : 'TEXT', // 将字符串类型统一映射为枚举字符串
        senderId,
        receiverId,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    return message;
  },

  // 标记消息为已读
  async markAsRead(messageId: string, userId: string) {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true }
    });

    return { success: true };
  },

  // 获取未读消息数量
  async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    return count;
  },

  // 获取订单最新的消息
  async getLatestMessage(orderId: string) {
    const message = await prisma.message.findFirst({
      where: { orderId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return message;
  },

  // 获取用户参与的订单列表
  async getUserChatOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { renterId: userId },
          { ownerId: userId }
        ]
      },
      include: {
        resource: {
          select: {
            title: true,
            images: true,
            owner: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        renter: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return orders;
  }
};