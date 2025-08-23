import jwt from 'jsonwebtoken';

/**
 * JWT工具函数
 * 用于生成和验证JWT令牌
 */

// JWT配置
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * 生成访问令牌和刷新令牌
 * @param userId 用户ID
 * @returns 包含访问令牌和刷新令牌的对象
 */
export function generateToken(userId: string): {
  accessToken: string;
  refreshToken: string;
} {
  // 生成访问令牌
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 生成刷新令牌
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * 验证访问令牌
 * @param token 访问令牌
 * @returns 解码后的令牌数据
 */
export function verifyAccessToken(token: string): {
  userId: string;
  type: string;
  iat: number;
  exp: number;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'access') {
      throw new Error('无效的令牌类型');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('访问令牌验证失败');
  }
}

/**
 * 验证刷新令牌
 * @param token 刷新令牌
 * @returns 解码后的令牌数据
 */
export function verifyRefreshToken(token: string): {
  userId: string;
  type: string;
  iat: number;
  exp: number;
} {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('无效的令牌类型');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('刷新令牌验证失败');
  }
}

/**
 * 从请求头中提取Bearer令牌
 * @param authHeader Authorization请求头
 * @returns 提取的令牌，如果没有则返回null
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * 检查令牌是否即将过期（在指定时间内）
 * @param token 令牌
 * @param thresholdMinutes 阈值分钟数，默认30分钟
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 30): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.exp) {
      return true; // 如果无法解码或没有过期时间，认为需要刷新
    }
    
    const expirationTime = decoded.exp * 1000; // 转换为毫秒
    const currentTime = Date.now();
    const thresholdTime = thresholdMinutes * 60 * 1000; // 转换为毫秒
    
    return (expirationTime - currentTime) <= thresholdTime;
  } catch (error) {
    return true; // 如果出错，认为需要刷新
  }
}

/**
 * 生成用于OAuth状态验证的随机字符串
 * @param length 字符串长度，默认32
 * @returns 随机字符串
 */
export function generateOAuthState(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * 令牌类型枚举
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

/**
 * JWT令牌接口
 */
export interface JWTPayload {
  userId: string;
  type: TokenType;
  iat: number;
  exp: number;
}

/**
 * 令牌对接口
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}