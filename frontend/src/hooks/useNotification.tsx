import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { notificationService } from '../services/api';
import { Notification } from '../types';
import { useAuth } from './useAuth';

/**
 * 通知管理Hook
 * 提供通知列表管理、实时通知接收、未读数量统计等功能
 */
export const useNotification = () => {
  // 通知状态管理
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const { user, token } = useAuth();

  /**
   * 初始化WebSocket连接
   */
  const initializeSocket = useCallback(() => {
    if (!token || !user) return;

    // 创建Socket连接
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3002', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // 连接成功事件
    newSocket.on('connect', () => {
      console.log('通知Socket连接成功');
    });

    // 接收新通知
    newSocket.on('new_notification', (notification: Notification) => {
      // 添加到通知列表
      setNotifications(prev => [notification, ...prev]);
      // 更新未读数量
      setUnreadCount(prev => prev + 1);
      // 显示Toast提示
      toast.success(notification.title, {
        duration: 4000,
        position: 'top-right'
      });
    });

    // 接收未读数量更新
    newSocket.on('unread_notifications', (count: number) => {
      setUnreadCount(count);
    });

    // 接收通知列表
    newSocket.on('notifications', (data: {
      data: Notification[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }) => {
      if (data.pagination.page === 1) {
        // 第一页，替换数据
        setNotifications(data.data);
      } else {
        // 后续页，追加数据
        setNotifications(prev => [...prev, ...data.data]);
      }
      setPagination(data.pagination);
      setLoading(false);
    });

    // 错误处理
    newSocket.on('error', (error: { type: string; error: string }) => {
      console.error('通知Socket错误:', error);
      toast.error(error.error || '通知服务连接失败');
      setLoading(false);
    });

    // 连接断开事件
    newSocket.on('disconnect', () => {
      console.log('通知Socket连接断开');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  /**
   * 获取通知列表
   */
  const getNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!socket) return;

    setLoading(true);
    
    try {
      // 通过Socket请求通知列表
      socket.emit('get_notifications', {
        page,
        limit: pagination.limit
      });
    } catch (error) {
      console.error('获取通知列表失败:', error);
      toast.error('获取通知列表失败');
      setLoading(false);
    }
  }, [socket, pagination.limit]);

  /**
   * 标记通知为已读
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!socket) return;

    try {
      // 通过Socket标记已读
      socket.emit('mark_notification_read', notificationId);
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('标记通知已读失败:', error);
      toast.error('标记通知已读失败');
    }
  }, [socket]);

  /**
   * 标记所有通知为已读
   */
  const markAllAsRead = useCallback(async () => {
    if (!socket) return;

    try {
      // 通过Socket标记所有已读
      socket.emit('mark_all_notifications_read');
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      toast.error('标记所有通知已读失败');
    }
  }, [socket]);

  /**
   * 加载更多通知
   */
  const loadMore = useCallback(async () => {
    if (pagination.page < pagination.totalPages && !loading) {
      await getNotifications(pagination.page + 1, true);
    }
  }, [pagination.page, pagination.totalPages, loading, getNotifications]);

  /**
   * 刷新通知列表
   */
  const refresh = useCallback(async () => {
    await getNotifications(1, false);
  }, [getNotifications]);

  /**
   * 获取未读通知数量
   */
  const getUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  }, []);

  // 初始化Socket连接
  useEffect(() => {
    if (user && token) {
      const cleanup = initializeSocket();
      return cleanup;
    }
  }, [user, token, initializeSocket]);

  // 组件挂载时获取初始数据
  useEffect(() => {
    if (socket) {
      getNotifications(1);
      getUnreadCount();
    }
  }, [socket, getNotifications, getUnreadCount]);

  // 组件卸载时清理Socket连接
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return {
    // 状态
    notifications,
    unreadCount,
    loading,
    pagination,
    
    // 方法
    getNotifications,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
    
    // 计算属性
    hasMore: pagination.page < pagination.totalPages,
    isEmpty: notifications.length === 0 && !loading
  };
};

export default useNotification;