"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const userService_1 = require("../services/userService");
const errorHandler_1 = require("../utils/errorHandler");
const router = express_1.default.Router();
// 获取用户信息
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await userService_1.userService.getUserById(req.user.userId);
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        next(error);
    }
});
// 更新用户信息
router.put('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const updatedUser = await userService_1.userService.updateUser(req.user.userId, req.body);
        res.json({
            success: true,
            data: updatedUser
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取用户发布的资源
router.get('/:userId/resources', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const resources = await userService_1.userService.getUserResources(userId);
        res.json({
            success: true,
            data: resources
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取用户订单
router.get('/:userId/orders', auth_1.authenticate, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        if (req.user.userId !== userId) {
            throw new errorHandler_1.AppError('无权访问他人订单', 403, 'FORBIDDEN');
        }
        const orders = await userService_1.userService.getUserOrders(userId);
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取用户信誉分数
router.get('/:userId/credit-score', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const creditScore = await userService_1.userService.getCreditScore(userId);
        res.json({
            success: true,
            data: creditScore
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map