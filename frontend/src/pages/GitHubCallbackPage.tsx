import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { githubOAuthService, GitHubOAuthService } from '../services/githubOAuthService';
import { useAuth } from '../hooks/useAuth';

/**
 * GitHub OAuth回调页面组件
 * 处理GitHub OAuth认证回调逻辑
 */
const GitHubCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('正在处理GitHub登录...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 从URL获取回调参数
        const params = GitHubOAuthService.getCallbackParams();
        
        if (!params) {
          throw new Error('缺少必要的回调参数');
        }

        const { code, state } = params;

        // 检查是否有错误参数
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || `GitHub授权失败: ${error}`);
        }

        setMessage('正在验证GitHub授权...');

        // 调用后端处理回调
        const response = await githubOAuthService.handleCallback(code, state);

        if (response.success && response.user && response.token) {
          setStatus('success');
          setMessage('GitHub登录成功！正在跳转...');

          // 保存用户信息和令牌
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));

          // 更新认证状态
          // 将GitHub OAuth用户信息适配为完整的User类型
          const adaptedUser = {
            ...response.user,
            phone: '', // GitHub OAuth不提供手机号
            creditScore: 100, // 默认信用分
            verified: response.user.isEmailVerified, // 使用邮箱验证状态
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setUser(adaptedUser);
          setToken(response.token);

          // 清理URL参数
          GitHubOAuthService.cleanupUrl();

          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          throw new Error(response.message || 'GitHub登录失败');
        }
      } catch (error) {
        console.error('GitHub OAuth回调处理失败:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'GitHub登录处理失败，请重试'
        );

        // 清理URL参数
        GitHubOAuthService.cleanupUrl();

        // 3秒后跳转到登录页
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, setUser, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* GitHub图标 */}
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-900">
            <svg
              className="h-8 w-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            GitHub 登录
          </h2>

          {/* 状态显示 */}
          <div className="mt-8">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                {/* 加载动画 */}
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                {/* 成功图标 */}
                <div className="rounded-full h-8 w-8 bg-green-100 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm text-green-600 font-medium">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                {/* 错误图标 */}
                <div className="rounded-full h-8 w-8 bg-red-100 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-600 font-medium">{message}</p>
                <p className="text-xs text-gray-500">3秒后自动跳转到登录页...</p>
              </div>
            )}
          </div>

          {/* 手动跳转按钮 */}
          {status === 'error' && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/auth', { replace: true })}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                返回登录页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubCallbackPage;