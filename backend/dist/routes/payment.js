"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { body, param, query, validationResult } = require('express-validator');
const auth_1 = require("..//middleware/auth");
const paymentService_1 = require("..//services/paymentService");
const alipayService_1 = require("..//services/alipayService");
const wechatPayService_1 = require("..//services/wechatPayService");
const errorHandler_1 = require("..//utils/errorHandler");
const asyncHandler_1 = require("..//middleware/asyncHandler");
const database_1 = require("..//config/database");
const router = express_1.default.Router();
// 创建支付订单
router.post('/create', auth_1.authenticate, [
    body('orderId').isString().notEmpty().withMessage('订单ID不能为空'),
    body('amount').isNumeric().withMessage('金额必须是数字'),
    body('paymentMethod').isIn(['alipay', 'wechat_pay', 'balance']).withMessage('支付方式无效'),
    body('paymentType').optional().isIn(['web', 'wap', 'app']).withMessage('支付类型无效')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { orderId, amount, paymentMethod, paymentType, returnUrl, notifyUrl } = req.body;
    // 验证订单
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, renterId: req.user.userId },
        include: { resource: true }
    });
    if (!order) {
        throw new errorHandler_1.AppError('订单不存在或无权访问', 404);
    }
    let paymentData;
    switch (paymentMethod) {
        case 'alipay':
            if (paymentType === 'wap') {
                paymentData = await alipayService_1.alipayService.createWapOrder(orderId, amount, `租赁：${order.resource.title}`, returnUrl, notifyUrl);
            }
            else {
                paymentData = await alipayService_1.alipayService.createOrder(orderId, amount, `租赁：${order.resource.title}`, returnUrl, notifyUrl);
            }
            break;
        case 'wechat_pay':
            if (!req.body.openid) {
                throw new errorHandler_1.AppError('微信支付需要openid', 400);
            }
            paymentData = await wechatPayService_1.wechatPayService.createOrder(orderId, amount, `租赁：${order.resource.title}`, req.body.openid, notifyUrl);
            break;
        default:
            paymentData = await paymentService_1.paymentService.createPayment({
                orderId,
                amount,
                paymentMethod,
                userId: req.user.userId
            });
    }
    res.json({
        success: true,
        data: paymentData
    });
}));
// 查询支付状态
router.get('/status/:orderId', auth_1.authenticate, [
    param('orderId').isString().notEmpty().withMessage('订单ID不能为空')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { orderId } = req.params;
    const { paymentMethod } = req.query;
    let status;
    switch (paymentMethod) {
        case 'alipay':
            status = await alipayService_1.alipayService.queryOrderStatus(orderId);
            break;
        case 'wechat_pay':
            status = await wechatPayService_1.wechatPayService.queryOrderStatus(orderId);
            break;
        default:
            status = await paymentService_1.paymentService.getPaymentStatus(orderId);
    }
    res.json({
        success: true,
        data: status
    });
}));
// 支付宝异步通知
router.post('/alipay/notify', express_1.default.raw({ type: 'application/x-www-form-urlencoded' }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await alipayService_1.alipayService.handleNotify(req.body);
    res.send(result);
}));
// 微信支付异步通知
router.post('/wechat/notify', express_1.default.raw({ type: 'application/json' }), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['wechatpay-signature'];
    const serial = req.headers['wechatpay-serial'];
    const nonce = req.headers['wechatpay-nonce'];
    const timestamp = req.headers['wechatpay-timestamp'];
    const result = await wechatPayService_1.wechatPayService.handleNotify(req.body, signature, serial, nonce, timestamp);
    res.json(result);
}));
// 申请退款
router.post('/refund', auth_1.authenticate, [
    body('orderId').isString().notEmpty().withMessage('订单ID不能为空'),
    body('reason').isString().notEmpty().withMessage('退款原因不能为空'),
    body('refundAmount').optional().isNumeric().withMessage('退款金额必须是数字')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { orderId, reason, refundAmount } = req.body;
    const userId = req.user.userId;
    // 验证订单所有权
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, renterId: userId }
    });
    if (!order) {
        throw new errorHandler_1.AppError('订单不存在或无权访问', 404);
    }
    let result;
    const payment = await database_1.prisma.payment.findFirst({
        where: { orderId, status: 'PAID' }
    });
    if (payment?.paymentMethod === 'ALIPAY') {
        result = await alipayService_1.alipayService.refund(orderId, refundAmount || Number(order.totalPrice), reason);
    }
    else if (payment?.paymentMethod === 'WECHAT') {
        result = await wechatPayService_1.wechatPayService.refund(orderId, refundAmount || Number(order.totalPrice), reason);
    }
    else {
        result = await paymentService_1.paymentService.requestRefund(orderId, reason, userId);
    }
    res.json({
        success: true,
        data: result
    });
}));
// 获取用户支付记录
router.get('/history', auth_1.authenticate, [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await paymentService_1.paymentService.getUserPayments(req.user.userId, { page, limit });
    res.json({
        success: true,
        data: result
    });
}));
// 获取支付配置
router.get('/config', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const config = await paymentService_1.paymentService.getPaymentConfig();
    res.json({
        success: true,
        data: config
    });
}));
// 获取支付详情
router.get('/:paymentId', auth_1.authenticate, [
    param('paymentId').isString().notEmpty().withMessage('支付ID不能为空')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const payment = await paymentService_1.paymentService.getPaymentStatus(req.params.paymentId);
    res.json({
        success: true,
        data: payment
    });
}));
exports.default = router;
//# sourceMappingURL=payment.js.map