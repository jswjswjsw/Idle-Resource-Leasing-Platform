"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedUsers = exports.SocketManager = exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chatService_1 = require("@/services/chatService");
const notificationService_1 = require("@/services/notificationService");
const logger_1 = require("@/middleware/logger");
class SocketManager {
    constructor(server) {
        this.connectedUsers = new Map(); // userId -> socketId
        this.socketToUser = new Map(); // socketId -> userId
        this.userStatus = new Map(); // userId -> status
        this.io = new socket_io_1.Server(server, {
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
        logger_1.winstonLogger.info('WebSocket 服务器已启动');
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    logger_1.winstonLogger.warn('WebSocket 连接被拒绝：未提供认证令牌', {
                        socketId: socket.id,
                        ip: socket.handshake.address
                    });
                    return next(new Error('未提供认证令牌'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.username = decoded.username || '未知用户';
                socket.userAgent = socket.handshake.headers['user-agent'];
                socket.ip = socket.handshake.address;
                logger_1.winstonLogger.info('WebSocket 认证成功', {
                    userId: socket.userId,
                    username: socket.username,
                    socketId: socket.id,
                    ip: socket.ip
                });
                next();
            }
            catch (error) {
                logger_1.winstonLogger.warn('WebSocket 认证失败', {
                    error: error.message,
                    socketId: socket.id,
                    ip: socket.handshake.address
                });
                next(new Error('认证失败'));
            }
        });
    }
    setupSocketHandlers() {
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
    registerUser(userId, socketId) {
        this.connectedUsers.set(userId, socketId);
        this.socketToUser.set(socketId, userId);
    }
    unregisterUser(userId, socketId) {
        const currentSocketId = this.connectedUsers.get(userId);
        if (currentSocketId === socketId) {
            this.connectedUsers.delete(userId);
        }
        this.socketToUser.delete(socketId);
    }
    async initializeUserData(socket) {
        try {
            // 获取未读消息数量
            const unreadMessages = await chatService_1.chatService.getUnreadCount(socket.userId);
            // 获取未读通知数量
            const unreadNotifications = await notificationService_1.notificationService.getUnreadCount(socket.userId);
            socket.emit('initial_data', {
                unreadMessages,
                unreadNotifications,
                online: true
            });
        }
        catch (error) {
            console.error('初始化用户数据错误:', error);
        }
    }
    setupMessageHandlers(socket) {
        // 发送消息
        socket.on('send_message', async (data) => {
            try {
                const message = await chatService_1.chatService.sendMessage({
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
                    const unreadCount = await chatService_1.chatService.getUnreadCount(data.receiverId);
                    this.io.to(receiverSocketId).emit('unread_messages', unreadCount);
                }
                // 确认发送成功
                socket.emit('message_sent', message);
            }
            catch (error) {
                socket.emit('error', { type: 'send_message', error: '发送消息失败' });
            }
        });
        // 获取聊天记录
        socket.on('get_chat_history', async (data) => {
            try {
                const messages = await chatService_1.chatService.getChatMessages(data.orderId);
                socket.emit('chat_history', messages);
            }
            catch (error) {
                socket.emit('error', { type: 'get_chat_history', error: '获取聊天记录失败' });
            }
        });
        // 获取用户聊天订单
        socket.on('get_chat_orders', async () => {
            try {
                const orders = await chatService_1.chatService.getUserChatOrders(socket.userId);
                socket.emit('chat_orders', orders);
            }
            catch (error) {
                socket.emit('error', { type: 'get_chat_orders', error: '获取聊天订单失败' });
            }
        });
        // 标记消息已读
        socket.on('mark_messages_read', async (messageIds) => {
            try {
                for (const messageId of messageIds) {
                    await chatService_1.chatService.markAsRead(messageId, socket.userId);
                }
                // 更新未读数量
                const unreadCount = await chatService_1.chatService.getUnreadCount(socket.userId);
                socket.emit('unread_messages', unreadCount);
            }
            catch (error) {
                socket.emit('error', { type: 'mark_read', error: '标记已读失败' });
            }
        });
    }
    setupNotificationHandlers(socket) {
        // 获取通知列表
        socket.on('get_notifications', async (data) => {
            try {
                const notifications = await notificationService_1.notificationService.getNotifications(socket.userId, {
                    page: data.page || 1,
                    limit: data.limit || 20
                });
                socket.emit('notifications', notifications);
            }
            catch (error) {
                socket.emit('error', { type: 'get_notifications', error: '获取通知失败' });
            }
        });
        // 标记通知已读
        socket.on('mark_notification_read', async (notificationId) => {
            try {
                await notificationService_1.notificationService.markAsRead(notificationId, socket.userId);
                // 更新未读数量
                const unreadCount = await notificationService_1.notificationService.getUnreadCount(socket.userId);
                socket.emit('unread_notifications', unreadCount);
            }
            catch (error) {
                socket.emit('error', { type: 'mark_notification_read', error: '标记通知已读失败' });
            }
        });
        // 标记所有通知已读
        socket.on('mark_all_notifications_read', async () => {
            try {
                await notificationService_1.notificationService.markAllAsRead(socket.userId);
                // 更新未读数量
                const unreadCount = await notificationService_1.notificationService.getUnreadCount(socket.userId);
                socket.emit('unread_notifications', unreadCount);
            }
            catch (error) {
                socket.emit('error', { type: 'mark_all_read', error: '标记所有已读失败' });
            }
        });
    }
    setupSystemHandlers(socket) {
        // 心跳检测
        socket.on('ping', () => {
            socket.emit('pong');
        });
        // 获取在线用户
        socket.on('get_online_users', () => {
            socket.emit('online_users', Array.from(this.connectedUsers.keys()));
        });
        // 用户状态更新
        socket.on('update_status', (status) => {
            this.sendUserStatus(socket.userId, status);
        });
    }
    sendUserStatus(userId, status) {
        this.io.emit('user_status', {
            userId,
            status,
            timestamp: new Date()
        });
    }
    // 发送实时消息给特定用户
    async sendMessageToUser(userId, message) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('new_message', message);
        }
    }
    // 发送通知给特定用户
    async sendNotificationToUser(userId, notification) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('new_notification', notification);
        }
    }
    // 广播消息给所有用户
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    // 发送订单相关通知
    async sendOrderNotification(orderId, type, data) {
        const notifications = await notificationService_1.notificationService.sendOrderNotification(orderId, type, data);
        // 发送实时通知给相关用户
        notifications.forEach((notification) => {
            this.sendNotificationToUser(notification.userId, notification);
        });
    }
    // 获取在线用户数量
    getOnlineUserCount() {
        return this.connectedUsers.size;
    }
    // 获取在线用户列表
    getOnlineUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    // 检查用户是否在线
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    // 获取服务器状态
    getServerStats() {
        return {
            onlineUsers: this.getOnlineUserCount(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date()
        };
    }
}
exports.SocketManager = SocketManager;
const setupSocket = (server) => {
    return new SocketManager(server);
};
exports.setupSocket = setupSocket;
const getConnectedUsers = () => {
    // 这个方法现在需要访问SocketManager实例
    // 将在主服务器中维护实例引用
    return [];
};
exports.getConnectedUsers = getConnectedUsers;
//# sourceMappingURL=socket.js.map