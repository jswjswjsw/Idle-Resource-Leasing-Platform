import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification } from '../hooks/useNotification';
import { Notification } from '../types';

/**
 * 通知上下文接口定义
 * 定义通知相关的状态和方法
 */
interface NotificationContextType {
  // 状态
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // 方法
  getNotifications: (page?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // 计算属性
  hasMore: boolean;
  isEmpty: boolean;
}

/**
 * 通知上下文
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * 通知Provider组件属性接口
 */
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * 通知Provider组件
 * 为整个应用提供通知状态管理
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // 使用通知Hook获取所有通知相关功能
  const notificationData = useNotification();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * 使用通知上下文的Hook
 * 提供类型安全的通知上下文访问
 * @returns 通知上下文数据
 * @throws 如果在NotificationProvider外部使用则抛出错误
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext必须在NotificationProvider内部使用');
  }
  
  return context;
};

export default NotificationContext;