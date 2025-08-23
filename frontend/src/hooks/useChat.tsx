import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import io from 'socket.io-client';
import { ChatMessage, CreateChatMessageRequest } from '../types';
import { chatService } from '../services/api';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

// 聊天上下文类型定义
interface ChatContextType {
  // 当前聊天对话
  currentChat: {
    orderId: string;
    userId: string;
    userName: string;
  } | null;
  // 消息列表
  messages: ChatMessage[];
  // 未读消息数量
  unreadCount: number;
  // 发送消息
  sendMessage: (content: string, type?: 'text' | 'image' | 'location') => Promise<void>;
  // 加载更多消息
  loadMoreMessages: () => void;
  // 设置当前聊天
  setCurrentChat: (chat: { orderId: string; userId: string; userName: string } | null) => void;
  // 标记消息已读
  markMessageAsRead: (messageId: string) => Promise<void>;
  // 是否有更多消息
  hasMoreMessages: boolean;
  // 加载状态
  isLoading: boolean;
  // 错误信息
  error: Error | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 聊天提供者组件
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const [currentChat, setCurrentChat] = useState<{ orderId: string; userId: string; userName: string } | null>(null);
  const [socket, setSocket] = useState<any>(null);

  // WebSocket连接状态
  const [isConnected, setIsConnected] = useState(false);

  // 获取未读消息数量
  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: () => chatService.getUnreadCount(),
    refetchInterval: 30000, // 每30秒刷新一次
  });

  // 获取当前聊天消息（分页加载）
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['chatMessages', currentChat?.orderId],
    queryFn: ({ pageParam = 1 }) => {
      if (!currentChat?.orderId) {
        throw new Error('No active chat');
      }
      return chatService.getChatMessages(currentChat.orderId);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // 这里需要根据实际API响应结构调整
      const totalMessages = lastPage.data?.length || 0;
      const loadedMessages = allPages.reduce((acc, page) => acc + (page.data?.length || 0), 0);
      
      // 假设每页20条消息，如果还有更多则返回下一页
      if (totalMessages === 20 && loadedMessages < 100) { // 假设最多100条
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled: !!currentChat?.orderId,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 发送消息mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: {
      orderId: string;
      receiverId: string;
      message: string;
      type: 'text' | 'image' | 'location';
    }) => chatService.sendMessage({
      orderId: data.orderId,
      receiverId: data.receiverId,
      message: data.message,
      type: data.type,
    }),
    onSuccess: () => {
      // 刷新当前聊天消息
      queryClient.invalidateQueries({ queryKey: ['chatMessages', currentChat?.orderId] });
      // 刷新未读消息数量
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
    },
  });

  // 标记消息已读mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => chatService.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
    },
  });

  // 初始化Socket.IO连接
  useEffect(() => {
    if (!token || !user) return;

    // 创建Socket.IO连接
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3002', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // 连接成功事件
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('聊天Socket连接成功');
    });

    // 接收新消息
    newSocket.on('new_message', (message: ChatMessage) => {
      // 添加新消息到缓存
      queryClient.setQueryData(['chatMessages', message.orderId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const newPages = oldData.pages.map((page: any, index: number) => {
          if (index === 0) {
            return {
              ...page,
              data: [message, ...page.data]
            };
          }
          return page;
        });
        
        return {
          ...oldData,
          pages: newPages,
        };
      });

      // 显示新消息通知
       if (message.senderId !== user.id) {
         toast.success('收到新消息');
       }

      // 刷新未读消息数量
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
    });

    // 接收聊天记录
    newSocket.on('chat_history', (messages: ChatMessage[]) => {
      queryClient.setQueryData(['chatMessages', currentChat?.orderId], {
        pages: [{ data: messages }],
        pageParams: [1]
      });
    });

    // 接收未读消息数量
    newSocket.on('unread_messages', (count: number) => {
      queryClient.setQueryData(['unreadMessages'], { data: count });
    });

    // 错误处理
    newSocket.on('error', (error: { type: string; error: string }) => {
      console.error('聊天Socket错误:', error);
      toast.error(error.error || '聊天服务连接失败');
    });

    // 连接断开事件
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('聊天Socket连接断开');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, queryClient, currentChat?.orderId]);

  // 发送消息函数
  const sendMessage = async (content: string, type: 'text' | 'image' | 'location' = 'text') => {
    if (!currentChat?.orderId || !currentChat?.userId || !socket) {
      throw new Error('No active chat or socket connection');
    }

    try {
      // 通过Socket.IO发送消息
      socket.emit('send_message', {
        orderId: currentChat.orderId,
        receiverId: currentChat.userId,
        content: content,
        type,
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败');
      throw error;
    }
  };

  // 标记消息已读函数
  const markMessageAsRead = async (messageId: string) => {
    if (!socket) return;

    try {
      socket.emit('mark_messages_read', [messageId]);
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  };

  // 获取聊天记录函数
  const getChatHistory = async (orderId: string) => {
    if (!socket) return;

    try {
      socket.emit('get_chat_history', { orderId });
    } catch (error) {
      console.error('获取聊天记录失败:', error);
    }
  };

  // 加载更多消息函数
  const loadMoreMessages = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // 获取所有消息
  const messages = messagesData?.pages.flatMap(page => page.data || []) || [];

  // 当切换聊天时，获取聊天记录
  useEffect(() => {
    if (currentChat?.orderId && socket) {
      getChatHistory(currentChat.orderId);
    }
  }, [currentChat?.orderId, socket]);

  const value: ChatContextType = {
    currentChat,
    messages,
    unreadCount: unreadCountData?.data || 0,
    sendMessage,
    loadMoreMessages,
    setCurrentChat,
    markMessageAsRead,
    hasMoreMessages: hasNextPage || false,
    isLoading: isLoading || sendMessageMutation.isPending,
    error: error as Error | null,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// 使用聊天hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat必须在ChatProvider中使用');
  }
  return context;
};