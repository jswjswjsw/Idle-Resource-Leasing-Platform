import axios from 'axios';

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
export class GitHubOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scope: string;

  constructor() {
    // 从环境变量获取GitHub OAuth配置
    this.clientId = process.env.GITHUB_OAUTH_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/github/callback';
    this.scope = 'user:email'; // 请求用户基本信息和邮箱权限

    // 验证配置完整性
    if (!this.clientId || !this.clientSecret) {
      console.warn('GitHub OAuth配置不完整，请检查环境变量 GITHUB_OAUTH_CLIENT_ID 和 GITHUB_OAUTH_CLIENT_SECRET');
    }

    // 检查是否使用占位符值
    if (this.clientId === 'your_github_client_id' || 
        this.clientSecret === 'your_github_client_secret') {
      throw new Error('请配置真实的GitHub OAuth应用信息，当前使用的是占位符值');
    }
  }

  /**
   * 生成GitHub OAuth授权URL
   * @param state 随机状态参数，用于防止CSRF攻击
   * @returns GitHub授权URL
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: state,
      allow_signup: 'true' // 允许用户注册新的GitHub账户
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * 使用授权码获取访问令牌
   * @param code 授权码
   * @param state 状态参数
   * @returns 访问令牌信息
   */
  async getAccessToken(code: string, state: string): Promise<GitHubTokenResponse> {
    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
          state: state
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        }
      );

      if (response.data.error) {
        throw new Error(`GitHub OAuth错误: ${response.data.error_description || response.data.error}`);
      }

      if (!response.data.access_token) {
        throw new Error('未能获取到访问令牌');
      }

      return response.data;
    } catch (error) {
      console.error('获取GitHub访问令牌失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`GitHub API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          throw new Error('无法连接到GitHub服务器，请检查网络连接');
        }
      }
      throw new Error('获取访问令牌时发生未知错误');
    }
  }

  /**
   * 使用访问令牌获取用户信息
   * @param accessToken 访问令牌
   * @returns GitHub用户信息
   */
  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    try {
      // 获取用户基本信息
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Trade-Platform-App'
        },
        timeout: 10000 // 10秒超时
      });

      const user = userResponse.data;

      // 如果用户的主邮箱不公开，尝试获取邮箱列表
      if (!user.email) {
        try {
          const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Trade-Platform-App'
            },
            timeout: 5000 // 5秒超时
          });

          // 查找主邮箱或已验证的邮箱
          const emails = emailResponse.data;
          const primaryEmail = emails.find((email: any) => email.primary && email.verified);
          const verifiedEmail = emails.find((email: any) => email.verified);
          
          user.email = primaryEmail?.email || verifiedEmail?.email || null;
        } catch (emailError) {
          console.warn('获取GitHub用户邮箱失败:', emailError);
          // 邮箱获取失败不影响主流程
        }
      }

      return user;
    } catch (error) {
      console.error('获取GitHub用户信息失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            throw new Error('GitHub访问令牌无效或已过期');
          } else if (error.response.status === 403) {
            throw new Error('GitHub API访问受限，请稍后重试');
          }
          throw new Error(`GitHub API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          throw new Error('无法连接到GitHub API服务器，请检查网络连接');
        }
      }
      throw new Error('获取用户信息时发生未知错误');
    }
  }

  /**
   * 验证访问令牌是否有效
   * @param accessToken 访问令牌
   * @returns 是否有效
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Trade-Platform-App'
        },
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 撤销访问令牌
   * @param accessToken 访问令牌
   */
  async revokeAccessToken(accessToken: string): Promise<void> {
    try {
      await axios.delete(`https://api.github.com/applications/${this.clientId}/token`, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        data: {
          access_token: accessToken
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Trade-Platform-App'
        },
        timeout: 5000
      });
    } catch (error) {
      console.error('撤销GitHub访问令牌失败:', error);
      // 撤销失败不抛出错误，因为令牌可能已经过期
    }
  }
}