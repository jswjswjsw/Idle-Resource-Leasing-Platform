# 第三方服务申请与配置详细指南

## 🚀 申请优先级说明

根据项目需求，按以下优先级依次申请和配置服务：

### 高优先级（必须完成）
1. **GitHub OAuth** - 用户登录认证
2. **高德地图API** - 地理位置服务
3. **支付宝沙箱** - 支付功能测试

### 中优先级（建议完成）
4. **阿里云短信服务** - 短信通知
5. **Google OAuth** - 备用登录方式

### 低优先级（可选完成）
6. **百度地图API** - 地图服务备选
7. **Gitee OAuth** - 国内开发者登录
8. **微信支付沙箱** - 支付方式扩展

---

## 🎯 高优先级服务配置

### 1. GitHub OAuth 配置

#### 申请步骤
1. **访问GitHub开发者设置**
   - 登录GitHub：https://github.com
   - 访问：https://github.com/settings/applications
   - 点击 "New OAuth App"

2. **填写应用信息**
   ```
   Application name: 交易平台
   Homepage URL: https://wwwcn.uk
   Application description: 基于Node.js的全栈交易平台
   Authorization callback URL: https://api.wwwcn.uk/api/auth/oauth/github/callback
   ```

3. **获取凭据**
   - 创建后获得 `Client ID`
   - 点击 "Generate a new client secret" 获得 `Client Secret`
   - **重要**: 妥善保存这两个值

4. **环境变量配置**
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/github/callback
   ```

### 2. 高德地图API 配置

#### 申请步骤
1. **注册高德开发者账号**
   - 访问：https://console.amap.com
   - 使用手机号注册并完成实名认证

2. **创建应用**
   - 进入控制台 → 应用管理 → 我的应用
   - 点击 "创建新应用"
   - 填写信息：
     ```
     应用名称: 交易平台
     应用类型: Web服务
     ```

3. **添加Key**
   - 在应用下点击 "添加Key"
   - 配置信息：
     ```
     Key名称: 交易平台API
     服务平台: Web服务
     IP白名单: 0.0.0.0/0 (测试阶段，生产环境需限制)
     ```

4. **配置域名白名单**
   - 在Key设置中添加域名：
     - `wwwcn.uk`
     - `api.wwwcn.uk`
     - `*.wwwcn.uk`

5. **环境变量配置**
   ```env
   AMAP_API_KEY=your_amap_api_key
   ```

#### 免费额度说明
- **日调用量**: 100万次/天
- **并发量**: 100次/秒
- **有效期**: 永久免费
- **服务**: 地理编码、逆地理编码、IP定位、POI搜索

### 3. 支付宝沙箱配置

#### 申请步骤
1. **注册蚂蚁金服开放平台**
   - 访问：https://open.alipay.com
   - 使用支付宝账号登录

2. **进入沙箱环境**
   - 登录后访问：https://open.alipay.com/dev/workspace
   - 选择 "沙箱环境"

3. **获取沙箱信息**
   - 在沙箱应用中找到以下信息：
     ```
     APPID: 沙箱应用APPID
     应用私钥: 用于签名
     支付宝公钥: 用于验签
     ```

4. **生成密钥对**
   - 下载 "支付宝开放平台助手"
   - 生成RSA2密钥对
   - 上传公钥到沙箱应用

5. **配置回调地址**
   - 在沙箱应用设置中添加：
     ```
     网关地址: https://openapi.alipaydev.com/gateway.do
     授权回调地址: https://api.wwwcn.uk/api/payment/alipay/callback
     应用网关: https://api.wwwcn.uk
     ```

6. **环境变量配置**
   ```env
   ALIPAY_SANDBOX_APP_ID=your_sandbox_app_id
   ALIPAY_SANDBOX_PRIVATE_KEY=your_private_key_content
   ALIPAY_SANDBOX_PUBLIC_KEY=alipay_sandbox_public_key
   ALIPAY_SANDBOX_GATEWAY=https://openapi.alipaydev.com/gateway.do
   ```

---

## 🎯 中优先级服务配置

### 4. 阿里云短信服务配置

#### 申请步骤
1. **注册阿里云账号**
   - 访问：https://www.aliyun.com
   - 完成实名认证

2. **开通短信服务**
   - 进入控制台 → 产品与服务 → 短信服务
   - 开通服务（免费）

3. **创建AccessKey**
   - 访问：https://usercenter.console.aliyun.com
   - 点击 AccessKey管理 → 创建AccessKey
   - **安全建议**: 创建RAM子用户，只给短信服务权限

4. **申请签名和模板**
   - **短信签名申请**:
     ```
     签名名称: 交易平台
     签名来源: 网站
     签名内容: 【交易平台】
     ```
   - **短信模板申请**:
     ```
     模板类型: 验证码
     模板名称: 注册验证码
     模板内容: 您的验证码是${code}，5分钟内有效。
     ```

5. **环境变量配置**
   ```env
   ALIYUN_SMS_ACCESS_KEY_ID=your_access_key_id
   ALIYUN_SMS_ACCESS_KEY_SECRET=your_access_key_secret
   ALIYUN_SMS_SIGN_NAME=交易平台
   ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxx
   ```

#### 免费额度说明
- **新用户**: 100条免费短信
- **计费**: 国内短信 0.045元/条
- **触达率**: 99%以上

### 5. Google OAuth 配置

#### 申请步骤
1. **访问Google Cloud Console**
   - 登录：https://console.cloud.google.com
   - 创建新项目或选择现有项目

2. **启用Google+ API**
   - 导航到 "API和服务" → "库"
   - 搜索并启用 "Google+ API"

3. **创建OAuth凭据**
   - 进入 "API和服务" → "凭据"
   - 点击 "创建凭据" → "OAuth客户端ID"
   - 选择 "Web应用程序"

4. **配置OAuth同意屏幕**
   - 应用名称: 交易平台
   - 用户支持电子邮件: 您的邮箱
   - 授权域: wwwcn.uk

5. **设置重定向URI**
   ```
   授权的重定向URI: https://api.wwwcn.uk/api/auth/oauth/google/callback
   ```

6. **环境变量配置**
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/google/callback
   ```

