"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wechatOAuthService = exports.WechatOAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database"); // 统一Prisma实例
const jwt_1 = require("../utils/jwt");
/**
 * 微信OAuth服务类
 * 处理微信登录相关的所有业务逻辑
 */
class WechatOAuthService {
    constructor() {
        // 从环境变量获取微信OAuth配置
        this.appId = process.env.WECHAT_OAUTH_APP_ID || '';
        this.appSecret = process.env.WECHAT_OAUTH_APP_SECRET || '';
        this.redirectUri = process.env.WECHAT_OAUTH_REDIRECT_URI || '';
        if (!this.appId || !this.appSecret || !this.redirectUri) {
            console.warn('微信OAuth配置不完整，请检查环境变量');
        }
    }
    /**
     * 生成微信OAuth授权URL
     * @param state 状态参数，用于防止CSRF攻击
     * @returns 微信授权URL
     */
    generateAuthUrl(state) {
        // 检查微信OAuth配置是否完整
        if (!this.appId || !this.appSecret || !this.redirectUri) {
            throw new Error('微信OAuth配置不完整，请配置WECHAT_OAUTH_APP_ID、WECHAT_OAUTH_APP_SECRET和WECHAT_OAUTH_REDIRECT_URI环境变量');
        }
        // 检查是否使用了占位符值
        if (this.appId === 'your-wechat-oauth-app-id' ||
            this.appSecret === 'your-wechat-oauth-app-secret') {
            throw new Error('请配置真实的微信OAuth参数，当前使用的是占位符值');
        }
        const stateParam = state || this.generateState();
        const params = new URLSearchParams({
            appid: this.appId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'snsapi_userinfo', // 获取用户基本信息
            state: stateParam,
        });
        return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
    }
    /**
     * 生成随机状态参数
     * @returns 随机状态字符串
     */
    generateState() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    /**
     * 通过授权码获取访问令牌
     * @param code 微信返回的授权码
     * @returns 访问令牌信息
     */
    async getAccessToken(code) {
        const params = {
            appid: this.appId,
            secret: this.appSecret,
            code,
            grant_type: 'authorization_code',
        };
        try {
            const response = await axios_1.default.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
                params,
                timeout: 10000,
            });
            if (response.data.errcode) {
                throw new Error(`微信API错误: ${response.data.errmsg}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('获取微信访问令牌失败:', error);
            throw new Error('获取微信访问令牌失败');
        }
    }
    /**
     * 获取微信用户信息
     * @param accessToken 访问令牌
     * @param openid 用户openid
     * @returns 微信用户信息
     */
    async getUserInfo(accessToken, openid) {
        const params = {
            access_token: accessToken,
            openid,
            lang: 'zh_CN',
        };
        try {
            const response = await axios_1.default.get('https://api.weixin.qq.com/sns/userinfo', {
                params,
                timeout: 10000,
            });
            if (response.data.errcode) {
                throw new Error(`微信API错误: ${response.data.errmsg}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('获取微信用户信息失败:', error);
            throw new Error('获取微信用户信息失败');
        }
    }
    /**
     * 处理微信OAuth登录
     * @param code 微信返回的授权码
     * @returns 登录结果
     */
    async handleOAuthLogin(code) {
        try {
            // 1. 获取访问令牌
            const tokenResponse = await this.getAccessToken(code);
            const { access_token, openid, refresh_token, expires_in } = tokenResponse;
            // 2. 获取用户信息
            const wechatUserInfo = await this.getUserInfo(access_token, openid);
            // 3. 查找或创建OAuth账户
            let oauthAccount = await database_1.prisma.oAuthAccount.findUnique({
                where: {
                    provider_providerId: {
                        provider: 'WECHAT',
                        providerId: openid,
                    },
                },
                include: {
                    user: true,
                },
            });
            let user;
            let isNewUser = false;
            if (oauthAccount) {
                // 已存在的OAuth账户，更新令牌信息
                user = oauthAccount.user;
                await this.updateOAuthAccount(oauthAccount.id, {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt: new Date(Date.now() + expires_in * 1000),
                    displayName: wechatUserInfo.nickname,
                    avatar: wechatUserInfo.headimgurl,
                    providerEmail: null, // 微信不提供邮箱
                });
            }
            else {
                // 新用户，创建用户和OAuth账户
                isNewUser = true;
                user = await this.createUserWithOAuth(wechatUserInfo, {
                    provider: 'WECHAT',
                    providerId: openid,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt: new Date(Date.now() + expires_in * 1000),
                });
            }
            // 4. 生成JWT令牌
            const tokens = (0, jwt_1.generateToken)(user.id);
            // 5. 更新用户最后登录时间
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            return {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    isOAuthUser: user.isOAuthUser,
                },
                tokens,
                isNewUser,
            };
        }
        catch (error) {
            console.error('微信OAuth登录失败:', error);
            throw error;
        }
    }
    /**
     * 创建用户和OAuth账户
     * @param wechatUserInfo 微信用户信息
     * @param oauthData OAuth数据
     * @returns 创建的用户
     */
    async createUserWithOAuth(wechatUserInfo, oauthData) {
        return await database_1.prisma.$transaction(async (tx) => {
            // 生成唯一的用户名
            const username = await this.generateUniqueUsername(wechatUserInfo.nickname, tx);
            // 生成临时邮箱（微信不提供邮箱）
            const tempEmail = `wechat_${oauthData.providerId}@temp.local`;
            // 创建用户
            const user = await tx.user.create({
                data: {
                    username,
                    email: tempEmail,
                    password: null, // OAuth用户没有密码
                    avatar: wechatUserInfo.headimgurl,
                    isOAuthUser: true,
                    verified: true, // 微信用户默认已验证
                },
            });
            // 创建OAuth账户
            await tx.oAuthAccount.create({
                data: {
                    userId: user.id,
                    provider: oauthData.provider,
                    providerId: oauthData.providerId,
                    displayName: wechatUserInfo.nickname,
                    avatar: wechatUserInfo.headimgurl,
                    accessToken: oauthData.accessToken,
                    refreshToken: oauthData.refreshToken,
                    expiresAt: oauthData.expiresAt,
                    metadata: JSON.stringify({
                        unionid: wechatUserInfo.unionid,
                        sex: wechatUserInfo.sex,
                        province: wechatUserInfo.province,
                        city: wechatUserInfo.city,
                        country: wechatUserInfo.country,
                    }),
                },
            });
            return user;
        });
    }
    /**
     * 更新OAuth账户信息
     * @param accountId OAuth账户ID
     * @param updateData 更新数据
     */
    async updateOAuthAccount(accountId, updateData) {
        await database_1.prisma.oAuthAccount.update({
            where: { id: accountId },
            data: updateData,
        });
    }
    /**
     * 生成唯一的用户名
     * @param nickname 微信昵称
     * @returns 唯一用户名
     */
    async generateUniqueUsername(nickname, tx = database_1.prisma) {
        // 清理昵称，只保留字母数字和中文
        let baseUsername = nickname.replace(/[^\w\u4e00-\u9fa5]/g, '');
        if (!baseUsername) {
            baseUsername = 'wechat_user';
        }
        let username = baseUsername;
        let counter = 1;
        // 检查用户名是否已存在，如果存在则添加数字后缀
        while (await tx.user.findUnique({ where: { username } })) {
            username = `${baseUsername}_${counter}`;
            counter++;
        }
        return username;
    }
    /**
     * 刷新访问令牌
     * @param refreshToken 刷新令牌
     * @returns 新的访问令牌信息
     */
    async refreshAccessToken(refreshToken) {
        const params = {
            appid: this.appId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        };
        try {
            const response = await axios_1.default.get('https://api.weixin.qq.com/sns/oauth2/refresh_token', {
                params,
                timeout: 10000,
            });
            if (response.data.errcode) {
                throw new Error(`微信API错误: ${response.data.errmsg}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('刷新微信访问令牌失败:', error);
            throw new Error('刷新微信访问令牌失败');
        }
    }
}
exports.WechatOAuthService = WechatOAuthService;
// 导出服务实例
exports.wechatOAuthService = new WechatOAuthService();
//# sourceMappingURL=wechatOAuthService.js.map