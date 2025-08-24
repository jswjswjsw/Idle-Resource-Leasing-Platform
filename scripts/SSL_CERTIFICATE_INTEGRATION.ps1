# SSL证书集成到Node.js应用
# 配置HTTPS服务器的完整代码

Write-Host "🔒 SSL证书集成配置" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "📝 创建HTTPS服务器配置模块..." -ForegroundColor Yellow

# 创建HTTPS配置模块
$httpsConfigJs = @"
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

/**
 * SSL证书配置模块
 * 用于为Node.js应用配置HTTPS服务器
 */

class SSLConfig {
    constructor() {
        this.sslEnabled = process.env.SSL_ENABLED === 'true';
        this.certPath = process.env.SSL_CERT_PATH;
        this.keyPath = process.env.SSL_KEY_PATH;
        this.port = process.env.PORT || 5000;
        this.httpsPort = process.env.HTTPS_PORT || 443;
    }

    /**
     * 检查SSL证书文件是否存在
     */
    checkSSLCertificates() {
        if (!this.sslEnabled) {
            console.log('🔓 SSL未启用，使用HTTP模式');
            return false;
        }

        if (!this.certPath || !this.keyPath) {
            console.log('⚠️ SSL证书路径未配置');
            return false;
        }

        const certExists = fs.existsSync(this.certPath);
        const keyExists = fs.existsSync(this.keyPath);

        if (!certExists || !keyExists) {
            console.log('❌ SSL证书文件不存在:');
            console.log('证书文件:', this.certPath, certExists ? '✅' : '❌');
            console.log('私钥文件:', this.keyPath, keyExists ? '✅' : '❌');
            return false;
        }

        console.log('✅ SSL证书文件验证通过');
        return true;
    }

    /**
     * 获取SSL证书配置
     */
    getSSLOptions() {
        try {
            const options = {
                key: fs.readFileSync(this.keyPath),
                cert: fs.readFileSync(this.certPath)
            };

            // 检查是否有证书链文件
            const chainPath = this.certPath.replace('cert.pem', 'chain.pem');
            if (fs.existsSync(chainPath)) {
                options.ca = fs.readFileSync(chainPath);
                console.log('✅ 证书链文件已加载');
            }

            return options;
        } catch (error) {
            console.error('❌ 读取SSL证书文件失败:', error.message);
            return null;
        }
    }

    /**
     * 创建HTTP或HTTPS服务器
     */
    createServer(app) {
        const useSSL = this.checkSSLCertificates();

        if (useSSL) {
            const sslOptions = this.getSSLOptions();
            if (sslOptions) {
                const httpsServer = https.createServer(sslOptions, app);
                
                // 同时启动HTTP服务器进行重定向
                const httpApp = (req, res) => {
                    const host = req.headers.host.replace(/:\d+$/, '');
                    const httpsUrl = `https://\${host}\${req.url}`;
                    res.writeHead(301, { Location: httpsUrl });
                    res.end();
                };
                const httpServer = http.createServer(httpApp);

                return {
                    https: httpsServer,
                    http: httpServer,
                    useSSL: true
                };
            }
        }

        // 降级到HTTP
        const httpServer = http.createServer(app);
        return {
            http: httpServer,
            useSSL: false
        };
    }

    /**
     * 启动服务器
     */
    startServer(app) {
        const servers = this.createServer(app);

        if (servers.useSSL) {
            // HTTPS模式
            servers.https.listen(this.httpsPort, () => {
                console.log(`🔒 HTTPS服务器运行在端口 \${this.httpsPort}`);
                console.log(`🌐 HTTPS访问地址: https://localhost:\${this.httpsPort}`);
                console.log(`🌐 域名访问: https://wwwcn.uk:\${this.httpsPort}`);
            });

            // HTTP重定向服务器
            servers.http.listen(80, () => {
                console.log('🔄 HTTP重定向服务器运行在端口 80');
            });

            return servers.https;
        } else {
            // HTTP模式
            servers.http.listen(this.port, () => {
                console.log(`🔓 HTTP服务器运行在端口 \${this.port}`);
                console.log(`🌐 访问地址: http://localhost:\${this.port}`);
                console.log(`🌐 外网访问: http://116.62.44.24:\${this.port}`);
            });

            return servers.http;
        }
    }
}

