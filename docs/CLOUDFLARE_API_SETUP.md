# Cloudflare API 配置详细步骤

## 步骤1：登录Cloudflare控制台
1. 访问：https://dash.cloudflare.com
2. 使用您的账号登录
3. 选择您的 `wwwcn.uk` 域名

## 步骤2：获取Zone ID
1. 在域名概览页面右侧，找到 "API" 部分
2. 复制 "Zone ID"，格式类似：`1234567890abcdef1234567890abcdef`
3. 保存此ID，稍后配置时需要使用

## 步骤3：创建API Token
1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token" 按钮
3. 选择 "Custom token" 模板
4. 配置Token权限：
   - **Token name**: `wwwcn-uk-deployment`
   - **Permissions**: 
     - Zone:Zone:Edit
     - Zone:DNS:Edit
     - Zone:Zone Settings:Edit
   - **Zone Resources**: 
     - Include - Specific zone - wwwcn.uk
   - **Client IP Address Filtering**: 可选，留空表示不限制IP
   - **TTL**: 可选，建议设置为1年

5. 点击 "Continue to summary"
6. 确认配置后点击 "Create Token"
7. **重要**: 复制生成的Token并妥善保存，此Token只显示一次

## 步骤4：验证API Token
在Windows PowerShell中运行以下命令验证：
```powershell
# 替换YOUR_API_TOKEN为您的实际Token
$headers = @{
    "Authorization" = "Bearer YOUR_API_TOKEN"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers
```

如果返回 `"success": true`，说明Token配置正确。