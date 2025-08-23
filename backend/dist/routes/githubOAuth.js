"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const githubOAuthService_1 = require("../services/githubOAuthService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database"); // 统一Prisma实例
const router = (0, express_1.Router)();
const githubOAuthService = new githubOAuthService_1.GitHubOAuthService();
/**
 * 生成JWT令牌
 * @param userId 用户ID
 * @returns JWT令牌
 */
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
}
/**
 * 获取GitHub OAuth授权URL
 * GET /api/auth/github/login
 */
router.get('/login', async (req, res) => {
    try {
        // 生成随机state参数，用于防止CSRF攻击
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // 生成GitHub OAuth授权URL
        const authUrl = githubOAuthService.generateAuthUrl(state);
        res.json({
            success: true,
            authUrl,
            state
        });
    }
    catch (error) {
        console.error('GitHub OAuth登录错误:', error);
        res.status(500).json({
            success: false,
            message: 'GitHub OAuth登录失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
/**
 * 处理GitHub OAuth回调
 * GET /api/auth/github/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        // 验证必要参数
        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                message: '缺少授权码'
            });
        }
        if (!state || typeof state !== 'string') {
            return res.status(400).json({
                success: false,
                message: '缺少state参数'
            });
        }
        // 使用授权码获取访问令牌
        const tokenData = await githubOAuthService.getAccessToken(code, state);
        // 使用访问令牌获取用户信息
        const githubUser = await githubOAuthService.getUserInfo(tokenData.access_token);
        // 检查是否已有GitHub OAuth账户
        let oauthAccount = await database_1.prisma.oAuthAccount.findFirst({
            where: {
                provider: 'GITHUB',
                providerId: githubUser.id.toString()
            },
            include: {
                user: true
            }
        });
        let user;
        if (oauthAccount) {
            // OAuth账户已存在，更新信息
            user = oauthAccount.user;
            // 更新OAuth账户信息
            await database_1.prisma.oAuthAccount.update({
                where: { id: oauthAccount.id },
                data: {
                    providerEmail: githubUser.email,
                    displayName: githubUser.name || githubUser.login,
                    avatar: githubUser.avatar_url,
                    accessToken: tokenData.access_token, // 在生产环境中应该加密存储
                    scope: tokenData.scope,
                    updatedAt: new Date()
                }
            });
            // 更新用户头像（如果用户没有头像）
            if (!user.avatar && githubUser.avatar_url) {
                user = await database_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        avatar: githubUser.avatar_url
                    }
                });
            }
        }
        else {
            // 检查是否有相同邮箱的用户
            const existingUser = githubUser.email ? await database_1.prisma.user.findUnique({
                where: { email: githubUser.email }
            }) : null;
            if (existingUser) {
                // 用户已存在，创建OAuth关联
                user = existingUser;
                await database_1.prisma.oAuthAccount.create({
                    data: {
                        userId: user.id,
                        provider: 'GITHUB',
                        providerId: githubUser.id.toString(),
                        providerEmail: githubUser.email,
                        displayName: githubUser.name || githubUser.login,
                        avatar: githubUser.avatar_url,
                        accessToken: tokenData.access_token, // 在生产环境中应该加密存储
                        scope: tokenData.scope
                    }
                });
                // 更新用户头像（如果用户没有头像）
                if (!user.avatar && githubUser.avatar_url) {
                    user = await database_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            avatar: githubUser.avatar_url
                        }
                    });
                }
            }
            else {
                // 创建新用户和OAuth账户
                user = await database_1.prisma.user.create({
                    data: {
                        username: githubUser.login,
                        email: githubUser.email || `${githubUser.login}@github.local`,
                        avatar: githubUser.avatar_url,
                        isOAuthUser: true,
                        verified: !!githubUser.email // GitHub用户如果有邮箱则认为已验证
                    }
                });
                await database_1.prisma.oAuthAccount.create({
                    data: {
                        userId: user.id,
                        provider: 'GITHUB',
                        providerId: githubUser.id.toString(),
                        providerEmail: githubUser.email,
                        displayName: githubUser.name || githubUser.login,
                        avatar: githubUser.avatar_url,
                        accessToken: tokenData.access_token, // 在生产环境中应该加密存储
                        scope: tokenData.scope
                    }
                });
                // 如果有邮箱，创建邮箱验证记录
                if (githubUser.email) {
                    await database_1.prisma.userVerification.create({
                        data: {
                            userId: user.id,
                            verificationType: 'EMAIL',
                            verifiedValue: githubUser.email,
                            verified: true,
                            verifiedAt: new Date()
                        }
                    });
                }
            }
        }
        // 生成JWT令牌
        const token = generateToken(user.id);
        // 返回成功响应
        res.json({
            success: true,
            message: 'GitHub登录成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                verified: user.verified,
                isOAuthUser: user.isOAuthUser
            },
            token
        });
    }
    catch (error) {
        console.error('GitHub OAuth回调错误:', error);
        res.status(500).json({
            success: false,
            message: 'GitHub OAuth回调处理失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
/**
 * 绑定GitHub账户到现有用户
 * POST /api/auth/github/bind
 */
router.post('/bind', async (req, res) => {
    try {
        const { code, state, userId } = req.body;
        // 验证必要参数
        if (!code || !state || !userId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        // 使用授权码获取访问令牌
        const tokenData = await githubOAuthService.getAccessToken(code, state);
        // 使用访问令牌获取用户信息
        const githubUser = await githubOAuthService.getUserInfo(tokenData.access_token);
        // 检查GitHub账户是否已被其他用户绑定
        const existingOAuth = await database_1.prisma.oAuthAccount.findFirst({
            where: {
                provider: 'GITHUB',
                providerId: githubUser.id.toString(),
                userId: { not: userId }
            }
        });
        if (existingOAuth) {
            return res.status(400).json({
                success: false,
                message: '该GitHub账户已被其他用户绑定'
            });
        }
        // 检查当前用户是否已绑定GitHub
        const currentOAuth = await database_1.prisma.oAuthAccount.findFirst({
            where: {
                provider: 'GITHUB',
                userId: userId
            }
        });
        if (currentOAuth) {
            // 更新现有绑定
            await database_1.prisma.oAuthAccount.update({
                where: { id: currentOAuth.id },
                data: {
                    providerId: githubUser.id.toString(),
                    providerEmail: githubUser.email,
                    displayName: githubUser.name || githubUser.login,
                    avatar: githubUser.avatar_url,
                    accessToken: tokenData.access_token,
                    scope: tokenData.scope,
                    updatedAt: new Date()
                }
            });
        }
        else {
            // 创建新的OAuth绑定
            await database_1.prisma.oAuthAccount.create({
                data: {
                    userId: userId,
                    provider: 'GITHUB',
                    providerId: githubUser.id.toString(),
                    providerEmail: githubUser.email,
                    displayName: githubUser.name || githubUser.login,
                    avatar: githubUser.avatar_url,
                    accessToken: tokenData.access_token,
                    scope: tokenData.scope
                }
            });
        }
        // 获取更新后的用户信息
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        // 更新用户头像（如果用户没有头像）
        if (!user.avatar && githubUser.avatar_url) {
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    avatar: githubUser.avatar_url
                }
            });
        }
        res.json({
            success: true,
            message: 'GitHub账户绑定成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || githubUser.avatar_url,
                verified: user.verified,
                isOAuthUser: user.isOAuthUser
            }
        });
    }
    catch (error) {
        console.error('GitHub账户绑定错误:', error);
        res.status(500).json({
            success: false,
            message: 'GitHub账户绑定失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
/**
 * 解绑GitHub账户
 * POST /api/auth/github/unbind
 */
router.post('/unbind', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '缺少用户ID'
            });
        }
        // 删除GitHub OAuth绑定
        const deletedOAuth = await database_1.prisma.oAuthAccount.deleteMany({
            where: {
                userId: userId,
                provider: 'GITHUB'
            }
        });
        if (deletedOAuth.count === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到GitHub绑定记录'
            });
        }
        // 获取用户信息
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            message: 'GitHub账户解绑成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                verified: user.verified,
                isOAuthUser: user.isOAuthUser
            }
        });
    }
    catch (error) {
        console.error('GitHub账户解绑错误:', error);
        res.status(500).json({
            success: false,
            message: 'GitHub账户解绑失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=githubOAuth.js.map