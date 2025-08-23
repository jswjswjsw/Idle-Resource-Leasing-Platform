"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const chatService_1 = require("../services/chatService");
const AppError_1 = require("../utils/AppError");
const router = express_1.default.Router();
// 获取订单聊天记录
router.get('/order/:orderId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const messages = await chatService_1.chatService.getChatMessages(orderId);
        res.json({
            success: true,
            data: messages
        });
    }
    catch (error) {
        next(error);
    }
});
// 发送聊天消息
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { orderId, content, type = 'TEXT', receiverId } = req.body;
        if (!orderId || !content || !receiverId) {
            throw new AppError_1.AppError('缺少必要参数', 400, 'MISSING_PARAMETERS');
        }
        const message = await chatService_1.chatService.sendMessage({
            orderId,
            content,
            type,
            senderId: req.user.userId,
            receiverId
        });
        res.json({
            success: true,
            data: message
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取未读消息数量
router.get('/unread-count', auth_1.authenticate, async (req, res, next) => {
    try {
        const count = await chatService_1.chatService.getUnreadCount(req.user.userId);
        res.json({
            success: true,
            data: count
        });
    }
    catch (error) {
        next(error);
    }
});
// 标记消息为已读
router.patch('/:messageId/read', auth_1.authenticate, async (req, res, next) => {
    try {
        const { messageId } = req.params;
        await chatService_1.chatService.markAsRead(messageId, req.user.userId);
        res.json({
            success: true,
            message: '消息已标记为已读'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map