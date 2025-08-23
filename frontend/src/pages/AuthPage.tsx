import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import WechatOAuthService from '../services/wechatOAuthService';
import { githubOAuthService } from '../services/githubOAuthService';

/**
 * 认证页面组件
 * 提供用户注册和登录功能，包含表单验证和动画效果
 */
const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isWechatLoading, setIsWechatLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const { login, register, setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (activeTab === 'register') {
      if (!formData.username.trim()) {
        newErrors.username = '请输入用户名';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = '请输入手机号';
      } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = '请输入正确的手机号';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = '请同意服务条款';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入正确的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理微信OAuth回调
  useEffect(() => {
    const handleWechatCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (code && state) {
        setIsWechatLoading(true);
        try {
          const response = await WechatOAuthService.handleCallback(code, state);
          
          // 保存用户信息和令牌
          setUser(response.user);
          setToken(response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          toast.success('微信登录成功！');
          navigate('/');
        } catch (error: any) {
          console.error('微信登录回调处理失败:', error);
          toast.error(error.message || '微信登录失败，请重试');
          // 清除URL参数
          navigate('/auth', { replace: true });
        } finally {
          setIsWechatLoading(false);
        }
      }
    };
    
    handleWechatCallback();
  }, [searchParams, navigate, setUser, setToken]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        if (activeTab === 'login') {
          await login(formData.email, formData.password);
          toast.success('登录成功！');
          navigate('/');
        } else {
          await register({
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          });
          toast.success('注册成功！请登录');
          setActiveTab('login');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '操作失败，请稍后重试';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 处理GitHub登录
  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    try {
      // 获取GitHub授权URL
      const response = await githubOAuthService.getAuthUrl();
      
      if (!response.success || !response.authUrl) {
        throw new Error(response.message || 'GitHub OAuth配置错误');
      }
      
      // 打开GitHub授权页面
      const authWindow = window.open(
        response.authUrl,
        'github_auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      if (!authWindow) {
        throw new Error('无法打开授权窗口，请检查浏览器弹窗设置');
      }
      
      // 监听授权窗口关闭
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          setIsGithubLoading(false);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('GitHub登录失败:', error);
      toast.error(error.message || 'GitHub登录失败，请重试');
      setIsGithubLoading(false);
    }
  };

  // 处理微信登录
  const handleWechatLogin = async () => {
    setIsWechatLoading(true);
    try {
      // 检测是否为微信浏览器环境
      if (WechatOAuthService.isWechatBrowser()) {
        // 在微信浏览器中，直接跳转到授权页面
        const authUrl = await WechatOAuthService.getAuthUrl(window.location.origin + '/auth');
        window.location.href = authUrl;
      } else {
        // 在普通浏览器中，打开新窗口进行授权
        const authUrl = await WechatOAuthService.getAuthUrl(window.location.origin + '/auth');
        
        // 打开授权窗口
        const authWindow = window.open(
          authUrl,
          'wechat_auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!authWindow) {
          throw new Error('无法打开授权窗口，请检查浏览器弹窗设置');
        }
        
        // 监听授权窗口关闭
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            setIsWechatLoading(false);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('微信登录失败:', error);
      toast.error(error.message || '微信登录失败，请重试');
      setIsWechatLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 表单字段配置
  const loginFields = [
    {
      name: 'email',
      type: 'email',
      placeholder: '请输入邮箱地址',
      icon: Mail,
      label: '邮箱地址'
    },
    {
      name: 'password',
      type: 'password',
      placeholder: '请输入密码',
      icon: Lock,
      label: '密码'
    }
  ];

  const registerFields = [
    {
      name: 'username',
      type: 'text',
      placeholder: '请输入用户名',
      icon: User,
      label: '用户名'
    },
    {
      name: 'email',
      type: 'email',
      placeholder: '请输入邮箱地址',
      icon: Mail,
      label: '邮箱地址'
    },
    {
      name: 'phone',
      type: 'tel',
      placeholder: '请输入手机号',
      icon: Phone,
      label: '手机号'
    },
    {
      name: 'password',
      type: 'password',
      placeholder: '请输入密码（至少6位）',
      icon: Lock,
      label: '密码'
    },
    {
      name: 'confirmPassword',
      type: 'password',
      placeholder: '请再次输入密码',
      icon: Lock,
      label: '确认密码'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Logo 和标题 */}
          <div className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="text-white font-bold text-xl">租</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2"
            >
              闲置租赁平台
            </h1>
            <p className="text-neutral-600"
            >
              {activeTab === 'login' ? '欢迎回来，请登录您的账户' : '创建新账户，开始租赁之旅'}
            </p>
          </div>

          {/* Tab 切换 */}
          <div className="flex bg-neutral-100 rounded-lg p-1 mb-6"
          >
            <button
              onClick={() => setActiveTab('login')}
              className={cn(
                "flex-1 py-2 rounded-md font-medium transition-colors",
                activeTab === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={cn(
                "flex-1 py-2 rounded-md font-medium transition-colors",
                activeTab === 'register'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4"
          >
            <AnimatePresence mode="wait"
            >
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* 动态表单字段 */}
                {(activeTab === 'login' ? loginFields : registerFields).map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <label className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                      {field.label}
                    </label>
                    <div className="relative"
                    >
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <field.icon className="h-5 w-5 text-neutral-400" />
                      </div>
                      <input
                        type={field.name === 'password' || field.name === 'confirmPassword' ? 
                          (showPassword ? 'text' : 'password') : field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name as keyof typeof formData] as string}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className={cn(
                          "block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                          errors[field.name] ? "border-red-500" : "border-neutral-300"
                        )}
                      />
                      {(field.name === 'password' || field.name === 'confirmPassword') && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-neutral-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-neutral-400" />
                          )}
                        </button>
                      )}
                    </div>
                    {errors[field.name] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors[field.name]}
                      </p>
                    )}
                  </motion.div>
                ))}

                {/* 注册时的服务条款 */}
                {activeTab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start"
                  >
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                    />
                    <label htmlFor="agreeTerms" className="ml-2 text-sm text-neutral-600"
                    >
                      我已阅读并同意 <a href="#" className="text-primary-600 hover:text-primary-700">服务条款</a> 和 <a href="#" className="text-primary-600 hover:text-primary-700">隐私政策</a>
                    </label>
                  </motion.div>
                )}

                {/* 忘记密码 */}
                {activeTab === 'login' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-right"
                  >
                    <a href="#" className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      忘记密码？
                    </a>
                  </motion.div>
                )}

                {/* 提交按钮 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="ml-2">{activeTab === 'login' ? '登录中...' : '注册中...'}</span>
                    </div>
                  ) : (
                    activeTab === 'login' ? '登录' : '注册'
                  )}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </form>

          {/* 社交登录 */}
          <div className="mt-6"
          >
            <div className="relative"
            >
              <div className="absolute inset-0 flex items-center"
              >
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm"
              >
                <span className="px-2 bg-white text-neutral-500">或</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3"
            >
              <button 
                type="button"
                onClick={handleGithubLogin}
                disabled={isLoading || isWechatLoading || isGithubLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGithubLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                ) : (
                  <svg className="w-5 h-5 mr-2 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                )}
                {isGithubLoading ? '登录中...' : 'GitHub'}
              </button>
              <button 
                type="button"
                disabled={isLoading || isWechatLoading || isGithubLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img className="w-5 h-5 mr-2" src="https://www.google.com/favicon.ico" alt="Google" />
                Google
              </button>
              <button 
                type="button"
                onClick={handleWechatLogin}
                disabled={isLoading || isWechatLoading || isGithubLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isWechatLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                ) : (
                  <svg className="w-5 h-5 mr-2 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.298c-.115.379.213.665.547.475l1.767-.665a.743.743 0 0 1 .665 0 13.044 13.044 0 0 0 3.887.665c4.8 0 8.691-3.288 8.691-7.342 0-4.054-3.891-7.342-8.691-7.342zm-2.44 9.544c-.665 0-1.17-.475-1.17-1.17 0-.665.505-1.17 1.17-1.17.665 0 1.17.505 1.17 1.17 0 .695-.505 1.17-1.17 1.17zm4.8 0c-.665 0-1.17-.475-1.17-1.17 0-.665.505-1.17 1.17-1.17.665 0 1.17.505 1.17 1.17 0 .695-.505 1.17-1.17 1.17z"/>
                    <path d="M15.724 9.53c0-.665.505-1.17 1.17-1.17.665 0 1.17.505 1.17 1.17 0 .665-.505 1.17-1.17 1.17-.665 0-1.17-.505-1.17-1.17z"/>
                    <path d="M20.524 9.53c0-.665.505-1.17 1.17-1.17.665 0 1.17.505 1.17 1.17 0 .665-.505 1.17-1.17 1.17-.665 0-1.17-.505-1.17-1.17z"/>
                    <path d="M24 14.456c0-3.288-2.936-5.93-6.564-5.93-3.628 0-6.564 2.642-6.564 5.93 0 3.288 2.936 5.93 6.564 5.93a10.689 10.689 0 0 0 2.998-.475.743.743 0 0 1 .665 0l1.368.475c.285.095.57-.095.475-.38l-.285-1.078a.59.59 0 0 1 .213-.665c1.473-1.078 2.13-2.832 2.13-4.807z"/>
                  </svg>
                )}
                {isWechatLoading ? '登录中...' : '微信'}
              </button>
            </div>
          </div>

          {/* 底部提示 */}
          <p className="mt-6 text-center text-sm text-neutral-600"
          >
            {activeTab === 'login' ? (
              <>
                还没有账户？ <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账户？ <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  立即登录
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;