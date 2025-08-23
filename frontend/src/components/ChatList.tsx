import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 聊天列表组件
 * 显示用户的所有聊天对话，包括订单聊天和系统消息
 */
interface ChatItem {
  id: string;
  orderId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    online?: boolean;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
  orderTitle: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface ChatListProps {
  onChatSelect: (chat: ChatItem) => void;
  selectedChatId?: string;
  className?: string;
}

const ChatList: React.FC<ChatListProps> = ({
  onChatSelect,
  selectedChatId,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // 模拟聊天数据 - 实际会从API获取
  const mockChats: ChatItem[] = [
    {
      id: '1',
      orderId: 'order-001',
      user: {
        id: 'user-001',
        name: '王小明',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
        online: true,
      },
      lastMessage: {
        content: '你好，这个相机可以租一周吗？',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        isRead: false,
        senderId: 'user-001',
      },
      unreadCount: 2,
      orderTitle: '佳能EOS R6相机租赁',
      status: 'active',
    },
    {
      id: '2',
      orderId: 'order-002',
      user: {
        id: 'user-002',
        name: '李小红',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332-3fc1-4030-8dc3-3d0e6c2a8b5f?w=150&h=150&fit=crop',
        online: false,
      },
      lastMessage: {
        content: '谢谢，已经收到帐篷了！',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        senderId: 'user-002',
      },
      unreadCount: 0,
      orderTitle: '户外帐篷租赁',
      status: 'completed',
    },
    {
      id: '3',
      orderId: 'order-003',
      user: {
        id: 'user-003',
        name: '张小华',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        online: true,
      },
      lastMessage: {
        content: '可以便宜点吗？',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        senderId: 'user-003',
      },
      unreadCount: 1,
      orderTitle: 'PS5游戏机租赁',
      status: 'active',
    },
  ];

  // 实际API调用 - 注释掉的代码
  /*
  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['userChats'],
    queryFn: () => chatService.getUserChats(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
  */

  const chats = mockChats;
  const isLoading = false;

  // 过滤和搜索聊天
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.orderTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || chat.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // 获取状态显示文本和样式
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: '进行中', color: 'text-green-600 bg-green-50' };
      case 'completed':
        return { text: '已完成', color: 'text-blue-600 bg-blue-50' };
      case 'cancelled':
        return { text: '已取消', color: 'text-red-600 bg-red-50' };
      default:
        return { text: '未知', color: 'text-gray-600 bg-gray-50' };
    }
  };

  // 格式化时间
  const formatChatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-lg flex flex-col h-full", className)}>
      {/* 头部 */}
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">消息中心</h2>
        
        {/* 搜索框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索用户或订单..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2">
          {(['all', 'active', 'completed', 'cancelled'] as const).map((status) => {
            const statusInfo = getStatusInfo(status);
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  filterStatus === status
                    ? statusInfo.color
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {status === 'all' ? '全部' : statusInfo.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500 mb-2">{searchQuery ? '没有找到匹配的聊天' : '暂无消息'}</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                清除搜索
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "flex gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                  selectedChatId === chat.id && "bg-primary-50 border-l-4 border-primary-500"
                )}
                onClick={() => onChatSelect(chat)}
              >
                {/* 头像 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.user.avatar}
                    alt={chat.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.user.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{chat.user.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{chat.orderTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatChatTime(chat.lastMessage.timestamp)}</span>
                      <span className={cn("px-2 py-1 text-xs rounded-full", getStatusInfo(chat.status).color)}>
                        {getStatusInfo(chat.status).text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!chat.lastMessage.isRead && chat.lastMessage.senderId !== chat.user.id && (
                      <CheckCircle className="w-3 h-3 text-primary-500 flex-shrink-0" />
                    )}
                    <p className={cn(
                      "text-sm truncate",
                      chat.unreadCount > 0 ? "font-medium text-gray-900" : "text-gray-600"
                    )}>
                      {chat.lastMessage.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t border-neutral-200 text-center">
        <p className="text-sm text-gray-500">
          共 {filteredChats.length} 个对话
        </p>
      </div>
    </div>
  );
};

export default ChatList;