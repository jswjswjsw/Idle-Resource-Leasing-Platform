import { cache, CACHE_KEYS, CACHE_TTL } from '..//config/cache';
import { AppError } from '..//utils/errorHandler';
import { emailService } from './emailService';
import { smsService } from './smsService';
import crypto from 'crypto';

/**
 * 验证码类型枚举
 */
export enum VerificationCodeType {
  EMAIL_REGISTER = 'email_register',
  EMAIL_LOGIN = 'email_login',
  EMAIL_RESET_PASSWORD = 'email_reset_password',
  PHONE_REGISTER = 'phone_register',
  PHONE_LOGIN = 'phone_login',
  PHONE_BIND = 'phone_bind'
}

/**
 * 验证码服务类
 * 负责验证码的生成、发送、验证和管理
 */
export class VerificationService {
  private readonly CODE_LENGTH = 6; // 验证码长度
  private readonly CODE_EXPIRE_TIME = 300; // 验证码过期时间（秒）
  private readonly MAX_SEND_COUNT = 5; // 每小时最大发送次数
  private readonly SEND_INTERVAL = 60; // 发送间隔（秒）

  /**
   * 生成数字验证码
   * @param length 验证码长度
   */
  private generateCode(length: number = this.CODE_LENGTH): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * 生成重置token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 获取验证码缓存键
   * @param type 验证码类型
   * @param target 目标（邮箱或手机号）
   */
  private getCodeCacheKey(type: VerificationCodeType, target: string): string {
    return `${CACHE_KEYS.VERIFICATION_CODE}${type}:${target}`;
  }

  /**
   * 获取发送次数缓存键
   * @param type 验证码类型
   * @param target 目标（邮箱或手机号）
   */
  private getSendCountCacheKey(type: VerificationCodeType, target: string): string {
    return `${CACHE_KEYS.VERIFICATION_SEND_COUNT}${type}:${target}`;
  }

  /**
   * 获取最后发送时间缓存键
   * @param type 验证码类型
   * @param target 目标（邮箱或手机号）
   */
  private getLastSendTimeCacheKey(type: VerificationCodeType, target: string): string {
    return `${CACHE_KEYS.VERIFICATION_LAST_SEND}${type}:${target}`;
  }

  /**
   * 检查发送限制
   * @param type 验证码类型
   * @param target 目标（邮箱或手机号）
   */
  private async checkSendLimits(type: VerificationCodeType, target: string): Promise<void> {
    const sendCountKey = this.getSendCountCacheKey(type, target);
    const lastSendTimeKey = this.getLastSendTimeCacheKey(type, target);

    // 检查发送间隔
    const lastSendTime = await cache.get(lastSendTimeKey);
    if (lastSendTime) {
      const timeDiff = Date.now() - parseInt(lastSendTime);
      if (timeDiff < this.SEND_INTERVAL * 1000) {
        const remainingTime = Math.ceil((this.SEND_INTERVAL * 1000 - timeDiff) / 1000);
        throw new AppError(`请等待${remainingTime}秒后再试`, 429);
      }
    }

    // 检查每小时发送次数
    const sendCount = await cache.get(sendCountKey);
    if (sendCount && parseInt(sendCount) >= this.MAX_SEND_COUNT) {
      throw new AppError('发送次数过多，请1小时后再试', 429);
    }
  }

  /**
   * 更新发送记录
   * @param type 验证码类型
   * @param target 目标（邮箱或手机号）
   */
  private async updateSendRecord(type: VerificationCodeType, target: string): Promise<void> {
    const sendCountKey = this.getSendCountCacheKey(type, target);
    const lastSendTimeKey = this.getLastSendTimeCacheKey(type, target);

    // 更新发送次数
    const currentCount = await cache.get(sendCountKey);
    const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
    await cache.set(sendCountKey, newCount.toString(), 3600); // 1小时过期

    // 更新最后发送时间
    await cache.set(lastSendTimeKey, Date.now().toString(), this.SEND_INTERVAL);
  }

  /**
   * 发送邮箱验证码
   * @param email 邮箱地址
   * @param type 验证码类型
   */
  async sendEmailVerificationCode(email: string, type: VerificationCodeType): Promise<void> {
    // 检查发送限制
    await this.checkSendLimits(type, email);

    // 生成验证码
    const code = this.generateCode();
    const cacheKey = this.getCodeCacheKey(type, email);

    // 存储验证码到缓存
    await cache.set(cacheKey, code, this.CODE_EXPIRE_TIME);

    // 发送邮件
    await emailService.sendVerificationCode(email, code);

    // 更新发送记录
    await this.updateSendRecord(type, email);

    console.log(`邮箱验证码已发送: ${email}, 类型: ${type}`);
  }

