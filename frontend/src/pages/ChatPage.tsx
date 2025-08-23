import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { ChatProvider } from '../hooks/useChat';

/**
 * 聊天页面组件
 * 提供完整的聊天功能，包括聊天列表和聊天窗口
 */
const ChatPage: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<any>(null);

  // 处理选择聊天
  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
  };

  // 处理关闭聊天窗口
  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  return (
    <ChatProvider>
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
                <p className="text-sm text-gray-600">与租赁伙伴进行实时沟通</p>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* 左侧聊天列表 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="w-80 flex-shrink-0"
            >
              <ChatList
                onChatSelect={handleChatSelect}
                selectedChatId={selectedChat?.id}
                className="h-full"
              />
            </motion.div>

            {/* 右侧聊天窗口 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 min-w-0"
            >
              {selectedChat ? (
                <ChatWindow
                  orderId={selectedChat.orderId}
                  receiverInfo={{
                    id: selectedChat.user.id,
                    name: selectedChat.user.name,
                    avatar: selectedChat.user.avatar,
                    online: selectedChat.user.online,
                  }}
                  onClose={handleCloseChat}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-600 mb-2">
                      欢迎使用消息中心
                    </h3>
                    <p className="text-neutral-500">
                      选择一个对话开始聊天
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatPage;