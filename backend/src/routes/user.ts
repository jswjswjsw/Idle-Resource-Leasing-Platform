import express from 'express';
import { authenticate } from '../middleware/auth';
import { userService } from '../services/userService';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

// 获取用户信息
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// 更新用户信息
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.user!.userId, req.body);
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户发布的资源
router.get('/:userId/resources', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const resources = await userService.getUserResources(userId);
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户订单
router.get('/:userId/orders', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    if (req.user!.userId !== userId) {
      throw new AppError('无权访问他人订单', 403, 'FORBIDDEN');
    }
    
    const orders = await userService.getUserOrders(userId);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户信誉分数
router.get('/:userId/credit-score', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const creditScore = await userService.getCreditScore(userId);
    
    res.json({
      success: true,
      data: creditScore
    });
  } catch (error) {
    next(error);
  }
});

export default router;