  /**
   * 发送手机验证码
   * @param phone 手机号
   * @param type 验证码类型
   */
  async sendSmsVerificationCode(phone: string, type: VerificationCodeType): Promise<void> {
    // 验证手机号格式
    if (!smsService.validatePhoneNumber(phone)) {
      throw new AppError('手机号格式不正确', 400);
    }

    // 检查发送限制
    await this.checkSendLimits(type, phone);

    // 生成验证码
    const code = this.generateCode();
    const cacheKey = this.getCodeCacheKey(type, phone);

    // 存储验证码到缓存
    await cache.set(cacheKey, code, this.CODE_EXPIRE_TIME);

    // 发送短信
    await smsService.sendVerificationCode(phone, code);

    // 更新发送记录
    await this.updateSendRecord(type, phone);

    console.log(`手机验证码已发送: ${phone}, 类型: ${type}`);
  }

  /**
   * 验证验证码
   * @param target 目标（邮箱或手机号）
   * @param code 验证码
   * @param type 验证码类型
   */
  async verifyCode(target: string, code: string, type: VerificationCodeType): Promise<boolean> {
    const cacheKey = this.getCodeCacheKey(type, target);
    const storedCode = await cache.get(cacheKey);

    if (!storedCode) {
      throw new AppError('验证码已过期或不存在', 400);
    }

    if (storedCode !== code) {
      throw new AppError('验证码错误', 400);
    }

    // 验证成功后删除验证码
    await cache.del(cacheKey);
    
    console.log(`验证码验证成功: ${target}, 类型: ${type}`);
    return true;
  }

  /**
   * 生成密码重置token
   * @param email 邮箱地址
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    // 检查发送限制
    await this.checkSendLimits(VerificationCodeType.EMAIL_RESET_PASSWORD, email);

    // 生成重置token
    const resetToken = this.generateResetToken();
    const cacheKey = `${CACHE_KEYS.PASSWORD_RESET_TOKEN}${email}`;

    // 存储token到缓存（1小时过期）
    await cache.set(cacheKey, resetToken, 3600);

    // 发送重置邮件
    await emailService.sendPasswordResetEmail(email, resetToken);

    // 更新发送记录
    await this.updateSendRecord(VerificationCodeType.EMAIL_RESET_PASSWORD, email);

    console.log(`密码重置邮件已发送: ${email}`);
    return resetToken;
  }

  /**
   * 验证密码重置token
   * @param email 邮箱地址
   * @param token 重置token
   */
  async verifyPasswordResetToken(email: string, token: string): Promise<boolean> {
    const cacheKey = `${CACHE_KEYS.PASSWORD_RESET_TOKEN}${email}`;
    const storedToken = await cache.get(cacheKey);

    if (!storedToken) {
      throw new AppError('重置链接已过期或不存在', 400);
    }

    if (storedToken !== token) {
      throw new AppError('重置链接无效', 400);
    }

    // 验证成功后删除token
    await cache.del(cacheKey);
    
    console.log(`密码重置token验证成功: ${email}`);
    return true;
  }

  /**
   * 清理过期的验证码和发送记录
   */
  async cleanupExpiredCodes(): Promise<void> {
    try {
      // Redis会自动清理过期的键，这里可以添加额外的清理逻辑
      console.log('验证码清理任务执行完成');
    } catch (error) {
      console.error('验证码清理任务失败:', error);
    }
  }

  /**
   * 获取验证码剩余有效时间
   * @param target 目标（邮箱或手机号）
   * @param type 验证码类型
   */
  async getCodeRemainingTime(target: string, type: VerificationCodeType): Promise<number> {
    const cacheKey = this.getCodeCacheKey(type, target);
    const ttl = await cache.ttl(cacheKey);
    return Math.max(0, ttl);
  }

  /**
   * 获取发送限制信息
   * @param target 目标（邮箱或手机号）
   * @param type 验证码类型
   */
  async getSendLimitInfo(target: string, type: VerificationCodeType): Promise<{
    remainingSendCount: number;
    nextSendTime: number;
  }> {
    const sendCountKey = this.getSendCountCacheKey(type, target);
    const lastSendTimeKey = this.getLastSendTimeCacheKey(type, target);

    const sendCount = await cache.get(sendCountKey);
    const lastSendTime = await cache.get(lastSendTimeKey);

    const currentSendCount = sendCount ? parseInt(sendCount) : 0;
    const remainingSendCount = Math.max(0, this.MAX_SEND_COUNT - currentSendCount);

    let nextSendTime = 0;
    if (lastSendTime) {
      const timeDiff = Date.now() - parseInt(lastSendTime);
      if (timeDiff < this.SEND_INTERVAL * 1000) {
        nextSendTime = Math.ceil((this.SEND_INTERVAL * 1000 - timeDiff) / 1000);
      }
    }

    return {
      remainingSendCount,
      nextSendTime
    };
  }
}

// 导出验证码服务实例
export const verificationService = new VerificationService();