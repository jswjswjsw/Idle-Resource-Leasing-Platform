/**
 * GitHub用户信息接口
 */
interface GitHubUser {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    blog: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
}
/**
 * GitHub访问令牌响应接口
 */
interface GitHubTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
}
/**
 * GitHub OAuth服务类
 * 处理GitHub OAuth认证流程
 */
export declare class GitHubOAuthService {
    private readonly clientId;
    private readonly clientSecret;
    private readonly redirectUri;
    private readonly scope;
    constructor();
    /**
     * 生成GitHub OAuth授权URL
     * @param state 随机状态参数，用于防止CSRF攻击
     * @returns GitHub授权URL
     */
    generateAuthUrl(state: string): string;
    /**
     * 使用授权码获取访问令牌
     * @param code 授权码
     * @param state 状态参数
     * @returns 访问令牌信息
     */
    getAccessToken(code: string, state: string): Promise<GitHubTokenResponse>;
    /**
     * 使用访问令牌获取用户信息
     * @param accessToken 访问令牌
     * @returns GitHub用户信息
     */
    getUserInfo(accessToken: string): Promise<GitHubUser>;
    /**
     * 验证访问令牌是否有效
     * @param accessToken 访问令牌
     * @returns 是否有效
     */
    validateAccessToken(accessToken: string): Promise<boolean>;
    /**
     * 撤销访问令牌
     * @param accessToken 访问令牌
     */
    revokeAccessToken(accessToken: string): Promise<void>;
}
export {};
//# sourceMappingURL=githubOAuthService.d.ts.map