---

## 🎯 低优先级服务配置

### 6. 百度地图API 配置

#### 申请步骤
1. **注册百度开发者账号**
   - 访问：https://lbsyun.baidu.com
   - 注册并完成实名认证

2. **创建应用**
   - 进入控制台 → 应用管理 → 我的应用
   - 创建应用：
     ```
     应用名称: 交易平台
     应用类型: 服务端
     ```

3. **获取AK**
   - 在应用详情中获取 "访问应用(AK)"

4. **配置IP白名单**
   - 在应用设置中添加服务器IP
   - 测试阶段可设置为 `0.0.0.0/0`

5. **环境变量配置**
   ```env
   BAIDU_MAP_API_KEY=your_baidu_map_ak
   ```

### 7. Gitee OAuth 配置

#### 申请步骤
1. **访问Gitee应用管理**
   - 登录Gitee：https://gitee.com
   - 访问：https://gitee.com/oauth/applications

2. **创建应用**
   ```
   应用名称: 交易平台
   应用主页: https://wwwcn.uk
   应用描述: 基于Node.js的全栈交易平台
   授权回调地址: https://api.wwwcn.uk/api/auth/oauth/gitee/callback
   ```

3. **环境变量配置**
   ```env
   GITEE_CLIENT_ID=your_gitee_client_id
   GITEE_CLIENT_SECRET=your_gitee_client_secret
   GITEE_REDIRECT_URI=https://api.wwwcn.uk/api/auth/oauth/gitee/callback
   ```

### 8. 微信支付沙箱配置

#### 申请步骤
1. **申请微信商户号**
   - 访问：https://pay.weixin.qq.com
   - 提交资料申请（个人可申请小微商户）

2. **开通沙箱环境**
   - 商户平台 → 开发配置 → 沙箱环境
   - 获取沙箱商户号和API密钥

3. **配置回调地址**
   ```
   支付回调: https://api.wwwcn.uk/api/payment/wechat/callback
   ```

4. **环境变量配置**
   ```env
   WECHAT_SANDBOX_APP_ID=your_wechat_app_id
   WECHAT_SANDBOX_MCH_ID=your_wechat_mch_id
   WECHAT_SANDBOX_API_KEY=your_wechat_api_key
   ```

---

## 📋 配置检查清单

### 高优先级服务 ✅
- [ ] GitHub OAuth Client ID 和 Secret
- [ ] 高德地图 API Key
- [ ] 支付宝沙箱 App ID、私钥、公钥

### 中优先级服务 ⚠️
- [ ] 阿里云短信 AccessKey 和签名模板
- [ ] Google OAuth Client ID 和 Secret

### 低优先级服务 📝
- [ ] 百度地图 API Key
- [ ] Gitee OAuth Client ID 和 Secret  
- [ ] 微信支付沙箱配置

### 回调地址配置 🔄
- [ ] 所有OAuth服务回调地址更新为 `https://api.wwwcn.uk/api/auth/oauth/{provider}/callback`
- [ ] 支付服务回调地址更新为 `https://api.wwwcn.uk/api/payment/{provider}/callback`
- [ ] 域名白名单添加 `wwwcn.uk` 和 `*.wwwcn.uk`

---

## 🛡️ 安全建议

1. **密钥管理**
   - 所有密钥使用环境变量存储
   - 生产环境使用专用密钥，与测试环境分离
   - 定期轮换API密钥

2. **访问控制**
   - 配置IP白名单（生产环境）
   - 使用HTTPS进行所有API调用
   - 启用API调用频率限制

3. **监控告警**
   - 设置API调用量监控
   - 配置异常访问告警
   - 定期检查账单和用量

---

## 📞 技术支持

如果在申请过程中遇到问题，可以联系对应平台的技术支持：

- **GitHub**: https://support.github.com
- **高德地图**: https://lbs.amap.com/dev/ticket
- **支付宝**: https://open.alipay.com/dev/workspace
- **阿里云**: https://workorder.console.aliyun.com
- **Google**: https://support.google.com/cloud
- **百度地图**: https://lbsyun.baidu.com/apiconsole/center
- **Gitee**: https://gitee.com/help
- **微信支付**: https://kf.qq.com