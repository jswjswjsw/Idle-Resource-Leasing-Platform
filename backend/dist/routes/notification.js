"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notificationService_1 = require("../services/notificationService");
const router = express_1.default.Router();
// 获取通知列表
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const notifications = await notificationService_1.notificationService.getNotifications(req.user.userId, {
            page: Number(page),
            limit: Number(limit)
        });
        res.json({
            success: true,
            data: notifications
        });
    }
    catch (error) {
        next(error);
    }
});
// 标记通知为已读
router.patch('/:notificationId/read', auth_1.authenticate, async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        await notificationService_1.notificationService.markAsRead(notificationId, req.user.userId);
        res.json({
            success: true,
            message: '通知已标记为已读'
        });
    }
    catch (error) {
        next(error);
    }
});
// 标记所有通知为已读
router.patch('/mark-all-read', auth_1.authenticate, async (req, res, next) => {
    try {
        await notificationService_1.notificationService.markAllAsRead(req.user.userId);
        res.json({
            success: true,
            message: '所有通知已标记为已读'
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取未读通知数量
router.get('/unread-count', auth_1.authenticate, async (req, res, next) => {
    try {
        const count = await notificationService_1.notificationService.getUnreadCount(req.user.userId);
        res.json({
            success: true,
            data: count
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notification.js.map