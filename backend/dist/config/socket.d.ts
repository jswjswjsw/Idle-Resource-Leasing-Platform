import { Server as HttpServer } from 'http';
declare module 'socket.io' {
    interface Socket {
        userId: string;
        username: string;
    }
}
declare class SocketManager {
    private io;
    private connectedUsers;
    private socketToUser;
    constructor(server: HttpServer);
    private setupMiddleware;
    private setupSocketHandlers;
    private registerUser;
    private unregisterUser;
    private initializeUserData;
    private setupMessageHandlers;
    private setupNotificationHandlers;
    private setupSystemHandlers;
    private sendUserStatus;
    sendMessageToUser(userId: string, message: any): Promise<void>;
    sendNotificationToUser(userId: string, notification: any): Promise<void>;
    broadcast(event: string, data: any): void;
    sendOrderNotification(orderId: string, type: string, data: any): Promise<void>;
    getOnlineUserCount(): number;
    getOnlineUsers(): string[];
    isUserOnline(userId: string): boolean;
    getServerStats(): {
        onlineUsers: number;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        timestamp: Date;
    };
}
export declare const setupSocket: (server: HttpServer) => SocketManager;
export { SocketManager };
export declare const getConnectedUsers: () => never[];
//# sourceMappingURL=socket.d.ts.map