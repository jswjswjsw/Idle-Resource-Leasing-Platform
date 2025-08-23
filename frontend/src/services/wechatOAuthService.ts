/**
 * 微信OAuth登录服务
 * 处理微信登录的前端逻辑，包括获取授权URL、处理回调等
 */

import { API_BASE_URL } from '../config/api';
import { ApiResponse } from '../types/api';

/**
 * 微信OAuth响应数据类型
 */
export interface WechatOAuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
    creditScore: number;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

/**
 * 微信用户信息类型
 */
export interface WechatUserInfo {
  openid: string;
  nickname: string;
  headimgurl?: string;
  unionid?: string;
}

/**
 * 微信OAuth服务类
 */
export class WechatOAuthService {
  private static readonly STORAGE_KEY = 'wechat_oauth_state';

  /**
   * 获取微信授权URL
   * @param redirectUri 回调地址
   * @returns Promise<string> 授权URL
   */
  static async getAuthUrl(redirectUri?: string): Promise<string> {
    try {
      const params = new URLSearchParams();
      if (redirectUri) {
        params.append('redirectUri', redirectUri);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/wechat/login?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取授权URL失败');
      }

      const data: ApiResponse<{ authUrl: string; state: string }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '获取授权URL失败');
      }

      // 保存state到本地存储，用于验证回调
      localStorage.setItem(this.STORAGE_KEY, data.data.state);
      
      return data.data.authUrl;
    } catch (error) {
      console.error('获取微信授权URL失败:', error);
      throw error;
    }
  }

  /**
   * 处理微信OAuth回调
   * @param code 授权码
   * @param state 状态参数
   * @returns Promise<WechatOAuthResponse> 登录响应
   */
  static async handleCallback(code: string, state: string): Promise<WechatOAuthResponse> {
    try {
      // 验证state参数
      const storedState = localStorage.getItem(this.STORAGE_KEY);
      if (!storedState || storedState !== state) {
        throw new Error('状态参数验证失败，可能存在安全风险');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/wechat/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error('微信登录失败');
      }

      const data: ApiResponse<WechatOAuthResponse> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '微信登录失败');
      }

      // 清除存储的state
      localStorage.removeItem(this.STORAGE_KEY);
      
      return data.data;
    } catch (error) {
      console.error('微信OAuth回调处理失败:', error);
      throw error;
    }
  }

  /**
   * 移动端微信登录
   * @param code 授权码
   * @returns Promise<WechatOAuthResponse> 登录响应
   */
  static async mobileLogin(code: string): Promise<WechatOAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/wechat/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('微信登录失败');
      }

      const data: ApiResponse<WechatOAuthResponse> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '微信登录失败');
      }
      
      return data.data;
    } catch (error) {
      console.error('移动端微信登录失败:', error);
      throw error;
    }
  }

  /**
   * 绑定微信账户
   * @param code 授权码
   * @param accessToken 用户访问令牌
   * @returns Promise<boolean> 绑定结果
   */
  static async bindWechat(code: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/wechat/bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('绑定微信账户失败');
      }

      const data: ApiResponse<{ success: boolean }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '绑定微信账户失败');
      }
      
      return data.data.success;
    } catch (error) {
      console.error('绑定微信账户失败:', error);
      throw error;
    }
  }

  /**
   * 解绑微信账户
   * @param accessToken 用户访问令牌
   * @returns Promise<boolean> 解绑结果
   */
  static async unbindWechat(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/wechat/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('解绑微信账户失败');
      }

      const data: ApiResponse<{ success: boolean }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '解绑微信账户失败');
      }
      
      return data.data.success;
    } catch (error) {
      console.error('解绑微信账户失败:', error);
      throw error;
    }
  }

  /**
   * 获取微信绑定状态
   * @param accessToken 用户访问令牌
   * @returns Promise<boolean> 绑定状态
   */
  static async getBindStatus(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/wechat/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取绑定状态失败');
      }

      const data: ApiResponse<{ isBound: boolean; wechatInfo?: WechatUserInfo }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '获取绑定状态失败');
      }
      
      return data.data.isBound;
    } catch (error) {
      console.error('获取微信绑定状态失败:', error);
      throw error;
    }
  }

  /**
   * 检测是否为微信浏览器环境
   * @returns boolean 是否为微信浏览器
   */
  static isWechatBrowser(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
  }

  /**
   * 检测是否为移动端
   * @returns boolean 是否为移动端
   */
  static isMobile(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return /mobile|android|iphone|ipad|phone/i.test(ua);
  }

  /**
   * 清除OAuth相关的本地存储
   */
  static clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export default WechatOAuthService;