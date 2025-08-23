import express from 'express';
import { authenticate } from '../middleware/auth';
import { chatService } from '../services/chatService';
import { AppError } from '../utils/AppError';

const router = express.Router();

// 获取订单聊天记录
router.get('/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const messages = await chatService.getChatMessages(orderId);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

// 发送聊天消息
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { orderId, content, type = 'TEXT', receiverId } = req.body;
    
    if (!orderId || !content || !receiverId) {
      throw new AppError('缺少必要参数', 400, 'MISSING_PARAMETERS');
    }

    const message = await chatService.sendMessage({
      orderId,
      content,
      type,
      senderId: req.user!.userId,
      receiverId
    });

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
});

// 获取未读消息数量
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await chatService.getUnreadCount(req.user!.userId);
    
    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    next(error);
  }
});

// 标记消息为已读
router.patch('/:messageId/read', authenticate, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    await chatService.markAsRead(messageId, req.user!.userId);
    
    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    next(error);
  }
});

export default router;