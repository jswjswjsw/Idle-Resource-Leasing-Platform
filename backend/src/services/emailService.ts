import nodemailer from 'nodemailer';
import { winstonLogger } from '@/middleware/logger';
import { ErrorFactory } from '@/utils/AppError';

/**
 * 邮件服务配置
 * 支持多个免费邮件服务提供商
 */

// 邮件模板类型
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// 邮件发送选项
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
}

// 预定义邮件模板
const EMAIL_TEMPLATES: Record<string, (data: any) => EmailTemplate> = {
  // 邮箱验证模板
  verification: (data: { username: string; code: string; expireMinutes: number }) => ({
    subject: '【交易平台】邮箱验证码',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">交易平台</h1>
          <p style="color: #666; margin: 10px 0 0 0;">安全可靠的交易服务平台</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">邮箱验证</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            尊敬的 ${data.username}，您好！
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            您正在进行邮箱验证，验证码为：
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 6px; letter-spacing: 4px;">
              ${data.code}
            </span>
          </div>
          <p style="color: #999; font-size: 14px; margin: 0;">
            验证码有效期为 ${data.expireMinutes} 分钟，请尽快完成验证。如非本人操作，请忽略此邮件。
          </p>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复</p>
          <p>© 2024 交易平台 版权所有</p>
        </div>
      </div>
    `,
    text: `【交易平台】邮箱验证码\n\n尊敬的 ${data.username}，您好！\n\n您的验证码是：${data.code}\n\n验证码有效期为 ${data.expireMinutes} 分钟，请尽快完成验证。`

  }),

  // 密码重置模板
  passwordReset: (data: { username: string; resetUrl: string; expireMinutes: number }) => ({
    subject: '【交易平台】密码重置',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">交易平台</h1>
          <p style="color: #666; margin: 10px 0 0 0;">安全可靠的交易服务平台</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">密码重置</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            尊敬的 ${data.username}，您好！
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            我们收到了您的密码重置请求。请点击下方按钮重置您的密码：
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              重置密码
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin: 0 0 10px 0;">
            链接有效期为 ${data.expireMinutes} 分钟。如果按钮无法点击，请复制以下链接到浏览器：
          </p>
          <p style="color: #007bff; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
            ${data.resetUrl}
          </p>
          <p style="color: #999; font-size: 14px; margin: 0;">
            如非本人操作，请忽略此邮件，您的密码不会被更改。
          </p>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复</p>
          <p>© 2024 交易平台 版权所有</p>
        </div>
      </div>
    `,
    text: `【交易平台】密码重置\n\n尊敬的 ${data.username}，您好！\n\n请访问以下链接重置您的密码：\n${data.resetUrl}\n\n链接有效期为 ${data.expireMinutes} 分钟。如非本人操作，请忽略此邮件。`

  }),

  // 登录通知模板
  loginNotification: (data: { username: string; loginTime: string; ip: string; location?: string }) => ({
    subject: '【交易平台】登录通知',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">交易平台</h1>
          <p style="color: #666; margin: 10px 0 0 0;">安全可靠的交易服务平台</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">登录通知</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            尊敬的 ${data.username}，您好！
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            您的账户于 ${data.loginTime} 成功登录。
          </p>
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #333;"><strong>登录详情：</strong></p>
            <p style="margin: 5px 0; color: #666;">时间：${data.loginTime}</p>
            <p style="margin: 5px 0; color: #666;">IP地址：${data.ip}</p>
            ${data.location ? `<p style="margin: 5px 0; color: #666;">地理位置：${data.location}</p>` : ''}

          </div>
          <p style="color: #999; font-size: 14px; margin: 0;">
            如果这不是您的操作，请立即修改密码并联系客服。
          </p>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复</p>
          <p>© 2024 交易平台 版权所有</p>
        </div>
      </div>
    `,
    text: `【交易平台】登录通知\n\n尊敬的 ${data.username}，您好！\n\n您的账户于 ${data.loginTime} 成功登录。\nIP地址：${data.ip}\n${data.location ? `地理位置：${data.location}\n` : ''}\n如果这不是您的操作，请立即修改密码。`

  }),

  // 订单通知模板
  orderNotification: (data: { username: string; orderNumber: string; resourceTitle: string; totalAmount: number; action: string }) => ({
    subject: `【交易平台】订单${data.action}通知`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">交易平台</h1>
          <p style="color: #666; margin: 10px 0 0 0;">安全可靠的交易服务平台</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">订单${data.action}</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            尊敬的 ${data.username}，您好！
          </p>
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            您的订单已${data.action}，详情如下：
          </p>
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #333;"><strong>订单信息：</strong></p>
            <p style="margin: 5px 0; color: #666;">订单号：${data.orderNumber}</p>
            <p style="margin: 5px 0; color: #666;">商品：${data.resourceTitle}</p>
            <p style="margin: 5px 0; color: #666;">金额：¥${data.totalAmount}</p>
          </div>
          <p style="color: #666; line-height: 1.6; margin: 0;">
            感谢您使用交易平台，如有疑问请联系客服。
          </p>
        </div>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复</p>
          <p>© 2024 交易平台 版权所有</p>
        </div>
      </div>
    `,
    text: `【交易平台】订单${data.action}通知\n\n尊敬的 ${data.username}，您好！\n\n您的订单已${data.action}：\n订单号：${data.orderNumber}\n商品：${data.resourceTitle}\n金额：¥${data.totalAmount}\n\n感谢您使用交易平台！`

  })
};

