import express from 'express';
import { 
  notificationService, 
  NotificationType, 
  NotificationPriority, 
  NotificationChannel 
} from '@/services/notificationService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import Joi from 'joi';
import { winstonLogger } from '@/middleware/logger';

const router = express.Router();

/**
 * 获取用户通知列表
 */
router.get('/',
  authenticate,
  validate({
    query: Joi.object({
      page: Joi.number().optional().min(1).default(1).messages({
        'number.base': '页码必须是数字',
        'number.min': '页码不能小于1'
      }),
      limit: Joi.number().optional().min(1).max(100).default(20).messages({
        'number.base': '每页数量必须是数字',
        'number.min': '每页数量不能小于1',
        'number.max': '每页数量不能超过100'
      }),
      type: Joi.string().optional().valid(...Object.values(NotificationType)).messages({
        'any.only': '不支持的通知类型'
      }),
      unreadOnly: Joi.boolean().optional().default(false).messages({
        'boolean.base': '未读筛选必须是布尔值'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { page, limit, type, unreadOnly } = req.query as any;
    const userId = req.user.id;
    
    const result = await notificationService.getNotifications(userId, {
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
  })
);

/**
 * 获取未读通知数量
 */
router.get('/unread-count',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      message: '获取未读通知数量成功',
      data: {
        unreadCount
      }
    });
  })
);

/**
 * 标记通知为已读
 */
router.put('/:notificationId/read',
  authenticate,
  validate({
    params: Joi.object({
      notificationId: Joi.string().required().messages({
        'string.empty': '通知ID不能为空',
        'any.required': '通知ID是必需的'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    await notificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      message: '通知已标记为已读'
    });
  })
);

/**
 * 标记所有通知为已读
 */
router.put('/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const markedCount = await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: `已标记 ${markedCount} 条通知为已读`,
      data: {
        markedCount
      }
    });
  })
);

/**
 * 发送通知（管理员功能）
 */
router.post('/send',
  authenticate,
  // 这里应该添加管理员权限验证
  validate({
    body: Joi.object({
      userIds: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ).required().messages({
        'any.required': '用户ID是必需的'
      }),
      type: Joi.string().valid(...Object.values(NotificationType)).required().messages({
        'any.only': '不支持的通知类型',
        'any.required': '通知类型是必需的'
      }),
      title: Joi.string().required().min(1).max(200).messages({
        'string.empty': '通知标题不能为空',
        'string.max': '通知标题长度不能超过200个字符',
        'any.required': '通知标题是必需的'
      }),
      content: Joi.string().required().min(1).max(1000).messages({
        'string.empty': '通知内容不能为空',
        'string.max': '通知内容长度不能超过1000个字符',
        'any.required': '通知内容是必需的'
      }),
      priority: Joi.string().optional().valid(...Object.values(NotificationPriority)).default(NotificationPriority.NORMAL).messages({
        'any.only': '不支持的通知优先级'
      }),
      channels: Joi.array().optional().items(
        Joi.string().valid(...Object.values(NotificationChannel))
      ).default([NotificationChannel.IN_APP]).messages({
        'array.base': '通知渠道必须是数组',
        'any.only': '不支持的通知渠道'
      }),
      data: Joi.object().optional().messages({
        'object.base': '通知数据必须是对象'
      }),
      templateId: Joi.string().optional().messages({
        'string.base': '模板ID必须是字符串'
      }),
      templateData: Joi.object().optional().messages({
        'object.base': '模板数据必须是对象'
      }),
      expiresIn: Joi.number().optional().min(60).max(86400 * 30).messages({
        'number.base': '过期时间必须是数字',
        'number.min': '过期时间不能少于60秒',
        'number.max': '过期时间不能超过30天'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const {
      userIds,
      type,
      title,
      content,
      priority,
      channels,
      data,
      templateId,
      templateData,
      expiresIn
    } = req.body;
    
    const notificationIds = await notificationService.sendNotification({
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
    
    winstonLogger.info('管理员发送通知', {
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
  })
);

/**
 * 发送系统通知（管理员功能）
 */
router.post('/system',
  authenticate,
  // 这里应该添加管理员权限验证
  validate({
    body: Joi.object({
      title: Joi.string().required().min(1).max(200).messages({
        'string.empty': '通知标题不能为空',
        'string.max': '通知标题长度不能超过200个字符',
        'any.required': '通知标题是必需的'
      }),
      content: Joi.string().required().min(1).max(1000).messages({
        'string.empty': '通知内容不能为空',
        'string.max': '通知内容长度不能超过1000个字符',
        'any.required': '通知内容是必需的'
      }),
      priority: Joi.string().optional().valid(...Object.values(NotificationPriority)).default(NotificationPriority.NORMAL).messages({
        'any.only': '不支持的通知优先级'
      }),
      userIds: Joi.array().optional().items(Joi.string()).messages({
        'array.base': '用户ID列表必须是数组'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { title, content, priority, userIds } = req.body;
    
    const notificationIds = await notificationService.sendSystemNotification(
      title,
      content,
      userIds,
      priority
    );
    
    winstonLogger.info('管理员发送系统通知', {
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
  })
);

/**
 * 获取通知模板列表
 */
router.get('/templates',
  authenticate,
  asyncHandler(async (req, res) => {
    const templates = notificationService.getAllTemplates();
    
    res.json({
      success: true,
      message: '获取通知模板成功',
      data: templates
    });
  })
);

/**
 * 获取特定通知模板
 */
router.get('/templates/:templateId',
  authenticate,
  validate({
    params: Joi.object({
      templateId: Joi.string().required().messages({
        'string.empty': '模板ID不能为空',
        'any.required': '模板ID是必需的'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    
    const template = notificationService.getTemplate(templateId);
    
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
  })
);

/**
 * 获取通知统计信息
 */
router.get('/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const stats = await notificationService.getNotificationStats(userId);
    
    res.json({
      success: true,
      message: '获取通知统计成功',
      data: stats
    });
  })
);

/**
 * 获取通知配置
 */
router.get('/config',
  authenticate,
  asyncHandler(async (req, res) => {
    const config = {
      types: Object.values(NotificationType),
      priorities: Object.values(NotificationPriority),
      channels: Object.values(NotificationChannel),
      maxNotifications: 1000,
      maxExpireTime: 86400 * 30 // 30天
    };
    
    res.json({
      success: true,
      message: '获取通知配置成功',
      data: config
    });
  })
);

export default router;