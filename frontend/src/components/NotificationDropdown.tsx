import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationList from './NotificationList';

interface NotificationDropdownProps {
  className?: string;
}

/**
 * 通知下拉菜单组件
 * 在Header中显示通知图标和下拉菜单
 */
const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    loadMore,
    hasMore
  } = useNotificationContext();

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 切换下拉菜单显示状态
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 关闭下拉菜单
  const closeDropdown = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* 通知图标按钮 */}
      <button
        onClick={toggleDropdown}
        className={cn(
          'relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors',
          isOpen && 'bg-gray-100 text-gray-900'
        )}
        aria-label="通知"
      >
        <Bell className="w-6 h-6" />
        
        {/* 未读数量徽章 */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* 下拉菜单头部 */}
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
              
              {/* 关闭按钮 */}
              <button
                onClick={closeDropdown}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* 通知列表内容 */}
            <div className="max-h-80 overflow-hidden">
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
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 5).map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                        !notification.read && 'bg-blue-50/50'
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                        closeDropdown();
                      }}
                    >
                      {/* 未读指示器 */}
                      <div className="flex-shrink-0 mt-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          'text-sm text-gray-900 mb-1 line-clamp-1',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 底部操作 */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  {/* 全部已读按钮 */}
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead();
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      全部已读
                    </button>
                  )}
                  
                  {/* 查看全部按钮 */}
                  <button
                    onClick={() => {
                      // 跳转到通知页面
                      window.location.href = '/notifications';
                      closeDropdown();
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    查看全部
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;