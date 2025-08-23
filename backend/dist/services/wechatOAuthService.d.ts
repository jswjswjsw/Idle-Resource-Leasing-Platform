/**
 * 微信OAuth服务类
 * 处理微信登录相关的所有业务逻辑
 */
export declare class WechatOAuthService {
    private readonly appId;
    private readonly appSecret;
    private readonly redirectUri;
    constructor();
    /**
     * 生成微信OAuth授权URL
     * @param state 状态参数，用于防止CSRF攻击
     * @returns 微信授权URL
     */
    generateAuthUrl(state?: string): string;
    /**
     * 生成随机状态参数
     * @returns 随机状态字符串
     */
    private generateState;
    /**
     * 通过授权码获取访问令牌
     * @param code 微信返回的授权码
     * @returns 访问令牌信息
     */
    getAccessToken(code: string): Promise<WechatAccessTokenResponse>;
    /**
     * 获取微信用户信息
     * @param accessToken 访问令牌
     * @param openid 用户openid
     * @returns 微信用户信息
     */
    getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo>;
    /**
     * 处理微信OAuth登录
     * @param code 微信返回的授权码
     * @returns 登录结果
     */
    handleOAuthLogin(code: string): Promise<OAuthLoginResult>;
    /**
     * 创建用户和OAuth账户
     * @param wechatUserInfo 微信用户信息
     * @param oauthData OAuth数据
     * @returns 创建的用户
     */
    private createUserWithOAuth;
    /**
     * 更新OAuth账户信息
     * @param accountId OAuth账户ID
     * @param updateData 更新数据
     */
    private updateOAuthAccount;
    /**
     * 生成唯一的用户名
     * @param nickname 微信昵称
     * @returns 唯一用户名
     */
    private generateUniqueUsername;
    /**
     * 刷新访问令牌
     * @param refreshToken 刷新令牌
     * @returns 新的访问令牌信息
     */
    refreshAccessToken(refreshToken: string): Promise<WechatAccessTokenResponse>;
}
interface WechatAccessTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
}
interface WechatUserInfo {
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid?: string;
}
interface OAuthLoginResult {
    user: {
        id: string;
        username: string;
        email: string;
        avatar: string | null;
        isOAuthUser: boolean;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    isNewUser: boolean;
}
export declare const wechatOAuthService: WechatOAuthService;
export {};
//# sourceMappingURL=wechatOAuthService.d.ts.map