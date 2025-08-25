"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userService_1 = require("@/services/userService");
const asyncHandler_1 = require("@/middleware/asyncHandler");
const validation_1 = require("@/middleware/validation");
const verificationCodeService_1 = require("@/services/verificationCodeService");
const AppError_1 = require("@/utils/AppError");
const logger_1 = require("@/middleware/logger");
const router = express_1.default.Router();
// 发送邮箱验证码
router.post('/send-email-code', (0, validation_1.validate)({
    body: Joi.object({
        email: CommonValidations.email,
        scene: Joi.string().valid('register', 'login', 'reset_password', 'change_email').default('register')
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, scene } = req.body;
    // 检查邮箱是否已存在（注册场景）
    if (scene === 'register') {
        const existingUser = await userService_1.userService.findUserByEmail(email);
        if (existingUser) {
            throw AppError_1.ErrorFactory.conflict('邮箱已被注册');
        }
    }
    const result = await (0, verificationCodeService_1.sendEmailVerification)(email, '用户', scene);
    if (!result.success) {
        throw AppError_1.ErrorFactory.badRequest(result.message);
    }
    res.json({
        success: true,
        message: result.message,
        nextSendTime: result.nextSendTime
    });
}));
// 发送短信验证码
router.post('/send-sms-code', (0, validation_1.validate)({
    body: Joi.object({
        phone: CommonValidations.phone,
        scene: Joi.string().valid('register', 'login', 'reset_password', 'change_phone').default('register')
    })
}), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { phone, scene } = req.body;
    const result = await (0, verificationCodeService_1.sendSmsVerification)(phone, scene);
    if (!result.success) {
        throw AppError_1.ErrorFactory.badRequest(result.message);
    }
    res.json({
        success: true,
        message: result.message,
        nextSendTime: result.nextSendTime
    });
}));
// 用户注册
router.post('/register', (0, validation_1.validate)(validation_1.BusinessValidations.userRegister), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { username, email, password, phone, emailCode, smsCode } = req.body;
    // 验证邮箱验证码
    if (emailCode) {
        const emailVerifyResult = await (0, verificationCodeService_1.verifyCode)('email', email, emailCode, 'register');
        if (!emailVerifyResult.success) {
            throw AppError_1.ErrorFactory.badRequest(emailVerifyResult.message);
        }
    }
    // 验证手机验证码
    if (phone && smsCode) {
        const smsVerifyResult = await (0, verificationCodeService_1.verifyCode)('sms', phone, smsCode, 'register');
        if (!smsVerifyResult.success) {
            throw AppError_1.ErrorFactory.badRequest(smsVerifyResult.message);
        }
    }
    const result = await userService_1.userService.createUser({
        username,
        email,
        password,
        phone
    });
    // 记录注册日志
    logger_1.securityLogger.loginAttempt(email, true, req.ip, req.get('user-agent'));
    res.status(201).json({
        success: true,
        message: '注册成功',
        data: result
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
        throw new AppError('输入验证失败', 400, errors.array());
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
        throw new AppError('输入验证失败', 400, errors.array());
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
        throw new AppError('输入验证失败', 400, errors.array());
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
        throw new AppError('输入验证失败', 400, errors.array());
    }
    const { phone, code } = req.body;
    // 验证验证码
    const verifyResult = await verificationCodeService.verifyCode(phone, code);
    if (!verifyResult.success) {
        throw new AppError(verifyResult.message, 400);
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