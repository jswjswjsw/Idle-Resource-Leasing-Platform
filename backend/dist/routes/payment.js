"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentService_1 = require("@/services/paymentService");
const asyncHandler_1 = require("@/middleware/asyncHandler");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
/**
 * 获取可用的支付方式
 */
router.get('/methods', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const methods = paymentService_1.paymentService.getAvailablePaymentMethods();
    res.json({
        success: true,
        message: '获取支付方式成功',
        data: methods
    });
}));
/**
 * 创建支付订单
 */
router.post('/create', auth_1.authenticate, (0, validation_1.validate)({
    body: joi_1.default.object({
        orderId: joi_1.default.string().required().min(1).max(100).messages({
            'string.empty': '订单ID不能为空',
            'string.max': '订单ID长度不能超过100个字符',
            'any.required': '订单ID是必需的'
        }),
        amount: joi_1.default.number().required().min(1).max(100000000).messages({
            'number.base': '支付金额必须是数字',
            'number.min': '支付金额必须大于0',
            'number.max': '支付金额不能超过100万元',
            'any.required': '支付金额是必需的'
        }),
        title: joi_1.default.string().required().min(1).max(200).messages({
            'string.empty': '订单标题不能为空',
            'string.max': '订单标题长度不能超过200个字符',
            'any.required': '订单标题是必需的'
        }),
        description: joi_1.default.string().optional().max(500).messages({
            'string.max': '订单描述长度不能超过500个字符'
        }),
        method: joi_1.default.string().optional().valid(...Object.values(paymentService_1.PaymentMethod)).messages({
            'any.only': '不支持的支付方式'
        }),
        returnUrl: joi_1.default.string().optional().uri().messages({
            'string.uri': '返回URL格式不正确'
        }),
        notifyUrl: joi_1.default.string().optional().uri().messages({
            'string.uri': '通知URL格式不正确'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId, amount, title, description, method, returnUrl, notifyUrl } = req.body;
    const userId = req.user.id;
    const orderInfo = {
        orderId,
        amount,
        title,
        description,
        userId,
        returnUrl,
        notifyUrl
    };
    const result = await paymentService_1.paymentService.createPayment(orderInfo, method);
    res.json({
        success: true,
        message: '支付订单创建成功',
        data: result
    });
}));
/**
 * 查询支付状态
 */
router.get('/status/:paymentId', auth_1.authenticate, (0, validation_1.validate)({
    params: joi_1.default.object({
        paymentId: joi_1.default.string().required().messages({
            'string.empty': '支付ID不能为空',
            'any.required': '支付ID是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { paymentId } = req.params;
    const status = await paymentService_1.paymentService.queryPaymentStatus(paymentId);
    res.json({
        success: true,
        message: '查询支付状态成功',
        data: {
            paymentId,
            status
        }
    });
}));
/**
 * 获取支付详情
 */
router.get('/info/:paymentId', auth_1.authenticate, (0, validation_1.validate)({
    params: joi_1.default.object({
        paymentId: joi_1.default.string().required().messages({
            'string.empty': '支付ID不能为空',
            'any.required': '支付ID是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { paymentId } = req.params;
    const paymentInfo = await paymentService_1.paymentService.getPaymentInfo(paymentId);
    // 检查权限：只能查看自己的支付信息
    if (paymentInfo.userId && paymentInfo.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: '无权查看此支付信息'
        });
    }
    res.json({
        success: true,
        message: '获取支付详情成功',
        data: paymentInfo
    });
}));
/**
 * 取消支付
 */
router.post('/cancel/:paymentId', auth_1.authenticate, (0, validation_1.validate)({
    params: joi_1.default.object({
        paymentId: joi_1.default.string().required().messages({
            'string.empty': '支付ID不能为空',
            'any.required': '支付ID是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { paymentId } = req.params;
    // 检查权限
    const paymentInfo = await paymentService_1.paymentService.getPaymentInfo(paymentId);
    if (paymentInfo.userId && paymentInfo.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: '无权取消此支付'
        });
    }
    await paymentService_1.paymentService.cancelPayment(paymentId);
    res.json({
        success: true,
        message: '支付已取消'
    });
}));
/**
 * 申请退款
 */
router.post('/refund', auth_1.authenticate, (0, validation_1.validate)({
    body: joi_1.default.object({
        paymentId: joi_1.default.string().required().messages({
            'string.empty': '支付ID不能为空',
            'any.required': '支付ID是必需的'
        }),
        refundAmount: joi_1.default.number().required().min(1).messages({
            'number.base': '退款金额必须是数字',
            'number.min': '退款金额必须大于0',
            'any.required': '退款金额是必需的'
        }),
        reason: joi_1.default.string().required().min(1).max(200).messages({
            'string.empty': '退款原因不能为空',
            'string.max': '退款原因长度不能超过200个字符',
            'any.required': '退款原因是必需的'
        })
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { paymentId, refundAmount, reason } = req.body;
    n;
    n;
})); // 检查权限\n    const paymentInfo = await paymentService.getPaymentInfo(paymentId);\n    if (paymentInfo.userId && paymentInfo.userId !== req.user.id) {\n      return res.status(403).json({\n        success: false,\n        message: '无权对此支付申请退款'\n      });\n    }\n    \n    const result = await paymentService.refundPayment(paymentId, refundAmount, reason);\n    \n    res.json({\n      success: true,\n      message: '退款申请已提交',\n      data: result\n    });\n  })\n);\n\n/**\n * 获取支付事件历史\n */\nrouter.get('/events/:paymentId',\n  authenticate,\n  validate({\n    params: Joi.object({\n      paymentId: Joi.string().required().messages({\n        'string.empty': '支付ID不能为空',\n        'any.required': '支付ID是必需的'\n      })\n    })\n  }),\n  asyncHandler(async (req, res) => {\n    const { paymentId } = req.params;\n    \n    // 检查权限\n    const paymentInfo = await paymentService.getPaymentInfo(paymentId);\n    if (paymentInfo.userId && paymentInfo.userId !== req.user.id) {\n      return res.status(403).json({\n        success: false,\n        message: '无权查看此支付事件'\n      });\n    }\n    \n    const events = await paymentService.getPaymentEvents(paymentId);\n    \n    res.json({\n      success: true,\n      message: '获取支付事件成功',\n      data: events\n    });\n  })\n);\n\n/**\n * 支付宝回调接口\n */\nrouter.post('/notify/alipay',\n  asyncHandler(async (req, res) => {\n    try {\n      winstonLogger.info('收到支付宝回调', { body: req.body });\n      \n      const callback = await paymentService.handlePaymentCallback(\n        PaymentMethod.ALIPAY_SANDBOX,\n        req.body\n      );\n      \n      if (callback) {\n        winstonLogger.info('支付宝回调处理成功', callback);\n        res.send('success'); // 支付宝要求返回success\n      } else {\n        winstonLogger.warn('支付宝回调验证失败');\n        res.send('fail');\n      }\n    } catch (error) {\n      winstonLogger.error('支付宝回调处理异常', { error: error.message });\n      res.send('fail');\n    }\n  })\n);\n\n/**\n * 微信支付回调接口\n */\nrouter.post('/notify/wechat',\n  asyncHandler(async (req, res) => {\n    try {\n      winstonLogger.info('收到微信支付回调', { body: req.body });\n      \n      const callback = await paymentService.handlePaymentCallback(\n        PaymentMethod.WECHAT_SANDBOX,\n        req.body\n      );\n      \n      if (callback) {\n        winstonLogger.info('微信支付回调处理成功', callback);\n        res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');\n      } else {\n        winstonLogger.warn('微信支付回调验证失败');\n        res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[验证失败]]></return_msg></xml>');\n      }\n    } catch (error) {\n      winstonLogger.error('微信支付回调处理异常', { error: error.message });\n      res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理异常]]></return_msg></xml>');\n    }\n  })\n);\n\n/**\n * 模拟支付成功（仅测试环境）\n */\nrouter.post('/simulate-success/:paymentId',\n  authenticate,\n  validate({\n    params: Joi.object({\n      paymentId: Joi.string().required().messages({\n        'string.empty': '支付ID不能为空',\n        'any.required': '支付ID是必需的'\n      })\n    })\n  }),\n  asyncHandler(async (req, res) => {\n    if (process.env.NODE_ENV === 'production') {\n      return res.status(403).json({\n        success: false,\n        message: '生产环境不允许模拟支付'\n      });\n    }\n    \n    const { paymentId } = req.params;\n    \n    // 检查权限\n    const paymentInfo = await paymentService.getPaymentInfo(paymentId);\n    if (paymentInfo.userId && paymentInfo.userId !== req.user.id) {\n      return res.status(403).json({\n        success: false,\n        message: '无权模拟此支付'\n      });\n    }\n    \n    await paymentService.simulatePaymentSuccess(paymentId);\n    \n    res.json({\n      success: true,\n      message: '模拟支付成功'\n    });\n  })\n);\n\n/**\n * 获取支付服务状态\n */\nrouter.get('/status',\n  asyncHandler(async (req, res) => {\n    const status = paymentService.getStatus();\n    \n    res.json({\n      success: true,\n      message: '获取支付服务状态成功',\n      data: status\n    });\n  })\n);\n\nexport default router;
//# sourceMappingURL=payment.js.map