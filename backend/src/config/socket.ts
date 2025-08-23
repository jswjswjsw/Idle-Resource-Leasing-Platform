import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { chatService } from '@/services/chatService';
import { notificationService } from '@/services/notificationService';
import { winstonLogger } from '@/middleware/logger';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/config/cache';

interface AuthenticatedSocket {
  userId: string;
  username: string;
  userAgent?: string;
  ip?: string;
}

declare module 'socket.io' {
  interface Socket {
    userId: string;
    username: string;
    userAgent?: string;
    ip?: string;
  }
}

interface MessageData {
  orderId: string;
  receiverId: string;
  content: string;
  type?: string;
  metadata?: any;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  socketId?: string;
}

class SocketManager {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId
  private userStatus: Map<string, UserStatus> = new Map(); // userId -> status
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupSocketHandlers();
    this.startHeartbeat();

    winstonLogger.info('WebSocket 服务器已启动');
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          winstonLogger.warn('WebSocket 连接被拒绝：未提供认证令牌', {
            socketId: socket.id,
            ip: socket.handshake.address
          });
          return next(new Error('未提供认证令牌'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId;
        socket.username = decoded.username || '未知用户';
        socket.userAgent = socket.handshake.headers['user-agent'];
        socket.ip = socket.handshake.address;
        
        winstonLogger.info('WebSocket 认证成功', {
          userId: socket.userId,
          username: socket.username,
          socketId: socket.id,
          ip: socket.ip
        });
        
        next();
      } catch (error) {
        winstonLogger.warn('WebSocket 认证失败', {
          error: error.message,
          socketId: socket.id,
          ip: socket.handshake.address
        });
        next(new Error('认证失败'));
      }
    });
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`用户 ${socket.username} (${socket.userId}) 已连接 - ${socket.id}`);

      // 用户认证和注册
      this.registerUser(socket.userId, socket.id);

      // 加入用户房间
      socket.join(`user_${socket.userId}`);

      // 发送用户状态
      this.sendUserStatus(socket.userId, 'online');

      // 获取未读消息和通知
      this.initializeUserData(socket);

      // 监听消息事件
      this.setupMessageHandlers(socket);

      // 监听通知事件
      this.setupNotificationHandlers(socket);

      // 监听系统事件
      this.setupSystemHandlers(socket);

      // 断开连接处理
      socket.on('disconnect', () => {
        console.log(`用户 ${socket.username} (${socket.userId}) 已断开连接`);
        this.unregisterUser(socket.userId, socket.id);
        this.sendUserStatus(socket.userId, 'offline');
      });
    });
  }

  private registerUser(userId: string, socketId: string) {
    this.connectedUsers.set(userId, socketId);
    this.socketToUser.set(socketId, userId);
  }

  private unregisterUser(userId: string, socketId: string) {
    const currentSocketId = this.connectedUsers.get(userId);
    if (currentSocketId === socketId) {
      this.connectedUsers.delete(userId);
    }
    this.socketToUser.delete(socketId);
  }

  private async initializeUserData(socket: any) {
    try {
      // 获取未读消息数量
      const unreadMessages = await chatService.getUnreadCount(socket.userId);
      
      // 获取未读通知数量
      const unreadNotifications = await notificationService.getUnreadCount(socket.userId);

      socket.emit('initial_data', {
        unreadMessages,
        unreadNotifications,
        online: true
      });
    } catch (error) {
      console.error('初始化用户数据错误:', error);
    }
  }

  private setupMessageHandlers(socket: any) {
    // 发送消息
    socket.on('send_message', async (data: MessageData) => {
      try {
        const message = await chatService.sendMessage({
          orderId: data.orderId,
          content: data.content,
          type: data.type || 'TEXT',
          senderId: socket.userId,
          receiverId: data.receiverId
        });

        // 发送给接收者
        const receiverSocketId = this.connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('new_message', message);
          
          // 更新未读数量
          const unreadCount = await chatService.getUnreadCount(data.receiverId);
          this.io.to(receiverSocketId).emit('unread_messages', unreadCount);
        }

        // 确认发送成功
        socket.emit('message_sent', message);

      } catch (error) {
        socket.emit('error', { type: 'send_message', error: '发送消息失败' });
      }
    });

    // 获取聊天记录
    socket.on('get_chat_history', async (data: { orderId: string; page?: number; limit?: number }) => {
      try {
        const messages = await chatService.getChatMessages(data.orderId);
        socket.emit('chat_history', messages);
      } catch (error) {
        socket.emit('error', { type: 'get_chat_history', error: '获取聊天记录失败' });
      }
    });

    // 获取用户聊天订单
    socket.on('get_chat_orders', async () => {
      try {
        const orders = await chatService.getUserChatOrders(socket.userId);
        socket.emit('chat_orders', orders);
      } catch (error) {
        socket.emit('error', { type: 'get_chat_orders', error: '获取聊天订单失败' });
      }
    });

    // 标记消息已读
    socket.on('mark_messages_read', async (messageIds: string[]) => {
      try {
        for (const messageId of messageIds) {
          await chatService.markAsRead(messageId, socket.userId);
        }

        // 更新未读数量
        const unreadCount = await chatService.getUnreadCount(socket.userId);
        socket.emit('unread_messages', unreadCount);

      } catch (error) {
        socket.emit('error', { type: 'mark_read', error: '标记已读失败' });
      }
    });
  }

  private setupNotificationHandlers(socket: any) {
    // 获取通知列表
    socket.on('get_notifications', async (data: { page?: number; limit?: number }) => {
      try {
        const notifications = await notificationService.getNotifications(socket.userId, {
          page: data.page || 1,
          limit: data.limit || 20
        });
        socket.emit('notifications', notifications);
      } catch (error) {
        socket.emit('error', { type: 'get_notifications', error: '获取通知失败' });
      }
    });

    // 标记通知已读
    socket.on('mark_notification_read', async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId, socket.userId);
        
        // 更新未读数量
        const unreadCount = await notificationService.getUnreadCount(socket.userId);
        socket.emit('unread_notifications', unreadCount);

      } catch (error) {
        socket.emit('error', { type: 'mark_notification_read', error: '标记通知已读失败' });
      }
    });

    // 标记所有通知已读
    socket.on('mark_all_notifications_read', async () => {
      try {
        await notificationService.markAllAsRead(socket.userId);
        
        // 更新未读数量
        const unreadCount = await notificationService.getUnreadCount(socket.userId);
        socket.emit('unread_notifications', unreadCount);

      } catch (error) {
        socket.emit('error', { type: 'mark_all_read', error: '标记所有已读失败' });
      }
    });
  }

  private setupSystemHandlers(socket: any) {
    // 心跳检测
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // 获取在线用户
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(this.connectedUsers.keys()));
    });

    // 用户状态更新
    socket.on('update_status', (status: string) => {
      this.sendUserStatus(socket.userId, status);
    });
  }

  private sendUserStatus(userId: string, status: string) {
    this.io.emit('user_status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // 发送实时消息给特定用户
  public async sendMessageToUser(userId: string, message: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_message', message);
    }
  }

  // 发送通知给特定用户
  public async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
    }
  }

  // 广播消息给所有用户
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // 发送订单相关通知
  public async sendOrderNotification(orderId: string, type: string, data: any) {
    const notifications = await notificationService.sendOrderNotification(orderId, type, data);
    
    // 发送实时通知给相关用户
    notifications.forEach((notification: any) => {
      this.sendNotificationToUser(notification.userId, notification);
    });
  }

  // 获取在线用户数量
  public getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  // 获取在线用户列表
  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // 检查用户是否在线
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // 获取服务器状态
  public getServerStats() {
    return {
      onlineUsers: this.getOnlineUserCount(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
  }
}

export const setupSocket = (server: HttpServer) => {
  return new SocketManager(server);
};

export { SocketManager };

export const getConnectedUsers = () => {
  // 这个方法现在需要访问SocketManager实例
  // 将在主服务器中维护实例引用
  return [];
};