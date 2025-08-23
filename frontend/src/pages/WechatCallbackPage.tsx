import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WechatOAuthService } from '../services/wechatOAuthService';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

/**
 * 微信OAuth回调页面组件
 * 处理微信授权后的回调逻辑
 */
const WechatCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 从URL参数中获取授权码和状态
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // 检查是否有错误参数
        if (errorParam) {
          throw new Error(errorDescription || '微信授权失败');
        }

        // 检查必需参数
        if (!code || !state) {
          throw new Error('缺少必要的授权参数');
        }

        // 调用后端处理回调
        const response = await WechatOAuthService.handleCallback(code, state);
        
        // 保存用户信息和令牌
        setUser(response.user);
        setToken(response.token);
        
        // 显示成功消息
        toast.success('微信登录成功！');
        
        // 跳转到首页或用户指定的页面
        const redirectTo = localStorage.getItem('wechat_redirect_after_login') || '/';
        localStorage.removeItem('wechat_redirect_after_login');
        navigate(redirectTo, { replace: true });
      } catch (error) {
        console.error('微信OAuth回调处理失败:', error);
        const errorMessage = error instanceof Error ? error.message : '微信登录失败';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser, setToken]);

  // 渲染加载状态
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">正在处理微信登录...</h2>
          <p className="text-gray-600">请稍候，我们正在验证您的身份</p>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">登录失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">3秒后将自动跳转到登录页面...</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            立即返回登录
          </button>
        </div>
      </div>
    );
  }

  // 正常情况下不应该到达这里
  return null;
};

export default WechatCallbackPage;