// 邮件传输器配置
let transporter: nodemailer.Transporter | null = null;

/**
 * 初始化邮件服务
 */
function initEmailService(): nodemailer.Transporter | null {
  try {
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // 添加连接选项
      connectionTimeout: 60000, // 60秒连接超时
      greetingTimeout: 30000, // 30秒握手超时
      socketTimeout: 60000, // 60秒套接字超时
    };

    // 验证必要的配置
    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      winstonLogger.warn('邮件服务配置不完整，邮件功能将被禁用');
      return null;
    }

    const transporter = nodemailer.createTransporter(emailConfig);

    // 验证SMTP连接
    transporter.verify((error, success) => {
      if (error) {
        winstonLogger.error('邮件服务连接失败', { error: error.message });
      } else {
        winstonLogger.info('邮件服务连接成功');
      }
    });

    return transporter;
  } catch (error) {
    winstonLogger.error('邮件服务初始化失败', { error });
    return null;
  }
}

// 初始化邮件服务
transporter = initEmailService();

/**
 * 发送邮件
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!transporter) {
      winstonLogger.warn('邮件服务未初始化，无法发送邮件');
      return false;
    }

    let { subject, html, text } = options;

    // 如果指定了模板，使用模板生成内容
    if (options.template && EMAIL_TEMPLATES[options.template]) {
      const template = EMAIL_TEMPLATES[options.template](options.data || {});
      subject = template.subject;
      html = template.html;
      text = template.text;
    }

    const mailOptions = {
      from: `\"交易平台\" <${process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    
    winstonLogger.info('邮件发送成功', {
      to: options.to,
      subject,
      messageId: info.messageId
    });

    return true;
  } catch (error) {
    winstonLogger.error('邮件发送失败', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    return false;
  }
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  code: string,
  expireMinutes: number = 10
): Promise<boolean> {
  return sendEmail({
    to: email,
    template: 'verification',
    data: { username, code, expireMinutes }
  });

}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetUrl: string,
  expireMinutes: number = 60
): Promise<boolean> {
  return sendEmail({
    to: email,
    template: 'passwordReset',
    data: { username, resetUrl, expireMinutes }
  });

}

/**
 * 发送登录通知邮件
 */
export async function sendLoginNotificationEmail(
  email: string,
  username: string,
  loginTime: string,
  ip: string,
  location?: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    template: 'loginNotification',
    data: { username, loginTime, ip, location }
  });

}

/**
 * 发送订单通知邮件
 */
