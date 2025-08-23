import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { cache, CACHE_KEYS } from '../config/cache';
import { AppError } from '../utils/errorHandler';
import { verificationService, VerificationCodeType } from './verificationService';
import { emailService } from './emailService';

interface CreateUserData {
  username: string;
  email: string;
  phone: string;
  password: string;
}

interface UpdateUserData {
  username?: string;
  phone?: string;
  avatar?: string;
}

export class UserService {
  private prisma = prisma;

  // 创建用户
  async createUser(data: CreateUserData) {
    const { username, email, phone, password } = data;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { phone: phone || undefined }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError('邮箱已被注册', 409);
      }
      if (existingUser.username === username) {
        throw new AppError('用户名已被使用', 409);
      }
      if (existingUser.phone === phone) {
        throw new AppError('手机号已被注册', 409);
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        creditScore: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // 清除缓存
    await cache.del(`${CACHE_KEYS.USER}${user.id}`);

    return user;
  }

  // 用户登录
  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        addresses: true,
        paymentMethods: true,
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('用户不存在或已被禁用', 401);
    }

    if (!user.password) {
      throw new AppError('该用户未设置密码，请使用第三方登录', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('密码错误', 401);
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 生成JWT访问token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 生成刷新token
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '30d' }
    );

    // 缓存用户信息
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      creditScore: user.creditScore,
      verified: user.verified,
      addresses: user.addresses,
      paymentMethods: user.paymentMethods,
    };

    await cache.set(`${CACHE_KEYS.USER}${user.id}`, userData, 3600); // 缓存1小时

    return {
      token,
      refreshToken,
      user: userData
    };
  }

  // 获取用户信息
  async getUserById(userId: string) {
    // 先尝试从缓存获取
    const cached = await cache.get(`${CACHE_KEYS.USER}${userId}`);
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        paymentMethods: {
          where: { isValid: true }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('用户不存在', 404);
    }

    // 缓存用户信息
    await cache.set(`${CACHE_KEYS.USER}${userId}`, user, 3600);

    return user;
  }

  // 更新用户信息
  async updateUser(userId: string, data: UpdateUserData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        creditScore: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // 更新缓存
    await cache.set(`${CACHE_KEYS.USER}${userId}`, user, 3600);

    return user;
  }

  // 更新信用分数
  async updateCreditScore(userId: string, scoreChange: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const newScore = Math.max(0, Math.min(1000, user.creditScore + scoreChange));

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { creditScore: newScore },
      select: {
        id: true,
        creditScore: true,
      }
    });

    // 更新缓存
    await cache.del(`${CACHE_KEYS.USER}${userId}`);

    return updatedUser;
  }

  // 获取用户信用分数
  async getCreditScore(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditScore: true }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return user.creditScore;
  }

  // 获取用户统计信息
  async getUserStats(userId: string) {
    const [totalResources, totalOrdersAsRenter, totalOrdersAsOwner, averageRating] = await Promise.all([
      prisma.resource.count({
        where: { ownerId: userId }
      }),
      prisma.order.count({
        where: { renterId: userId }
      }),
      prisma.order.count({
        where: { ownerId: userId }
      }),
      prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true }
      })
    ]);

    return {
      totalResources,
      totalOrdersAsRenter,
      totalOrdersAsOwner,
      averageRating: averageRating._avg.rating || 0
    };
  }

  // 验证用户密码
  async validatePassword(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (!user.password) {
      throw new AppError('该用户未设置密码，请使用第三方登录', 400);
    }

    return await bcrypt.compare(password, user.password);
  }

  // 更新密码
  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // 清除缓存
    await cache.del(`${CACHE_KEYS.USER}${userId}`);
  }

  // 刷新token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string; email: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new AppError('用户不存在或已被禁用', 401);
      }

      // 生成新的访问token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // 生成新的刷新token
      const newRefreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '30d' }
      );

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError('无效的刷新token', 401);
    }
  }

  // 发送邮箱验证码
  async sendEmailVerificationCode(email: string) {
    // 检查邮箱是否已被注册
     const existingUser = await this.prisma.user.findUnique({
       where: { email }
     });

    if (existingUser) {
      throw new AppError('该邮箱已被注册', 400);
    }

    // 使用验证码服务发送邮箱验证码
    await verificationService.sendEmailVerificationCode(email, VerificationCodeType.EMAIL_REGISTER);
    
    return true;
  }

  // 验证邮箱
  async verifyEmail(email: string, code: string) {
    // 使用验证码服务验证邮箱验证码
    const isValid = await verificationService.verifyCode(email, code, VerificationCodeType.EMAIL_REGISTER);
    
    if (!isValid) {
      throw new AppError('验证码无效或已过期', 400);
    }

    // 更新用户验证状态
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.userVerification.upsert({
        where: {
          userId_verificationType: {
            userId: user.id,
            verificationType: 'EMAIL'
          }
        },
        update: {
          verified: true,
          verifiedAt: new Date()
        },
        create: {
          userId: user.id,
          verificationType: 'EMAIL',
          verifiedValue: email,
          verified: true,
          verifiedAt: new Date()
        }
      });
    }
    
    return true;
  }

  // 发送手机验证码
  async sendSmsVerificationCode(phone: string) {
    // 检查手机号是否已被注册
     const existingUser = await this.prisma.user.findUnique({
       where: { phone }
     });

    if (existingUser) {
      throw new AppError('该手机号已被注册', 400);
    }

    // 使用验证码服务发送短信验证码
     await verificationService.sendSmsVerificationCode(phone, VerificationCodeType.PHONE_REGISTER);
    
    return true;
  }

  // 验证手机号
  async verifyPhone(phone: string, code: string) {
    // 使用验证码服务验证短信验证码
     const isValid = await verificationService.verifyCode(phone, code, VerificationCodeType.PHONE_REGISTER);
    
    if (!isValid) {
      throw new AppError('验证码无效或已过期', 400);
    }

    // 更新用户验证状态
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user) {
      await prisma.userVerification.upsert({
        where: {
          userId_verificationType: {
            userId: user.id,
            verificationType: 'PHONE'
          }
        },
        update: {
          verified: true,
          verifiedAt: new Date()
        },
        create: {
          userId: user.id,
          verificationType: 'PHONE',
          verifiedValue: phone,
          verified: true,
          verifiedAt: new Date()
        }
      });
    }
    
    return true;
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return true;
    }

    // 使用验证码服务生成密码重置token
     await verificationService.generatePasswordResetToken(email);
    
    return true;
  }

  // 重置密码
  async resetPassword(email: string, token: string, newPassword: string) {
    // 验证重置token
    await verificationService.verifyPasswordResetToken(email, token);

    // 查找用户
     const user = await this.prisma.user.findUnique({
       where: { email }
     });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 更新用户密码
     await this.prisma.user.update({
       where: { id: user.id },
       data: { 
         password: hashedPassword,
         updatedAt: new Date()
       }
     });
    
    // 清除用户缓存
    await cache.del(`${CACHE_KEYS.USER}${user.id}`);

    return true;
  }

  // 软删除用户// 停用用户账户
  async deactivateUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // 清除缓存
    await cache.del(CACHE_KEYS.USER + userId);
  }

  // 获取用户发布的资源
  async getUserResources(userId: string) {
    const resources = await prisma.resource.findMany({
      where: { ownerId: userId },
      include: {
        category: true,
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return resources;
  }

  // 获取用户的订单
  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { renterId: userId },
          { resource: { ownerId: userId } }
        ]
      },
      include: {
        resource: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        renter: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders;
  }

  // 根据手机号查找用户
  async findUserByPhone(phone: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { phone }
      });
      return user;
    } catch (error) {
      console.error('根据手机号查找用户失败:', error);
      throw new AppError('查找用户失败', 500);
    }
  }

  // 通过手机号创建用户（用于手机号验证码登录）
  async createUserByPhone(data: {
    phone: string;
    username: string;
    email?: string | null;
  }) {
    try {
      const { phone, username, email } = data;

      // 检查手机号是否已被注册
      const existingUser = await this.prisma.user.findUnique({
        where: { phone }
      });

      if (existingUser) {
        throw new AppError('手机号已被注册', 409);
      }

      // 检查用户名是否已被使用
      const existingUsername = await this.prisma.user.findUnique({
        where: { username }
      });

      if (existingUsername) {
        // 如果用户名已存在，生成一个唯一的用户名
        const timestamp = Date.now().toString().slice(-6);
        data.username = `${username}_${timestamp}`;
      }

      // 创建新用户
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          phone,
          email: email || `${phone}@temp.com`, // 如果没有邮箱，使用临时邮箱
          password: null, // 手机号登录的用户没有密码
          creditScore: 100 // 默认信用分
        }
      });

      // 清除缓存
      await cache.del(`${CACHE_KEYS.USER}${user.id}`);

      return user;
    } catch (error) {
      console.error('通过手机号创建用户失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建用户失败', 500);
    }
  }

  // 生成JWT token（用于手机号登录）
  async generateTokens(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: true,
          paymentMethods: true
        }
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 更新最后登录时间
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      });

      // 生成JWT访问token
      const token = jwt.sign(
        { userId: user.id, email: user.email, phone: user.phone },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // 生成刷新token
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, phone: user.phone },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '30d' }
      );

      // 缓存用户信息
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        creditScore: user.creditScore,
        verified: user.verified,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
      };

      await cache.set(`${CACHE_KEYS.USER}${user.id}`, userData, 3600); // 缓存1小时

      return {
        token,
        refreshToken
      };
    } catch (error) {
      console.error('生成token失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('生成token失败', 500);
    }
  }
}

export const userService = new UserService();