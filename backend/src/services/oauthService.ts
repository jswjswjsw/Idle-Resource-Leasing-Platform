import axios from 'axios';
import { ErrorFactory } from '@/utils/AppError';
import { winstonLogger } from '@/middleware/logger';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/config/cache';
import { userService } from '@/services/userService';

/**
 * OAuth提供商枚举
 */
export enum OAuthProvider {
  GITHUB = 'github',
  GOOGLE = 'google',
  GITEE = 'gitee'
}

/**
 * OAuth用户信息接口
 */
export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: OAuthProvider;
  providerData: any;
}

/**
 * OAuth认证结果接口
 */
export interface OAuthResult {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  isNewUser?: boolean;
  message: string;
}

/**
 * OAuth配置接口
 */
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authUrl: string;
  tokenUrl: string;
  userUrl: string;
}

/**
 * OAuth提供商抽象类
 */
abstract class BaseOAuthProvider {
  protected config: OAuthConfig;
  
  constructor(config: OAuthConfig) {
    this.config = config;
  }

  abstract getAuthUrl(state: string): string;
  abstract exchangeCodeForToken(code: string, state: string): Promise<string>;
  abstract getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
  
  /**
   * 生成随机状态参数
   */
  generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  /**
   * 验证状态参数
   */
  async validateState(state: string): Promise<boolean> {
    const cacheKey = `${CACHE_KEYS.VERIFICATION_CODE}oauth_state:${state}`;
    const cachedState = await cache.get(cacheKey);
    if (cachedState) {
      await cache.del(cacheKey); // 使用后删除
      return true;
    }
    return false;
  }
  
  /**
   * 保存状态参数
   */
  async saveState(state: string): Promise<void> {
    const cacheKey = `${CACHE_KEYS.VERIFICATION_CODE}oauth_state:${state}`;
    await cache.set(cacheKey, { created: Date.now() }, CACHE_TTL.VERIFICATION_CODE);
  }
}

/**
 * GitHub OAuth提供商
 */
class GitHubProvider extends BaseOAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: process.env.GITHUB_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/oauth/github/callback`,
      scope: 'user:email',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userUrl: 'https://api.github.com/user'
    };
    super(config);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      state: state,
      allow_signup: 'true'
    });
    
    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<string> {
    // 验证状态参数
    if (!await this.validateState(state)) {
      throw ErrorFactory.badRequest('无效的状态参数');
    }

    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error_description || response.data.error);
      }

      return response.data.access_token;
    } catch (error) {
      winstonLogger.error('GitHub获取访问令牌失败', { error: error.message });
      throw ErrorFactory.badRequest('获取GitHub访问令牌失败');
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      // 获取用户基本信息
      const userResponse = await axios.get(this.config.userUrl, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'TradeApp'
        }
      });

      // 获取用户邮箱信息
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'TradeApp'
        }
      });

      const user = userResponse.data;
      const emails = emailResponse.data;
      
      // 获取主邮箱
      const primaryEmail = emails.find((email: any) => email.primary)?.email || 
                          emails.find((email: any) => email.verified)?.email ||
                          user.email;

      if (!primaryEmail) {
        throw ErrorFactory.badRequest('无法获取GitHub邮箱信息');
      }

      return {
        id: user.id.toString(),
        email: primaryEmail,
        name: user.name || user.login,
        avatar: user.avatar_url,
        provider: OAuthProvider.GITHUB,
        providerData: {
          login: user.login,
          bio: user.bio,
          location: user.location,
          company: user.company,
          blog: user.blog,
          publicRepos: user.public_repos,
          followers: user.followers,
          following: user.following
        }
      };
    } catch (error) {
      winstonLogger.error('获取GitHub用户信息失败', { error: error.message });
      throw ErrorFactory.badRequest('获取GitHub用户信息失败');
    }
  }
}

/**
 * Google OAuth提供商
 */
class GoogleProvider extends BaseOAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/oauth/google/callback`,
      scope: 'openid email profile',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
    };
    super(config);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<string> {
    if (!await this.validateState(state)) {
      throw ErrorFactory.badRequest('无效的状态参数');
    }

    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      });

      return response.data.access_token;
    } catch (error) {
      winstonLogger.error('Google获取访问令牌失败', { error: error.message });
      throw ErrorFactory.badRequest('获取Google访问令牌失败');
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await axios.get(this.config.userUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const user = response.data;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.picture,
        provider: OAuthProvider.GOOGLE,
        providerData: {
          givenName: user.given_name,
          familyName: user.family_name,
          locale: user.locale,
          verifiedEmail: user.verified_email
        }
      };
    } catch (error) {
      winstonLogger.error('获取Google用户信息失败', { error: error.message });
      throw ErrorFactory.badRequest('获取Google用户信息失败');
    }
  }
}

/**
 * Gitee OAuth提供商（码云）
 */
