const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 第三方服务配置向导
 * 帮助用户逐步配置所有第三方服务的API密钥
 */
class ServicesConfigWizard {
  constructor() {
    this.config = {};
    this.envPath = path.join(__dirname, '..', '.env.production');
    this.templatePath = path.join(__dirname, '..', '.env.wwwcn.uk');
  }

  /**
   * 询问用户输入
   */
  async askQuestion(question, required = true) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        if (required && !answer.trim()) {
          console.log(chalk.red('⚠️  此项为必填项，请重新输入'));
          resolve(this.askQuestion(question, required));
        } else {
          resolve(answer.trim());
        }
      });
    });
  }

  /**
   * 询问密码输入（隐藏显示）
   */
  async askSecret(question) {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      const stdout = process.stdout;

      stdout.write(question);
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      let password = '';
      stdin.on('data', (ch) => {
        ch = ch + '';

        switch (ch) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write('\n');
            resolve(password);
            break;
          case '\u0003':
            process.exit();
            break;
          case '\u007f': // backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
              stdout.write('\u001b[1D\u001b[K'); // 删除一个字符
            }
            break;
          default:
            password += ch;
            stdout.write('*');
            break;
        }
      });
    });
  }

  /**
   * 显示欢迎信息
   */
  showWelcome() {
    console.log(chalk.cyan('🌐 wwwcn.uk 域名第三方服务配置向导'));
    console.log(chalk.cyan('=========================================='));
    console.log('');
    console.log(chalk.yellow('📋 配置优先级说明：'));
    console.log(chalk.green('✅ 高优先级（必须配置）：'));
    console.log('   1. GitHub OAuth - 用户登录认证');
    console.log('   2. 高德地图API - 地理位置服务');
    console.log('   3. 支付宝沙箱 - 支付功能测试');
    console.log('');
    console.log(chalk.yellow('⚠️  中优先级（建议配置）：'));
    console.log('   4. 阿里云短信服务 - 短信通知');
    console.log('   5. Google OAuth - 备用登录方式');
    console.log('');
    console.log(chalk.blue('📝 低优先级（可选配置）：'));
    console.log('   6. 百度地图API - 地图服务备选');
    console.log('   7. Gitee OAuth - 国内开发者登录');
    console.log('   8. 微信支付沙箱 - 支付方式扩展');
    console.log('');
    console.log(chalk.gray('💡 提示：可以先配置高优先级服务，其他服务稍后添加'));
    console.log('');
  }

  /**
   * 配置基础信息
   */
  async configureBasics() {
    console.log(chalk.green('🔧 基础配置'));
    console.log(chalk.gray('配置域名和基础信息...'));
    console.log('');

    // 域名配置（已预设）
    this.config.FRONTEND_URL = 'https://wwwcn.uk';
    this.config.BACKEND_URL = 'https://api.wwwcn.uk';
    this.config.CORS_ORIGIN = 'https://wwwcn.uk';
    this.config.SOCKET_IO_CORS_ORIGIN = 'https://wwwcn.uk';

    console.log(chalk.blue('✅ 域名配置已预设：'));
    console.log(`   前端地址: ${this.config.FRONTEND_URL}`);
    console.log(`   API地址: ${this.config.BACKEND_URL}`);
    console.log('');

    // JWT密钥配置
    console.log(chalk.yellow('🔐 JWT密钥配置'));
    console.log(chalk.gray('为了安全，建议使用32位以上的随机字符串'));
    
    const useRandomJWT = await this.askQuestion('是否自动生成JWT密钥？(y/n，推荐选择y): ');
    if (useRandomJWT.toLowerCase() === 'y') {
      this.config.JWT_SECRET = this.generateRandomSecret(32);
      this.config.JWT_REFRESH_SECRET = this.generateRandomSecret(32);
      this.config.SESSION_SECRET = this.generateRandomSecret(32);
      console.log(chalk.green('✅ JWT密钥已自动生成'));
    } else {
      this.config.JWT_SECRET = await this.askQuestion('请输入JWT密钥: ');
      this.config.JWT_REFRESH_SECRET = await this.askQuestion('请输入JWT刷新密钥: ');
      this.config.SESSION_SECRET = await this.askQuestion('请输入Session密钥: ');
    }
    console.log('');
  }

  /**
   * 配置高优先级服务
   */
  async configureHighPriorityServices() {
    console.log(chalk.green('🎯 高优先级服务配置'));
    console.log(chalk.gray('配置必需的第三方服务...'));
    console.log('');

    // GitHub OAuth
    console.log(chalk.cyan('1. GitHub OAuth 配置'));
    console.log(chalk.gray('用于用户登录认证，必须配置'));
    const configGitHub = await this.askQuestion('是否配置GitHub OAuth？(y/n): ');
    if (configGitHub.toLowerCase() === 'y') {
      console.log(chalk.yellow('📋 申请指南：'));
      console.log('   1. 访问: https://github.com/settings/applications');
      console.log('   2. 点击 "New OAuth App"');
      console.log('   3. Homepage URL: https://wwwcn.uk');
      console.log('   4. Callback URL: https://api.wwwcn.uk/api/auth/oauth/github/callback');
      console.log('');
      
      this.config.GITHUB_CLIENT_ID = await this.askQuestion('请输入GitHub Client ID: ');
      this.config.GITHUB_CLIENT_SECRET = await this.askSecret('请输入GitHub Client Secret: ');
      this.config.GITHUB_REDIRECT_URI = 'https://api.wwwcn.uk/api/auth/oauth/github/callback';
      console.log(chalk.green('✅ GitHub OAuth配置完成'));
    }
    console.log('');

    // 高德地图API
    console.log(chalk.cyan('2. 高德地图API 配置'));
    console.log(chalk.gray('用于地理位置服务，日调用量100万次免费'));
    const configAmap = await this.askQuestion('是否配置高德地图API？(y/n): ');
    if (configAmap.toLowerCase() === 'y') {
      console.log(chalk.yellow('📋 申请指南：'));
      console.log('   1. 访问: https://console.amap.com');
      console.log('   2. 注册并实名认证');
      console.log('   3. 创建应用，选择"Web服务"');
      console.log('   4. 添加域名白名单: wwwcn.uk, *.wwwcn.uk');
      console.log('');
      
      this.config.AMAP_API_KEY = await this.askQuestion('请输入高德地图API Key: ');
      console.log(chalk.green('✅ 高德地图API配置完成'));
    }
    console.log('');

    // 支付宝沙箱
    console.log(chalk.cyan('3. 支付宝沙箱 配置'));
    console.log(chalk.gray('用于支付功能测试，完全免费'));
    const configAlipay = await this.askQuestion('是否配置支付宝沙箱？(y/n): ');
    if (configAlipay.toLowerCase() === 'y') {
      console.log(chalk.yellow('📋 申请指南：'));
      console.log('   1. 访问: https://open.alipay.com/dev/workspace');
      console.log('   2. 进入沙箱环境');
      console.log('   3. 下载"支付宝开放平台助手"生成密钥对');
      console.log('   4. 配置回调地址: https://api.wwwcn.uk/api/payment/alipay/callback');
      console.log('');
      
      this.config.ALIPAY_SANDBOX_APP_ID = await this.askQuestion('请输入支付宝沙箱App ID: ');
      this.config.ALIPAY_SANDBOX_PRIVATE_KEY = await this.askQuestion('请输入应用私钥（完整内容）: ');
      this.config.ALIPAY_SANDBOX_PUBLIC_KEY = await this.askQuestion('请输入支付宝公钥（完整内容）: ');
      console.log(chalk.green('✅ 支付宝沙箱配置完成'));
    }
    console.log('');
  }

  /**
   * 配置中优先级服务
   */
  async configureMediumPriorityServices() {
    console.log(chalk.yellow('⚠️  中优先级服务配置'));
    console.log(chalk.gray('建议配置，可提升用户体验...'));
    console.log('');

    // 阿里云短信
    console.log(chalk.cyan('4. 阿里云短信服务 配置'));
    console.log(chalk.gray('用于短信通知，新用户有100条免费额度'));
    const configSms = await this.askQuestion('是否配置阿里云短信服务？(y/n): ');
    if (configSms.toLowerCase() === 'y') {
      console.log(chalk.yellow('📋 申请指南：'));
      console.log('   1. 访问: https://www.aliyun.com，注册并实名认证');
      console.log('   2. 开通短信服务');
      console.log('   3. 创建AccessKey（建议使用RAM子用户）');
      console.log('   4. 申请短信签名和模板');
      console.log('');
      
      this.config.ALIYUN_SMS_ACCESS_KEY_ID = await this.askQuestion('请输入AccessKey ID: ');
      this.config.ALIYUN_SMS_ACCESS_KEY_SECRET = await this.askSecret('请输入AccessKey Secret: ');
      this.config.ALIYUN_SMS_SIGN_NAME = await this.askQuestion('请输入短信签名（如：交易平台）: ') || '交易平台';
      console.log(chalk.green('✅ 阿里云短信服务配置完成'));
    }
    console.log('');

    // Google OAuth
    console.log(chalk.cyan('5. Google OAuth 配置'));
    console.log(chalk.gray('用作备用登录方式，免费'));
    const configGoogle = await this.askQuestion('是否配置Google OAuth？(y/n): ');
    if (configGoogle.toLowerCase() === 'y') {
      console.log(chalk.yellow('📋 申请指南：'));
      console.log('   1. 访问: https://console.cloud.google.com');
      console.log('   2. 创建项目，启用Google+ API');
      console.log('   3. 创建OAuth客户端ID');
      console.log('   4. 授权重定向URI: https://api.wwwcn.uk/api/auth/oauth/google/callback');
      console.log('');
      
      this.config.GOOGLE_CLIENT_ID = await this.askQuestion('请输入Google Client ID: ');
      this.config.GOOGLE_CLIENT_SECRET = await this.askSecret('请输入Google Client Secret: ');
      this.config.GOOGLE_REDIRECT_URI = 'https://api.wwwcn.uk/api/auth/oauth/google/callback';
      console.log(chalk.green('✅ Google OAuth配置完成'));
    }
    console.log('');
  }

  /**
   * 配置低优先级服务
   */
  async configureLowPriorityServices() {
    console.log(chalk.blue('📝 低优先级服务配置'));
    console.log(chalk.gray('可选配置，用于扩展功能...'));
    
    const configOptional = await this.askQuestion('是否配置可选服务？(y/n): ');
    if (configOptional.toLowerCase() !== 'y') {
      console.log(chalk.gray('⏭️  跳过可选服务配置'));
      return;
    }
    console.log('');

    // 百度地图API
    console.log(chalk.cyan('6. 百度地图API 配置'));
    const configBaidu = await this.askQuestion('是否配置百度地图API？(y/n): ');
    if (configBaidu.toLowerCase() === 'y') {
      this.config.BAIDU_MAP_API_KEY = await this.askQuestion('请输入百度地图API Key: ');
      console.log(chalk.green('✅ 百度地图API配置完成'));
    }
    console.log('');

    // Gitee OAuth
    console.log(chalk.cyan('7. Gitee OAuth 配置'));
    const configGitee = await this.askQuestion('是否配置Gitee OAuth？(y/n): ');
    if (configGitee.toLowerCase() === 'y') {
      this.config.GITEE_CLIENT_ID = await this.askQuestion('请输入Gitee Client ID: ');
      this.config.GITEE_CLIENT_SECRET = await this.askSecret('请输入Gitee Client Secret: ');
      this.config.GITEE_REDIRECT_URI = 'https://api.wwwcn.uk/api/auth/oauth/gitee/callback';
      console.log(chalk.green('✅ Gitee OAuth配置完成'));
    }
    console.log('');

    // 微信支付沙箱
    console.log(chalk.cyan('8. 微信支付沙箱 配置'));
    const configWechat = await this.askQuestion('是否配置微信支付沙箱？(y/n): ');
    if (configWechat.toLowerCase() === 'y') {
      this.config.WECHAT_SANDBOX_APP_ID = await this.askQuestion('请输入微信AppID: ');
      this.config.WECHAT_SANDBOX_MCH_ID = await this.askQuestion('请输入微信商户号: ');
      this.config.WECHAT_SANDBOX_API_KEY = await this.askSecret('请输入微信API密钥: ');
      console.log(chalk.green('✅ 微信支付沙箱配置完成'));
    }
    console.log('');
  }

  /**
   * 生成随机密钥
   */
  generateRandomSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成环境变量文件
   */
  generateEnvFile() {
    console.log(chalk.green('📄 生成环境变量文件'));
    console.log(chalk.gray('正在生成 .env.production 文件...'));
    console.log('');

    // 读取模板文件
    let template = '';
    if (fs.existsSync(this.templatePath)) {
      template = fs.readFileSync(this.templatePath, 'utf8');
    }

    // 替换配置值
    for (const [key, value] of Object.entries(this.config)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (template.match(regex)) {
        template = template.replace(regex, `${key}=${value}`);
      } else {
        template += `\n${key}=${value}`;
      }
    }

    // 写入文件
    fs.writeFileSync(this.envPath, template);
    console.log(chalk.green(`✅ 环境变量文件已生成: ${this.envPath}`));
    console.log('');
  }

  /**
   * 显示配置摘要
   */
  showSummary() {
    console.log(chalk.green('🎉 配置完成！'));
    console.log(chalk.cyan('=========================================='));
    console.log('');
    console.log(chalk.yellow('📋 配置摘要：'));
    
    const services = [
      { key: 'GITHUB_CLIENT_ID', name: 'GitHub OAuth', priority: '高' },
      { key: 'AMAP_API_KEY', name: '高德地图API', priority: '高' },
      { key: 'ALIPAY_SANDBOX_APP_ID', name: '支付宝沙箱', priority: '高' },
      { key: 'ALIYUN_SMS_ACCESS_KEY_ID', name: '阿里云短信', priority: '中' },
      { key: 'GOOGLE_CLIENT_ID', name: 'Google OAuth', priority: '中' },
      { key: 'BAIDU_MAP_API_KEY', name: '百度地图API', priority: '低' },
      { key: 'GITEE_CLIENT_ID', name: 'Gitee OAuth', priority: '低' },
      { key: 'WECHAT_SANDBOX_APP_ID', name: '微信支付沙箱', priority: '低' }
    ];

    services.forEach(service => {
      const status = this.config[service.key] ? '✅ 已配置' : '❌ 未配置';
      const priority = service.priority === '高' ? chalk.red(service.priority) : 
                      service.priority === '中' ? chalk.yellow(service.priority) : 
                      chalk.blue(service.priority);
      console.log(`   ${status} ${service.name} [${priority}]`);
    });

    console.log('');
    console.log(chalk.yellow('🚀 下一步操作：'));
    console.log('   1. 配置Cloudflare域名解析');
    console.log('   2. 部署应用到服务器');
    console.log('   3. 测试所有功能');
    console.log('');
    console.log(chalk.blue('📖 详细指南：'));
    console.log('   - Cloudflare配置: docs/CLOUDFLARE_CONFIGURATION_GUIDE.md');
    console.log('   - 第三方服务: docs/THIRD_PARTY_SERVICES_GUIDE.md');
    console.log('   - 应用部署: docs/APPLICATION_DEPLOYMENT_GUIDE.md');
    console.log('');
    console.log(chalk.gray('💡 提示：环境变量文件已保存，部署时请确保正确设置这些变量'));
  }

  /**
   * 运行配置向导
   */
  async run() {
    try {
      this.showWelcome();
      await this.configureBasics();
      await this.configureHighPriorityServices();
      await this.configureMediumPriorityServices();
      await this.configureLowPriorityServices();
      this.generateEnvFile();
      this.showSummary();
    } catch (error) {
      console.error(chalk.red('❌ 配置过程中出错:', error.message));
    } finally {
      rl.close();
    }
  }
}

// 运行配置向导
if (require.main === module) {
  const wizard = new ServicesConfigWizard();
  wizard.run();
}

module.exports = ServicesConfigWizard;