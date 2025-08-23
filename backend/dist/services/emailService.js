"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const errorHandler_1 = require("..//utils/errorHandler");
/**
 * 邮件服务类
 * 负责处理所有邮件发送相关的功能
 */
class EmailService {
    constructor() {
        // 初始化邮件传输器
        this.transporter = nodemailer_1.default.createTransport({
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
    async sendVerificationCode(email, code) {
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
        }
        catch (error) {
            console.error('邮件发送失败:', error);
            throw new errorHandler_1.AppError('邮件发送失败', 500);
        }
    }
    /**
     * 发送密码重置邮件
     * @param email 目标邮箱
     * @param resetToken 重置token
     */
    async sendPasswordResetEmail(email, resetToken) {
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
        }
        catch (error) {
            console.error('邮件发送失败:', error);
            throw new errorHandler_1.AppError('邮件发送失败', 500);
        }
    }
    /**
     * 发送订单通知邮件
     * @param email 目标邮箱
     * @param orderInfo 订单信息
     */
    async sendOrderNotification(email, orderInfo) {
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
        }
        catch (error) {
            console.error('邮件发送失败:', error);
            throw new errorHandler_1.AppError('邮件发送失败', 500);
        }
    }
    /**
     * 发送欢迎邮件
     * @param email 目标邮箱
     * @param username 用户名
     */
    async sendWelcomeEmail(email, username) {
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
        }
        catch (error) {
            console.error('邮件发送失败:', error);
            // 欢迎邮件发送失败不应该阻止用户注册流程
            console.warn('欢迎邮件发送失败，但不影响用户注册');
        }
    }
    /**
     * 验证邮件服务配置
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('邮件服务连接成功');
            return true;
        }
        catch (error) {
            console.error('邮件服务连接失败:', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
// 导出邮件服务实例
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map