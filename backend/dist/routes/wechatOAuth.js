"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wechatOAuthService_1 = require("../services/wechatOAuthService");
const router = (0, express_1.Router)();
/**
 * 微信OAuth路由控制器
 * 处理微信登录相关的HTTP请求
 */
/**
 * @route GET /api/auth/wechat/login
 * @desc 获取微信OAuth授权URL
 * @access Public
 */
router.get('/login', async (req, res) => {
    try {
        const { redirectUri } = req.query;
        // 生成随机state参数
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // 生成微信OAuth授权URL
        const authUrl = wechatOAuthService_1.wechatOAuthService.generateAuthUrl(state);
        const response = {
            success: true,
            message: '获取微信授权URL成功',
            data: { authUrl, state },
        };
        res.json(response);
    }
    catch (error) {
        console.error('获取微信授权URL失败:', error);
        const response = {
            success: false,
            message: '获取微信授权URL失败',
            data: null,
        };
        res.status(500).json(response);
    }
});
/**
 * @route GET /api/auth/wechat/callback
 * @desc 微信OAuth回调处理（浏览器重定向）
 * @access Public
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        // 验证必要参数
        if (!code) {
            const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=missing_code`;
            return res.redirect(errorUrl);
        }
        // 重定向到前端回调页面，让前端处理登录逻辑
        const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/wechat/callback?code=${code}&state=${state || ''}`;
        res.redirect(callbackUrl);
    }
    catch (error) {
        console.error('微信OAuth回调处理失败:', error);
        // 重定向到错误页面
        const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=oauth_failed&provider=wechat`;
        res.redirect(errorUrl);
    }
});
/**
 * @route POST /api/auth/wechat/callback
 * @desc 微信OAuth回调处理（前端API调用）
 * @access Public
 */
router.post('/callback', async (req, res) => {
    try {
        const { code, state } = req.body;
        // 验证必要参数
        if (!code) {
            const response = {
                success: false,
                message: '缺少授权码参数',
                data: null,
            };
            return res.status(400).json(response);
        }
        // 处理微信OAuth登录
        const loginResult = await wechatOAuthService_1.wechatOAuthService.handleOAuthLogin(code);
        // 构造前端期望的响应格式
        const response = {
            success: true,
            message: loginResult.isNewUser ? '微信注册成功' : '微信登录成功',
            data: {
                user: {
                    id: loginResult.user.id,
                    username: loginResult.user.username,
                    email: loginResult.user.email || '',
                    phone: '',
                    avatar: loginResult.user.avatar || '',
                    creditScore: 100, // 默认信用分
                    verified: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                token: loginResult.tokens.accessToken,
                refreshToken: loginResult.tokens.refreshToken,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('微信OAuth回调处理失败:', error);
        const response = {
            success: false,
            message: error instanceof Error ? error.message : '微信登录失败',
            data: null,
        };
        res.status(500).json(response);
    }
});
/**
 * @route POST /api/auth/wechat/mobile
 * @desc 移动端微信OAuth登录
 * @access Public
 */
router.post('/mobile', async (req, res) => {
    try {
        const { code } = req.body;
        // 验证必要参数
        if (!code) {
            const response = {
                success: false,
                message: '缺少授权码参数',
                data: null,
            };
            return res.status(400).json(response);
        }
        // 处理微信OAuth登录
        const loginResult = await wechatOAuthService_1.wechatOAuthService.handleOAuthLogin(code);
        const response = {
            success: true,
            message: loginResult.isNewUser ? '微信注册成功' : '微信登录成功',
            data: loginResult,
        };
        res.json(response);
    }
    catch (error) {
        console.error('移动端微信OAuth登录失败:', error);
        const response = {
            success: false,
            message: error instanceof Error ? error.message : '微信登录失败',
            data: null,
        };
        res.status(500).json(response);
    }
});
/**
 * @route POST /api/auth/wechat/bind
 * @desc 绑定微信账户到现有用户
 * @access Private
 */
router.post('/bind', async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user?.userId; // 从认证中间件获取用户ID
        // 验证用户是否已登录
        if (!userId) {
            const response = {
                success: false,
                message: '用户未登录',
                data: null,
            };
            return res.status(401).json(response);
        }
        // 验证必要参数
        if (!code) {
            const response = {
                success: false,
                message: '缺少授权码参数',
                data: null,
            };
            return res.status(400).json(response);
        }
        // TODO: 实现绑定微信账户的逻辑
        // 这里需要获取微信用户信息，然后创建OAuth账户记录
        const response = {
            success: true,
            message: '微信账户绑定成功',
            data: { message: '微信账户绑定成功' },
        };
        res.json(response);
    }
    catch (error) {
        console.error('绑定微信账户失败:', error);
        const response = {
            success: false,
            message: error instanceof Error ? error.message : '绑定微信账户失败',
            data: null,
        };
        res.status(500).json(response);
    }
});
/**
 * @route DELETE /api/auth/wechat/unbind
 * @desc 解绑微信账户
 * @access Private
 */
router.delete('/unbind', async (req, res) => {
    try {
        const userId = req.user?.userId; // 从认证中间件获取用户ID
        // 验证用户是否已登录
        if (!userId) {
            const response = {
                success: false,
                message: '用户未登录',
                data: null,
            };
            return res.status(401).json(response);
        }
        // TODO: 实现解绑微信账户的逻辑
        // 这里需要删除或禁用OAuth账户记录
        const response = {
            success: true,
            message: '微信账户解绑成功',
            data: { message: '微信账户解绑成功' },
        };
        res.json(response);
    }
    catch (error) {
        console.error('解绑微信账户失败:', error);
        const response = {
            success: false,
            message: error instanceof Error ? error.message : '解绑微信账户失败',
            data: null,
        };
        res.status(500).json(response);
    }
});
/**
 * @route GET /api/auth/wechat/status
 * @desc 获取用户微信绑定状态
 * @access Private
 */
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.userId; // 从认证中间件获取用户ID
        // 验证用户是否已登录
        if (!userId) {
            const response = {
                success: false,
                message: '用户未登录',
                data: null,
            };
            return res.status(401).json(response);
        }
        // TODO: 实现获取微信绑定状态的逻辑
        // 这里需要查询用户的OAuth账户记录
        const response = {
            success: true,
            message: '获取微信绑定状态成功',
            data: {
                isBound: false, // 临时返回false
                displayName: undefined,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('获取微信绑定状态失败:', error);
        const response = {
            success: false,
            message: '获取微信绑定状态失败',
            data: null,
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=wechatOAuth.js.map