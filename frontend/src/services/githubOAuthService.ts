import { API_BASE_URL } from '../config/api';

/**
 * GitHub OAuth回调响应接口
 */
interface GitHubOAuthCallbackResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
    nickname: string;
    avatar: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  token?: string;
  error?: string;
}

/**
 * GitHub OAuth授权URL响应接口
 */
interface GitHubAuthUrlResponse {
  success: boolean;
  authUrl: string;
  state: string;
  message?: string;
  error?: string;
}

/**
 * GitHub OAuth服务类
 * 处理GitHub OAuth认证相关的前端逻辑
 */
export class GitHubOAuthService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * 获取GitHub OAuth授权URL
   * @returns Promise<GitHubAuthUrlResponse>
   */
  async getAuthUrl(): Promise<GitHubAuthUrlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/github/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP错误: ${response.status}`);
      }

      // 保存state到本地存储，用于后续验证
      if (data.state) {
        localStorage.setItem('github_oauth_state', data.state);
      }

      return data;
    } catch (error) {
      console.error('获取GitHub授权URL失败:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : '获取GitHub授权URL时发生未知错误'
      );
    }
  }

  /**
   * 处理GitHub OAuth回调
   * @param code 授权码
   * @param state 状态参数
   * @returns Promise<GitHubOAuthCallbackResponse>
   */
  async handleCallback(code: string, state: string): Promise<GitHubOAuthCallbackResponse> {
    try {
      // 验证state参数
      const savedState = localStorage.getItem('github_oauth_state');
      if (savedState !== state) {
        throw new Error('状态参数验证失败，可能存在安全风险');
      }

      const response = await fetch(`${this.baseUrl}/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP错误: ${response.status}`);
      }

      // 清除本地存储的state
      localStorage.removeItem('github_oauth_state');

      return data;
    } catch (error) {
      console.error('GitHub OAuth回调处理失败:', error);
      // 清除本地存储的state
      localStorage.removeItem('github_oauth_state');
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'GitHub OAuth回调处理时发生未知错误'
      );
    }
  }

  /**
   * 绑定GitHub账户到现有用户
   * @param code 授权码
   * @param state 状态参数
   * @param userId 用户ID
   * @returns Promise<GitHubOAuthCallbackResponse>
   */
  async bindAccount(code: string, state: string, userId: string): Promise<GitHubOAuthCallbackResponse> {
    try {
      // 验证state参数
      const savedState = localStorage.getItem('github_oauth_state');
      if (savedState !== state) {
        throw new Error('状态参数验证失败，可能存在安全风险');
      }

      const response = await fetch(`${this.baseUrl}/api/auth/github/bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          state,
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP错误: ${response.status}`);
      }

      // 清除本地存储的state
      localStorage.removeItem('github_oauth_state');

      return data;
    } catch (error) {
      console.error('GitHub账户绑定失败:', error);
      // 清除本地存储的state
      localStorage.removeItem('github_oauth_state');
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'GitHub账户绑定时发生未知错误'
      );
    }
  }

  /**
   * 解绑GitHub账户
   * @param userId 用户ID
   * @returns Promise<GitHubOAuthCallbackResponse>
   */
  async unbindAccount(userId: string): Promise<GitHubOAuthCallbackResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/github/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP错误: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('GitHub账户解绑失败:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'GitHub账户解绑时发生未知错误'
      );
    }
  }

  /**
   * 检查是否在GitHub授权回调页面
   * @returns boolean
   */
  static isGitHubCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state') && window.location.pathname.includes('/auth/github/callback');
  }

  /**
   * 从URL获取GitHub OAuth回调参数
   * @returns {code: string, state: string} | null
   */
  static getCallbackParams(): { code: string; state: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      return { code, state };
    }

    return null;
  }

  /**
   * 清理URL中的OAuth参数
   */
  static cleanupUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    
    // 使用replaceState避免在浏览器历史中留下OAuth参数
    window.history.replaceState({}, document.title, url.toString());
  }

  /**
   * 检查GitHub OAuth是否配置正确
   * @returns Promise<boolean>
   */
  async isConfigured(): Promise<boolean> {
    try {
      const response = await this.getAuthUrl();
      return response.success && !!response.authUrl;
    } catch (error) {
      console.warn('GitHub OAuth配置检查失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const githubOAuthService = new GitHubOAuthService();