class GiteeProvider extends BaseOAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.GITEE_CLIENT_ID || '',
      clientSecret: process.env.GITEE_CLIENT_SECRET || '',
      redirectUri: process.env.GITEE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/oauth/gitee/callback`,
      scope: 'user_info emails',
      authUrl: 'https://gitee.com/oauth/authorize',
      tokenUrl: 'https://gitee.com/oauth/token',
      userUrl: 'https://gitee.com/api/v5/user'
    };
    super(config);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      state: state
    });
    
    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<string> {
    if (!await this.validateState(state)) {
      throw ErrorFactory.badRequest('无效的状态参数');
    }

    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      });

      return response.data.access_token;
    } catch (error) {
      winstonLogger.error('Gitee获取访问令牌失败', { error: error.message });
      throw ErrorFactory.badRequest('获取Gitee访问令牌失败');
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await axios.get(`${this.config.userUrl}?access_token=${accessToken}`);
      const user = response.data;

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: OAuthProvider.GITEE,
        providerData: {
          login: user.login,
          bio: user.bio,
          location: user.location,
          company: user.company,
          blog: user.blog,
          publicRepos: user.public_repos,
          followers: user.followers,
          following: user.following
        }
      };
    } catch (error) {
      winstonLogger.error('获取Gitee用户信息失败', { error: error.message });
      throw ErrorFactory.badRequest('获取Gitee用户信息失败');
    }
  }
}

/**
 * OAuth服务类
 */
export class OAuthService {
  private providers: Map<OAuthProvider, BaseOAuthProvider>;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * 初始化OAuth提供商
   */
  private initializeProviders(): void {
    this.providers.set(OAuthProvider.GITHUB, new GitHubProvider());
    this.providers.set(OAuthProvider.GOOGLE, new GoogleProvider());
    this.providers.set(OAuthProvider.GITEE, new GiteeProvider());
  }

  /**
   * 获取OAuth提供商
   */
  private getProvider(provider: OAuthProvider): BaseOAuthProvider {
    const oauthProvider = this.providers.get(provider);
    if (!oauthProvider) {
      throw ErrorFactory.badRequest('不支持的OAuth提供商');
    }
    return oauthProvider;
  }

  /**
   * 获取授权URL
   */
  async getAuthUrl(provider: OAuthProvider): Promise<{ authUrl: string; state: string }> {
    const oauthProvider = this.getProvider(provider);
    const state = oauthProvider.generateState();
    
    // 保存状态参数
    await oauthProvider.saveState(state);
    
    const authUrl = oauthProvider.getAuthUrl(state);
    
    winstonLogger.info('生成OAuth授权URL', { provider, state });
    
    return { authUrl, state };
  }

  /**
   * 处理OAuth回调
   */
  async handleCallback(
    provider: OAuthProvider, 
    code: string, 
    state: string
  ): Promise<OAuthResult> {
    try {
      const oauthProvider = this.getProvider(provider);
      
      // 交换访问令牌
      const accessToken = await oauthProvider.exchangeCodeForToken(code, state);
      
      // 获取用户信息
      const oauthUserInfo = await oauthProvider.getUserInfo(accessToken);
      
      winstonLogger.info('OAuth用户信息获取成功', {
        provider,
        userId: oauthUserInfo.id,
        email: oauthUserInfo.email
      });
      
      // 查找或创建用户
      const result = await this.findOrCreateUser(oauthUserInfo);
      
      return result;
    } catch (error) {
      winstonLogger.error('OAuth回调处理失败', {
        provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 查找或创建用户
   */
  private async findOrCreateUser(oauthUserInfo: OAuthUserInfo): Promise<OAuthResult> {
    try {
      // 先尝试通过邮箱查找用户
      let user = await userService.findUserByEmail(oauthUserInfo.email);
      let isNewUser = false;
      
      if (!user) {
        // 检查是否已通过OAuth提供商注册
        user = await userService.findUserByOAuth(oauthUserInfo.provider, oauthUserInfo.id);
      }
      
      if (!user) {
        // 创建新用户
        user = await userService.createOAuthUser({
          email: oauthUserInfo.email,
          username: oauthUserInfo.name,
          avatar: oauthUserInfo.avatar,
          oauthProvider: oauthUserInfo.provider,
          oauthId: oauthUserInfo.id,
          oauthData: oauthUserInfo.providerData
        });
        isNewUser = true;
        
        winstonLogger.info('通过OAuth创建新用户', {
          userId: user.id,
          email: oauthUserInfo.email,
          provider: oauthUserInfo.provider
        });
      } else {
        // 更新已存在用户的OAuth信息
        await userService.updateOAuthInfo(user.id, {
          oauthProvider: oauthUserInfo.provider,
          oauthId: oauthUserInfo.id,
          oauthData: oauthUserInfo.providerData,
          avatar: oauthUserInfo.avatar || user.avatar
        });
        
        winstonLogger.info('更新用户OAuth信息', {
          userId: user.id,
          email: oauthUserInfo.email,
          provider: oauthUserInfo.provider
        });
      }
      
      // 生成JWT令牌
      const tokens = await userService.generateTokens(user.id);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser,
        message: isNewUser ? 'OAuth注册成功' : 'OAuth登录成功'
      };
    } catch (error) {
      winstonLogger.error('查找或创建OAuth用户失败', {
        email: oauthUserInfo.email,
        provider: oauthUserInfo.provider,
        error: error.message
      });
      throw ErrorFactory.internalServerError('OAuth用户处理失败');
    }
  }

  /**
   * 获取可用的OAuth提供商
   */
  getAvailableProviders(): Array<{provider: OAuthProvider, name: string, configured: boolean}> {
    return [
      {
        provider: OAuthProvider.GITHUB,
        name: 'GitHub',
        configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
      },
      {
        provider: OAuthProvider.GOOGLE,
        name: 'Google',
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      },
      {
        provider: OAuthProvider.GITEE,
        name: 'Gitee',
        configured: !!(process.env.GITEE_CLIENT_ID && process.env.GITEE_CLIENT_SECRET)
      }
    ];
  }

  /**
   * 解绑OAuth账号
   */
  async unlinkOAuth(userId: string, provider: OAuthProvider): Promise<void> {
    try {
      await userService.removeOAuthBinding(userId, provider);
      
      winstonLogger.info('OAuth账号解绑成功', {
        userId,
        provider
      });
    } catch (error) {
      winstonLogger.error('OAuth账号解绑失败', {
        userId,
        provider,
        error: error.message
      });
      throw error;
    }
  }
}

// 导出服务实例
export const oauthService = new OAuthService();