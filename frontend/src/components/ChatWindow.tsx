import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Image, 
  MapPin, 
  Phone, 
  Video, 
  X, 
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 聊天窗口组件
 * 提供实时聊天功能，包括消息发送、接收、文件分享等
 */
interface ChatWindowProps {
  orderId: string;
  receiverInfo: {
    id: string;
    name: string;
    avatar: string;
    online?: boolean;
  };
  onClose?: () => void;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  orderId,
  receiverInfo,
  onClose,
  className
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    setCurrentChat,
  } = useChat();

  // 设置当前聊天
  useEffect(() => {
    setCurrentChat({
      orderId,
      userId: receiverInfo.id,
      userName: receiverInfo.name,
    });

    return () => {
      setCurrentChat(null);
    };
  }, [orderId, receiverInfo.id, receiverInfo.name, setCurrentChat]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    // 这里可以集成文件上传功能
    console.log('上传文件:', file.name);
    // 实际实现会调用fileService.uploadFile()
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 格式化消息时间
  const formatMessageTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  // 判断消息是否来自当前用户
  const isCurrentUser = (senderId: string) => {
    return senderId === user?.id;
  };

  // 渲染消息内容
  const renderMessageContent = (message: any) => {
    switch (message.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.message}
          </div>
        );
      case 'image':
        return (
          <img 
            src={message.message} 
            alt="分享的图片"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(message.message, '_blank')}
          />
        );
      case 'location':
        return (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">{message.message}</span>
          </div>
        );
      default:
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.message}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "bg-white rounded-lg shadow-xl flex flex-col h-full",
        className
      )}
    >
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={receiverInfo.avatar}
              alt={receiverInfo.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {receiverInfo.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{receiverInfo.name}</h3>
            <p className="text-sm text-gray-500">
              {receiverInfo.online ? '在线' : '离线'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">加载消息失败，请重试</span>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex gap-3",
                isCurrentUser(message.senderId) ? "justify-end" : "justify-start"
              )}
            >
              {!isCurrentUser(message.senderId) && (
                <img
                  src={receiverInfo.avatar}
                  alt={receiverInfo.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}
              
              <div className={cn(
                "max-w-xs lg:max-w-md",
                isCurrentUser(message.senderId) ? "order-first" : "order-last"
              )}>
                <div className={cn(
                  "rounded-lg px-4 py-2",
                  isCurrentUser(message.senderId)
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-gray-900"
                )}>
                  {renderMessageContent(message)}
                </div>
                <div className={cn(
                  "text-xs text-gray-500 mt-1",
                  isCurrentUser(message.senderId) ? "text-right" : "text-left"
                )}>
                  {formatMessageTime(message.createdAt)}
                  {!message.read && isCurrentUser(message.senderId) && (
                    <span className="ml-2 text-primary-600">已送达</span>
                  )}
                </div>
              </div>

              {isCurrentUser(message.senderId) && (
                <div className="w-8 h-8 flex-shrink-0"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-neutral-200">
        {isTyping && (
          <div className="text-sm text-gray-500 mb-2">
            {receiverInfo.name} 正在输入...
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            title="发送图片"
          >
            <Image className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            title="发送位置"
          >
            <MapPin className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            title="发送文件"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className="w-full px-4 py-2 pr-12 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className={cn(
              "p-2 rounded-full transition-colors",
              message.trim() && !isLoading
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;