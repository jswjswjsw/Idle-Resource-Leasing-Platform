"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { body, validationResult } = require('express-validator');
const userService_1 = require("../services/userService");
const errorHandler_1 = require("../utils/errorHandler");
const asyncHandler_1 = require("../middleware/asyncHandler");
const auth_1 = require("../middleware/auth");
const verificationCodeService_1 = require("../services/verificationCodeService");
const router = express_1.default.Router();
// 用户注册
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
        .withMessage('用户名只能包含字母、数字、下划线和中文'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('phone')
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/)
        .withMessage('密码必须包含大小写字母和数字'),
    body('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('两次输入的密码不一致');
        }
        return true;
    })
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { username, email, phone, password } = req.body;
    const user = await userService_1.userService.createUser({
        username,
        email,
        phone,
        password
    });
    res.status(201).json({
        success: true,
        message: '用户注册成功',
        data: user
    });
}));
// 用户登录
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { email, password } = req.body;
    const result = await userService_1.userService.loginUser(email, password);
    res.json({
        success: true,
        message: '登录成功',
        data: result
    });
}));
// 刷新token（用于延长登录状态）
router.post('/refresh', [
    body('refreshToken')
        .notEmpty()
        .withMessage('刷新token不能为空')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { refreshToken } = req.body;
    const result = await userService_1.userService.refreshToken(refreshToken);
    res.json({
        success: true,
        message: 'token刷新成功',
        data: result
    });
}));
// 登出
router.post('/logout', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // 这里可以实现登出逻辑，如使token失效
    res.json({
        success: true,
        message: '登出成功'
    });
}));
// 获取当前用户信息
router.get('/me', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService_1.userService.getUserById(req.user.userId);
    res.json({
        success: true,
        data: user
    });
}));
// 修改密码
router.put('/password', auth_1.authenticate, [
    body('currentPassword')
        .notEmpty()
        .withMessage('当前密码不能为空'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少6位'),
    body('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('两次输入的新密码不一致');
        }
        return true;
    })
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { currentPassword, newPassword } = req.body;
    // 验证当前密码
    const isValid = await userService_1.userService.validatePassword(req.user.userId, currentPassword);
    if (!isValid) {
        throw new errorHandler_1.AppError('当前密码错误', 400);
    }
    await userService_1.userService.updatePassword(req.user.userId, newPassword);
    res.json({
        success: true,
        message: '密码修改成功'
    });
}));
// 发送邮箱验证码
router.post('/send-email-code', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { email } = req.body;
    await userService_1.userService.sendEmailVerificationCode(email);
    res.json({
        success: true,
        message: '验证码已发送到您的邮箱'
    });
}));
// 验证邮箱
router.post('/verify-email', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('code')
        .isLength({ min: 6, max: 6 })
        .withMessage('验证码必须是6位数字')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { email, code } = req.body;
    await userService_1.userService.verifyEmail(email, code);
    res.json({
        success: true,
        message: '邮箱验证成功'
    });
}));
// 发送短信验证码
router.post('/send-sms-code', [
    body('phone')
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { phone } = req.body;
    const result = await verificationCodeService_1.verificationCodeService.sendVerificationCode(phone);
    if (!result.success) {
        throw new errorHandler_1.AppError(result.message, 400);
    }
    res.json({
        success: true,
        message: result.message,
        data: result.data
    });
}));
// 验证手机号
router.post('/verify-phone', [
    body('phone')
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码'),
    body('code')
        .isLength({ min: 6, max: 6 })
        .withMessage('验证码必须是6位数字')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { phone, code } = req.body;
    await userService_1.userService.verifyPhone(phone, code);
    res.json({
        success: true,
        message: '手机号验证成功'
    });
}));
// 忘记密码 - 发送重置邮件
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { email } = req.body;
    await userService_1.userService.sendPasswordResetEmail(email);
    res.json({
        success: true,
        message: '密码重置邮件已发送'
    });
}));
// 重置密码
router.post('/reset-password', [
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('token')
        .notEmpty()
        .withMessage('重置token不能为空'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少6位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/)
        .withMessage('密码必须包含大小写字母和数字'),
    body('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('两次输入的密码不一致');
        }
        return true;
    })
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { email, token, newPassword } = req.body;
    await userService_1.userService.resetPassword(email, token, newPassword);
    res.json({
        success: true,
        message: '密码重置成功'
    });
}));
// 手机号验证码登录
router.post('/login-phone', [
    body('phone')
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码'),
    body('code')
        .isLength({ min: 6, max: 6 })
        .withMessage('验证码必须是6位数字')
], (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('输入验证失败', 400, errors.array());
    }
    const { phone, code } = req.body;
    // 验证验证码
    const verifyResult = await verificationCodeService_1.verificationCodeService.verifyCode(phone, code);
    if (!verifyResult.success) {
        throw new errorHandler_1.AppError(verifyResult.message, 400);
    }
    // 查找或创建用户
    let user = await userService_1.userService.findUserByPhone(phone);
    if (!user) {
        // 如果用户不存在，创建新用户
        user = await userService_1.userService.createUserByPhone({
            phone,
            username: `用户${phone.slice(-4)}`, // 使用手机号后4位作为默认用户名
            email: null // 手机号登录时邮箱可以为空
        });
    }
    // 生成token
    const tokens = await userService_1.userService.generateTokens(user.id);
    res.json({
        success: true,
        message: '登录成功',
        data: {
            user: {
                id: user.id,
                username: user.username,
                phone: user.phone,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt
            },
            ...tokens
        }
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map