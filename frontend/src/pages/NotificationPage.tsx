import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Filter, 
  Search, 
  CheckCheck, 
  RefreshCw,
  Settings,
  Trash2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationList from '../components/NotificationList';
import { NotificationType } from '../types';

/**
 * 通知页面组件
 * 提供完整的通知管理功能
 */
const NotificationPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
    hasMore,
    isEmpty
  } = useNotificationContext();

  // 通知类型选项
  const notificationTypes = [
    { value: 'all', label: '全部', count: notifications.length },
    { value: 'order', label: '订单', count: notifications.filter(n => n.type === 'order').length },
    { value: 'message', label: '消息', count: notifications.filter(n => n.type === 'message').length },
    { value: 'system', label: '系统', count: notifications.filter(n => n.type === 'system').length },
    { value: 'promotion', label: '推广', count: notifications.filter(n => n.type === 'promotion').length },
    { value: 'payment', label: '支付', count: notifications.filter(n => n.type === 'payment').length },
    { value: 'review', label: '评价', count: notifications.filter(n => n.type === 'review').length }
  ];

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    // 搜索过滤
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 类型过滤
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    // 已读状态过滤
    const matchesReadStatus = !showOnlyUnread || !notification.read;
    
    return matchesSearch && matchesType && matchesReadStatus;
  });

  // 处理刷新
  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} 条未读通知` : '所有通知已读'}
                </p>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-3">
              {/* 刷新按钮 */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                aria-label="刷新"
              >
                <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
              </button>
              
              {/* 全部已读按钮 */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>全部已读</span>
                </button>
              )}
              
              {/* 设置按钮 */}
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="设置"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 - 筛选选项 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                筛选
              </h3>
              
              {/* 搜索框 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索通知
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索标题或内容..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* 通知类型 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知类型
                </label>
                <div className="space-y-2">
                  {notificationTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value as NotificationType | 'all')}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
                        selectedType === type.value
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <span>{type.label}</span>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs',
                        selectedType === type.value
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-600'
                      )}>
                        {type.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 已读状态 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示选项
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyUnread}
                    onChange={(e) => setShowOnlyUnread(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">只显示未读</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* 主内容区 - 通知列表 */}
          <div className="lg:col-span-3">
            {isEmpty ? (
              // 空状态
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
              >
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无通知</h3>
                <p className="text-gray-600 mb-6">当有新的通知时，会在这里显示</p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </button>
              </motion.div>
            ) : (
              // 通知列表
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <NotificationList
                  notifications={filteredNotifications}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;