module.exports = SSLConfig;
"@

# 将HTTPS配置保存到项目中
$httpsConfigPath = "C:\www\trade-platform\backend\config\ssl-config.js"
$configDir = Split-Path $httpsConfigPath -Parent

Write-Host "📁 创建配置目录: $configDir" -ForegroundColor Cyan
try {
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    
    $httpsConfigJs | Out-File -FilePath $httpsConfigPath -Encoding UTF8 -Force
    Write-Host "✅ HTTPS配置文件创建成功: $httpsConfigPath" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS配置文件创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 创建服务器启动示例
Write-Host ""
Write-Host "📝 创建服务器启动示例..." -ForegroundColor Yellow

$serverExampleJs = @"
// 服务器启动示例 - 集成SSL配置
const express = require('express');
const SSLConfig = require('./config/ssl-config');

// 创建Express应用
const app = express();

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS配置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        ssl: process.env.SSL_ENABLED === 'true',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Trade Platform API',
        version: '1.0.0',
        ssl: process.env.SSL_ENABLED === 'true'
    });
});

// 启动服务器
const sslConfig = new SSLConfig();
const server = sslConfig.startServer(app);

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
"@

$serverExamplePath = "C:\www\trade-platform\backend\server-ssl-example.js"
try {
    $serverExampleJs | Out-File -FilePath $serverExamplePath -Encoding UTF8 -Force
    Write-Host "✅ 服务器启动示例创建成功: $serverExamplePath" -ForegroundColor Green
} catch {
    Write-Host "❌ 服务器启动示例创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 SSL证书集成完成！" -ForegroundColor Green
Write-Host "=" * 50

Write-Host "📋 已创建的文件：" -ForegroundColor Cyan
Write-Host "1. SSL配置模块: $httpsConfigPath" -ForegroundColor White
Write-Host "2. 服务器示例: $serverExamplePath" -ForegroundColor White

Write-Host ""
Write-Host "🚀 使用方法：" -ForegroundColor Yellow
Write-Host "1. 确保SSL证书申请完成" -ForegroundColor White
Write-Host "2. 环境变量SSL_ENABLED=true" -ForegroundColor White
Write-Host "3. 启动服务器:" -ForegroundColor White
Write-Host "   node server-ssl-example.js" -ForegroundColor Green
Write-Host ""
Write-Host "或者在现有服务器代码中集成:" -ForegroundColor White
Write-Host "   const SSLConfig = require('./config/ssl-config');" -ForegroundColor Green
Write-Host "   const sslConfig = new SSLConfig();" -ForegroundColor Green
Write-Host "   const server = sslConfig.startServer(app);" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 功能特性：" -ForegroundColor Cyan
Write-Host "✅ 自动检测SSL证书文件" -ForegroundColor Green
Write-Host "✅ 支持HTTPS和HTTP模式切换" -ForegroundColor Green
Write-Host "✅ 自动HTTP到HTTPS重定向" -ForegroundColor Green
Write-Host "✅ 证书链自动加载" -ForegroundColor Green
Write-Host "✅ 优雅关闭处理" -ForegroundColor Green
Write-Host "✅ 详细的错误日志" -ForegroundColor Green

Write-Host ""
Write-Host "📞 下一步：" -ForegroundColor Red
Write-Host "1. 完成SSL证书申请" -ForegroundColor White
Write-Host "2. 使用新的SSL配置启动服务器" -ForegroundColor White
Write-Host "3. 测试HTTPS访问" -ForegroundColor White
Write-Host "4. 配置Cloudflare SSL模式" -ForegroundColor White