export async function sendOrderNotificationEmail(
  email: string,
  username: string,
  orderNumber: string,
  resourceTitle: string,
  totalAmount: number,
  action: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    template: 'orderNotification',
    data: { username, orderNumber, resourceTitle, totalAmount, action }
  });

}

/**
 * 邮件服务状态检查
 */
export function getEmailServiceStatus(): { available: boolean; configured: boolean } {
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return {
    configured,
    available: !!(transporter && configured)
  };
}

/**
 * 邮件服务类
 * 负责处理所有邮件发送相关的功能
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 初始化邮件传输器
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 发送邮箱验证码
   * @param email 目标邮箱
   * @param code 验证码
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: `"${process.env.APP_NAME || '闲置资源租赁平台'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '邮箱验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">邮箱验证</h2>
          <p>您好！</p>
          <p>您的邮箱验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #666;">验证码有效期为5分钟，请及时使用。</p>
          <p style="color: #666;">如果这不是您的操作，请忽略此邮件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`邮箱验证码已发送到: ${email}`);
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw new AppError('邮件发送失败', 500);
    }
  }

  /**
   * 发送密码重置邮件
   * @param email 目标邮箱
   * @param resetToken 重置token
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${process.env.APP_NAME || '闲置资源租赁平台'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '密码重置',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">密码重置</h2>
          <p>您好！</p>
          <p>您请求重置密码。请点击下面的链接来重置您的密码：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              重置密码
            </a>
          </div>
          <p style="color: #666;">或者复制以下链接到浏览器地址栏：</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <p style="color: #666;">此链接有效期为1小时。</p>
          <p style="color: #666;">如果这不是您的操作，请忽略此邮件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`密码重置邮件已发送到: ${email}`);
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw new AppError('邮件发送失败', 500);
    }
  }

  /**
   * 发送订单通知邮件
   * @param email 目标邮箱
   * @param orderInfo 订单信息
   */
  async sendOrderNotification(email: string, orderInfo: any): Promise<void> {
    const mailOptions = {
      from: `"${process.env.APP_NAME || '闲置资源租赁平台'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '订单通知',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">订单通知</h2>
          <p>您好！</p>
          <p>您的订单状态已更新：</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>订单号：</strong>${orderInfo.id}</p>
            <p><strong>资源名称：</strong>${orderInfo.resourceTitle}</p>
            <p><strong>订单状态：</strong>${orderInfo.status}</p>
            <p><strong>总金额：</strong>¥${orderInfo.totalPrice}</p>
          </div>
          <p>请登录平台查看详细信息。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`订单通知邮件已发送到: ${email}`);
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw new AppError('邮件发送失败', 500);
    }
  }

  /**
   * 发送欢迎邮件
   * @param email 目标邮箱
   * @param username 用户名
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const mailOptions = {
      from: `"${process.env.APP_NAME || '闲置资源租赁平台'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '欢迎加入我们！',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">欢迎加入${process.env.APP_NAME || '闲置资源租赁平台'}！</h2>
          <p>亲爱的 ${username}，</p>
          <p>欢迎您注册成为我们平台的用户！</p>
          <p>在这里，您可以：</p>
          <ul>
            <li>发布您的闲置资源进行租赁</li>
            <li>租借他人的闲置资源</li>
            <li>与其他用户进行安全交易</li>
            <li>享受便捷的在线支付服务</li>
          </ul>
          <p>开始您的租赁之旅吧！</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              立即开始
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`欢迎邮件已发送到: ${email}`);
    } catch (error) {
      console.error('邮件发送失败:', error);
      // 欢迎邮件发送失败不应该阻止用户注册流程
      console.warn('欢迎邮件发送失败，但不影响用户注册');
    }
  }

  /**
   * 验证邮件服务配置
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('邮件服务连接成功');
      return true;
    } catch (error) {
      console.error('邮件服务连接失败:', error);
      return false;
    }
  }
}

// 导出邮件服务实例
export const emailService = new EmailService();