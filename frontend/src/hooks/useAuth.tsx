import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { userService } from '../services/api';

// 认证上下文
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  refetchUser: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // 获取当前用户信息
  const {
    data: userData,
    isLoading,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!localStorage.getItem('token'),
    retry: 1,
  });

  // 登录mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      userService.login({ email, password }),
    onSuccess: (data) => {
      if (data.success) {
        setIsAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
  });

  // 注册mutation
  const registerMutation = useMutation({
    mutationFn: (data: {
      username: string;
      email: string;
      phone: string;
      password: string;
      confirmPassword: string;
    }) => userService.register(data),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
  });

  // 更新用户信息mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: Partial<User>) => userService.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // 更新认证状态
  useEffect(() => {
    const token = currentToken || localStorage.getItem('token');
    const user = currentUser || userData?.data;
    setIsAuthenticated(!!token && !!user);
  }, [userData, currentUser, currentToken]);

  // 初始化时从localStorage获取token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !currentToken) {
      setCurrentToken(storedToken);
    }
  }, [currentToken]);

  // 登录函数
  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (error) {
      throw error;
    }
  };

  // 注册函数
  const register = async (data: {
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    queryClient.clear();
    window.location.href = '/';
  };

  // 更新用户信息函数
  const updateUser = async (data: Partial<User>) => {
    try {
      await updateUserMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  // 手动设置用户信息（用于OAuth登录）
  const setUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      queryClient.setQueryData(['currentUser'], { data: user, success: true });
    } else {
      queryClient.removeQueries({ queryKey: ['currentUser'] });
    }
  };

  // 手动设置令牌（用于OAuth登录）
  const setToken = (token: string | null) => {
    setCurrentToken(token);
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  const value: AuthContextType = {
    user: currentUser || userData?.data || null,
    token: currentToken || localStorage.getItem('token'),
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refetchUser,
    setUser,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 使用认证hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider中使用');
  }
  return context;
};