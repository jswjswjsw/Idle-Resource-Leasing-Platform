"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationService_1 = require("@/services/notificationService");
const asyncHandler_1 = require("@/middleware/asyncHandler");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("@/middleware/logger");
const router = express_1.default.Router();
/**
 * 获取用户通知列表
 */
router.get('/', auth_1.authenticate, (0, validation_1.validate)({
    query: joi_1.default.object({
        page: joi_1.default.number().optional().min(1).default(1).messages({
            'number.base': '页码必须是数字',
            'number.min': '页码不能小于1'
        }),
        limit: joi_1.default.number().optional().min(1).max(100).default(20).messages({
            'number.base': '每页数量必须是数字',
            'number.min': '每页数量不能小于1',
            'number.max': '每页数量不能超过100'
        }),
        type: joi_1.default.string().optional().valid(...Object.values(notificationService_1.NotificationType)).messages({
            'any.only': '不支持的通知类型'
        }),
        unreadOnly: joi_1.default.boolean().optional().default(false).messages({
            'boolean.base': '未读筛选必须是布尔值'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, type, unreadOnly } = req.query;
    const userId = req.user.id;
    const result = await notificationService_1.notificationService.getNotifications(userId, {
        page,
        limit,
        type,
        unreadOnly
    });
    res.json({
        success: true,
        message: '获取通知列表成功',
        data: {
            notifications: result.notifications,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            },
            unreadCount: result.unreadCount
        }
    });
}));
/**
 * 获取未读通知数量
 */
router.get('/unread-count', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const unreadCount = await notificationService_1.notificationService.getUnreadCount(userId);
    res.json({
        success: true,
        message: '获取未读通知数量成功',
        data: {
            unreadCount
        }
    });
}));
/**
 * 标记通知为已读
 */
