import express from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { orderService } from '..//services/orderService';
import { AppError } from '..//utils/errorHandler';
import { asyncHandler } from '..//middleware/asyncHandler';
import { authenticate } from '..//middleware/auth';

const router = express.Router();

// 创建订单
router.post('/', authenticate, [
  body('resourceId').isString().withMessage('资源ID不能为空'),
  body('startDate').isISO8601().withMessage('开始日期格式无效'),
  body('endDate').isISO8601().withMessage('结束日期格式无效'),
  body('notes').optional().isString().withMessage('备注必须是字符串'),
  body('deliveryMethod').isIn(['PICKUP', 'DELIVERY', 'EXPRESS']).withMessage('交付方式无效'),
  body('deliveryAddress').optional().isString().withMessage('配送地址必须是字符串')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const orderData = {
    resourceId: req.body.resourceId,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    notes: req.body.notes,
    deliveryMethod: req.body.deliveryMethod,
    deliveryAddress: req.body.deliveryAddress
  };

  const order = await orderService.createOrder(req.user!.userId, orderData);
  
  res.status(201).json({
    success: true,
    message: '订单创建成功',
    data: order
  });
}));

// 获取订单列表
router.get('/', authenticate, [
  query('role').isIn(['renter', 'owner']).withMessage('角色必须是renter或owner'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']).withMessage('状态无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const role = req.query.role as 'renter' | 'owner';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const result = await orderService.getOrders(req.user!.userId, role, page, limit, status);
  
  res.json({
    success: true,
    data: result
  });
}));

// 获取订单统计
router.get('/stats', authenticate, [
  query('role').isIn(['renter', 'owner']).withMessage('角色必须是renter或owner')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const role = req.query.role as 'renter' | 'owner';
  const stats = await orderService.getOrderStats(req.user!.userId, role);
  
  res.json({
    success: true,
    data: stats
  });
}));

// 获取即将到期的订单
router.get('/upcoming', authenticate, [
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('天数必须在1-30之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const days = parseInt(req.query.days as string) || 7;
  const orders = await orderService.getUpcomingOrders(req.user!.userId, days);
  
  res.json({
    success: true,
    data: orders
  });
}));

// 获取单个订单详情
router.get('/:id', authenticate, [
  param('id').isString().withMessage('订单ID不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const order = await orderService.getOrder(req.params.id, req.user!.userId);
  
  res.json({
    success: true,
    data: order
  });
}));

// 确认订单（资源所有者）
router.patch('/:id/confirm', authenticate, [
  param('id').isString().withMessage('订单ID不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const order = await orderService.confirmOrder(req.params.id, req.user!.userId);
  
  res.json({
    success: true,
    message: '订单确认成功',
    data: order
  });
}));

// 取消订单
router.patch('/:id/cancel', authenticate, [
  param('id').isString().withMessage('订单ID不能为空'),
  body('reason').optional().isString().withMessage('取消原因必须是字符串')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const reason = req.body.reason;
  const order = await orderService.cancelOrder(req.params.id, req.user!.userId, reason);
  
  res.json({
    success: true,
    message: '订单取消成功',
    data: order
  });
}));

// 完成订单
router.patch('/:id/complete', authenticate, [
  param('id').isString().withMessage('订单ID不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const order = await orderService.completeOrder(req.params.id, req.user!.userId);
  
  res.json({
    success: true,
    message: '订单完成成功',
    data: order
  });
}));

// 更新订单状态
router.patch('/:id/status', authenticate, [
  param('id').isString().withMessage('订单ID不能为空'),
  body('status').isIn(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']).withMessage('状态无效'),
  body('notes').optional().isString().withMessage('备注必须是字符串')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('输入验证失败', 400, errors.array());
  }

  const { status, notes } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, req.user!.userId, status, notes);
  
  res.json({
    success: true,
    message: '订单状态更新成功',
    data: order
  });
}));

export default router;