// Express类型扩展
// 为Express Request对象添加user属性

import { Request } from 'express';

// JWT载荷接口
interface JwtPayload {
  userId: string;
  email: string;
  id: string; // 添加id属性以兼容现有代码
}

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export { JwtPayload };