router.put('/:notificationId/read', auth_1.authenticate, (0, validation_1.validate)({
    params: joi_1.default.object({
        notificationId: joi_1.default.string().required().messages({
            'string.empty': '通知ID不能为空',
            'any.required': '通知ID是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;
    await notificationService_1.notificationService.markAsRead(notificationId, userId);
    res.json({
        success: true,
        message: '通知已标记为已读'
    });
}));
/**
 * 标记所有通知为已读
 */
router.put('/read-all', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const markedCount = await notificationService_1.notificationService.markAllAsRead(userId);
    res.json({
        success: true,
        message: `已标记 ${markedCount} 条通知为已读`,
        data: {
            markedCount
        }
    });
}));
/**
 * 发送通知（管理员功能）
 */
router.post('/send', auth_1.authenticate, 
// 这里应该添加管理员权限验证
(0, validation_1.validate)({
    body: joi_1.default.object({
        userIds: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.array().items(joi_1.default.string())).required().messages({
            'any.required': '用户ID是必需的'
        }),
        type: joi_1.default.string().valid(...Object.values(notificationService_1.NotificationType)).required().messages({
            'any.only': '不支持的通知类型',
            'any.required': '通知类型是必需的'
        }),
        title: joi_1.default.string().required().min(1).max(200).messages({
            'string.empty': '通知标题不能为空',
            'string.max': '通知标题长度不能超过200个字符',
            'any.required': '通知标题是必需的'
        }),
        content: joi_1.default.string().required().min(1).max(1000).messages({
            'string.empty': '通知内容不能为空',
            'string.max': '通知内容长度不能超过1000个字符',
            'any.required': '通知内容是必需的'
        }),
        priority: joi_1.default.string().optional().valid(...Object.values(notificationService_1.NotificationPriority)).default(notificationService_1.NotificationPriority.NORMAL).messages({
            'any.only': '不支持的通知优先级'
        }),
        channels: joi_1.default.array().optional().items(joi_1.default.string().valid(...Object.values(notificationService_1.NotificationChannel))).default([notificationService_1.NotificationChannel.IN_APP]).messages({
            'array.base': '通知渠道必须是数组',
            'any.only': '不支持的通知渠道'
        }),
        data: joi_1.default.object().optional().messages({
            'object.base': '通知数据必须是对象'
        }),
        templateId: joi_1.default.string().optional().messages({
            'string.base': '模板ID必须是字符串'
        }),
        templateData: joi_1.default.object().optional().messages({
            'object.base': '模板数据必须是对象'
        }),
        expiresIn: joi_1.default.number().optional().min(60).max(86400 * 30).messages({
            'number.base': '过期时间必须是数字',
            'number.min': '过期时间不能少于60秒',
            'number.max': '过期时间不能超过30天'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { userIds, type, title, content, priority, channels, data, templateId, templateData, expiresIn } = req.body;
    const notificationIds = await notificationService_1.notificationService.sendNotification({
        userId: userIds,
        type,
        title,
        content,
        priority,
        channels,
        data,
        templateId,
        templateData,
        expiresIn
    });
    logger_1.winstonLogger.info('管理员发送通知', {
        adminId: req.user.id,
        notificationIds,
        userIds: Array.isArray(userIds) ? userIds : [userIds],
        type
    });
    res.json({
        success: true,
        message: '通知发送成功',
        data: {
            notificationIds,
            sentCount: notificationIds.length
        }
    });
}));
/**
 * 发送系统通知（管理员功能）
 */
router.post('/system', auth_1.authenticate, 
// 这里应该添加管理员权限验证
(0, validation_1.validate)({
    body: joi_1.default.object({
        title: joi_1.default.string().required().min(1).max(200).messages({
            'string.empty': '通知标题不能为空',
            'string.max': '通知标题长度不能超过200个字符',
            'any.required': '通知标题是必需的'
        }),
        content: joi_1.default.string().required().min(1).max(1000).messages({
            'string.empty': '通知内容不能为空',
            'string.max': '通知内容长度不能超过1000个字符',
            'any.required': '通知内容是必需的'
        }),
        priority: joi_1.default.string().optional().valid(...Object.values(notificationService_1.NotificationPriority)).default(notificationService_1.NotificationPriority.NORMAL).messages({
            'any.only': '不支持的通知优先级'
        }),
        userIds: joi_1.default.array().optional().items(joi_1.default.string()).messages({
            'array.base': '用户ID列表必须是数组'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { title, content, priority, userIds } = req.body;
    const notificationIds = await notificationService_1.notificationService.sendSystemNotification(title, content, userIds, priority);
    logger_1.winstonLogger.info('管理员发送系统通知', {
        adminId: req.user.id,
        notificationIds,
        userIds: userIds || '所有用户'
    });
    res.json({
        success: true,
        message: '系统通知发送成功',
        data: {
            notificationIds,
            sentCount: notificationIds.length
        }
    });
}));
/**
 * 获取通知模板列表
 */
router.get('/templates', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const templates = notificationService_1.notificationService.getAllTemplates();
    res.json({
        success: true,
        message: '获取通知模板成功',
        data: templates
    });
}));
/**
 * 获取特定通知模板
 */
router.get('/templates/:templateId', auth_1.authenticate, (0, validation_1.validate)({
    params: joi_1.default.object({
        templateId: joi_1.default.string().required().messages({
            'string.empty': '模板ID不能为空',
            'any.required': '模板ID是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { templateId } = req.params;
    const template = notificationService_1.notificationService.getTemplate(templateId);
    if (!template) {
        return res.status(404).json({
            success: false,
            message: '通知模板不存在'
        });
    }
    res.json({
        success: true,
        message: '获取通知模板成功',
        data: template
    });
}));
/**
 * 获取通知统计信息
 */
router.get('/stats', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const stats = await notificationService_1.notificationService.getNotificationStats(userId);
    res.json({
        success: true,
        message: '获取通知统计成功',
        data: stats
    });
}));
/**
 * 获取通知配置
 */
router.get('/config', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const config = {
        types: Object.values(notificationService_1.NotificationType),
        priorities: Object.values(notificationService_1.NotificationPriority),
        channels: Object.values(notificationService_1.NotificationChannel),
        maxNotifications: 1000,
        maxExpireTime: 86400 * 30 // 30天
    };
    res.json({
        success: true,
        message: '获取通知配置成功',
        data: config
    });
}));
exports.default = router;
//# sourceMappingURL=notification.js.map