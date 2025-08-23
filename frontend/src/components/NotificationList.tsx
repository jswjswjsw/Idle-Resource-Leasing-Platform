import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  MessageSquare, 
  ShoppingCart, 
  CreditCard, 
  Star, 
  Settings,
  Check,
  CheckCheck,
  Clock,
  X
} from 'lucide-react';
import { Notification, NotificationType } from '../types';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

/**
 * 通知类型图标映射
 */
const getNotificationIcon = (type: NotificationType) => {
  const iconMap = {
    order: ShoppingCart,
    message: MessageSquare,
    system: Settings,
    promotion: Bell,
    payment: CreditCard,
    review: Star
  };
  
  return iconMap[type] || Bell;
};

/**
 * 通知类型颜色映射
 */
const getNotificationColor = (type: NotificationType) => {
  const colorMap = {
    order: 'text-blue-500 bg-blue-50',
    message: 'text-green-500 bg-green-50',
    system: 'text-gray-500 bg-gray-50',
    promotion: 'text-purple-500 bg-purple-50',
    payment: 'text-orange-500 bg-orange-50',
    review: 'text-yellow-500 bg-yellow-50'
  };
  
  return colorMap[type] || 'text-gray-500 bg-gray-50';
};

/**
 * 单个通知项组件
 */
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);
  
  // 处理点击事件
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // 如果有actionUrl，跳转到对应页面
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex items-start space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
        !notification.read && 'bg-blue-50/50'
      )}
      onClick={handleClick}
    >
      {/* 通知图标 */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        colorClass
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* 通知内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* 通知标题 */}
            <h4 className={cn(
              'text-sm font-medium text-gray-900 mb-1',
              !notification.read && 'font-semibold'
            )}>
              {notification.title}
            </h4>
            
            {/* 通知内容 */}
            <p className="text-sm text-gray-600 line-clamp-2">
              {notification.message}
            </p>
            
            {/* 时间戳 */}
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: zhCN
              })}
            </div>
          </div>
          
          {/* 已读状态指示器 */}
          <div className="flex-shrink-0 ml-2">
            {notification.read ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 通知列表组件
 * 显示通知列表，支持标记已读、加载更多等功能
 */
const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onLoadMore,
  hasMore = false,
  className
}) => {
  // 未读通知数量
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">通知</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount}
            </span>
          )}
        </div>
        
        {/* 全部已读按钮 */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>全部已读</span>
          </button>
        )}
      </div>
      
      {/* 通知列表 */}
      <div className="max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          // 加载状态
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : notifications.length === 0 ? (
          // 空状态
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm">暂无通知</p>
          </div>
        ) : (
          // 通知列表
          <AnimatePresence>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </AnimatePresence>
        )}
        
        {/* 加载更多按钮 */}
        {hasMore && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full py-2 px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  <span>加载中...</span>
                </div>
              ) : (
                '加载更多'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;