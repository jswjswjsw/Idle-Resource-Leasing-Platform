# API 接口文档

## 📋 目录

1. [基础信息](#基础信息)
2. [认证方式](#认证方式)
3. [响应格式](#响应格式)
4. [错误处理](#错误处理)
5. [接口列表](#接口列表)
   - [认证相关](#认证相关)
   - [用户管理](#用户管理)
   - [资源管理](#资源管理)
   - [订单管理](#订单管理)
   - [支付相关](#支付相关)
   - [消息聊天](#消息聊天)
   - [通知管理](#通知管理)
   - [文件上传](#文件上传)
6. [SDK 示例](#sdk-示例)

## 🌐 基础信息

- **Base URL**: `https://api.trade.com/api` (生产环境)
- **Base URL**: `http://localhost:3001/api` (开发环境)
- **API 版本**: v1
- **请求格式**: JSON
- **响应格式**: JSON
- **字符编码**: UTF-8

## 🔐 认证方式

### JWT Token 认证

大部分接口需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your_access_token>
```

### 获取 Token

通过登录接口获取 access_token：

```bash
curl -X POST /api/auth/login \\n  -H \"Content-Type: application/json\" \\n  -d '{
    \"email\": \"user@example.com\",
    \"password\": \"password123\"
  }'
```

### Token 刷新

Token 过期时，使用 refresh_token 获取新的 access_token：

```bash
curl -X POST /api/auth/refresh \\n  -H \"Content-Type: application/json\" \\n  -d '{
    \"refreshToken\": \"<your_refresh_token>\"
  }'
```

## 📊 响应格式

### 成功响应

```json
{
  \"success\": true,
  \"data\": {
    // 具体数据
  },
  \"message\": \"操作成功\",
  \"timestamp\": \"2024-01-01T00:00:00.000Z\"
}
```

### 分页响应

```json
{
  \"success\": true,
  \"data\": {
    \"items\": [
      // 数据列表
    ],
    \"total\": 100,
    \"page\": 1,
    \"pageSize\": 10,
    \"totalPages\": 10,
    \"hasNext\": true,
    \"hasPrev\": false
  }
}
```

## ⚠️ 错误处理

### 错误响应格式

```json
{
  \"success\": false,
  \"error\": \"错误描述\",
  \"code\": \"ERROR_CODE\",
  \"timestamp\": \"2024-01-01T00:00:00.000Z\",
  \"details\": {
    // 错误详情（可选）
  }
}
```

### 常见错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|---------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 禁止访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 429 | TOO_MANY_REQUESTS | 请求过于频繁 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 🔑 认证相关

### 用户注册

**POST** `/auth/register`

注册新用户账户。

**请求参数**：

```json
{
  \"username\": \"string\",     // 用户名（2-50字符）
  \"email\": \"string\",        // 邮箱地址
  \"password\": \"string\",     // 密码（8-128字符）
  \"phone\": \"string\"         // 手机号（可选）
}
```

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"user\": {
      \"id\": \"user123\",
      \"username\": \"张三\",
      \"email\": \"zhang@example.com\",
      \"verified\": false
    },
    \"tokens\": {
      \"accessToken\": \"eyJ...\",
      \"refreshToken\": \"eyJ...\"
    }
  },
  \"message\": \"注册成功\"
}
```

### 用户登录

**POST** `/auth/login`

用户邮箱密码登录。

**请求参数**：

```json
{
  \"email\": \"string\",        // 邮箱地址
  \"password\": \"string\"      // 密码
}
```

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"user\": {
      \"id\": \"user123\",
      \"username\": \"张三\",
      \"email\": \"zhang@example.com\",
      \"avatar\": \"https://example.com/avatar.jpg\",
      \"verified\": true
    },
    \"tokens\": {
      \"accessToken\": \"eyJ...\",
      \"refreshToken\": \"eyJ...\"
    }
  },
  \"message\": \"登录成功\"
}
```

### 微信登录

**GET** `/auth/wechat`

获取微信授权登录 URL。

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"authUrl\": \"https://open.weixin.qq.com/connect/oauth2/authorize?...\"
  }
}
```

**GET** `/auth/wechat/callback`

微信授权回调处理。

**查询参数**：
- `code`: 微信授权码
- `state`: 状态参数

### 获取当前用户

**GET** `/auth/me`

获取当前登录用户信息。

**Headers**：
```
Authorization: Bearer <access_token>
```

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"id\": \"user123\",
    \"username\": \"张三\",
    \"email\": \"zhang@example.com\",
    \"phone\": \"13800138000\",
    \"avatar\": \"https://example.com/avatar.jpg\",
    \"creditScore\": 100,
    \"verified\": true,
    \"createdAt\": \"2024-01-01T00:00:00.000Z\"
  }
}
```

## 👤 用户管理

### 获取用户资料

**GET** `/users/profile`

获取当前用户详细资料。

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"id\": \"user123\",
    \"username\": \"张三\",
    \"email\": \"zhang@example.com\",
    \"phone\": \"13800138000\",
    \"avatar\": \"https://example.com/avatar.jpg\",
    \"creditScore\": 100,
    \"verified\": true,
    \"addresses\": [
      {
        \"id\": \"addr123\",
        \"label\": \"家\",
        \"address\": \"北京市朝阳区...\",
        \"isDefault\": true
      }
    ],
    \"paymentMethods\": [
      {
        \"id\": \"pay123\",
        \"type\": \"alipay\",
        \"name\": \"支付宝\",
        \"isDefault\": true
      }
    ]
  }
}
```

### 更新用户资料

**PUT** `/users/profile`

更新当前用户资料。

**请求参数**：

```json
{
  \"username\": \"string\",     // 用户名（可选）
  \"phone\": \"string\",        // 手机号（可选）
  \"avatar\": \"string\"        // 头像URL（可选）
}
```

## 📦 资源管理

### 获取资源列表

**GET** `/resources`

获取资源列表，支持搜索和筛选。

**查询参数**：

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|---------|
| keyword | string | 搜索关键词 | - |
| categoryId | string | 分类ID | - |
| minPrice | number | 最低价格 | - |
| maxPrice | number | 最高价格 | - |
| latitude | number | 纬度 | - |
| longitude | number | 经度 | - |
| radius | number | 搜索半径(km) | 10 |
| page | number | 页码 | 1 |
| limit | number | 每页数量 | 10 |
| sortBy | string | 排序字段 | createdAt |
| sortOrder | string | 排序方向 | desc |

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"items\": [
      {
        \"id\": \"res123\",
        \"title\": \"MacBook Pro 16寸\",
        \"description\": \"2023款，配置高性能...\",
        \"categoryId\": \"cat123\",
        \"price\": 200,
        \"priceUnit\": \"DAY\",
        \"images\": [\"https://example.com/img1.jpg\"],
        \"location\": \"北京市朝阳区\",
        \"latitude\": 39.9042,
        \"longitude\": 116.4074,
        \"status\": \"AVAILABLE\",
        \"rating\": 4.8,
        \"reviewCount\": 15,
        \"owner\": {
          \"id\": \"user456\",
          \"username\": \"李四\",
          \"avatar\": \"https://example.com/avatar2.jpg\",
          \"creditScore\": 95
        },
        \"category\": {
          \"id\": \"cat123\",
          \"name\": \"电子设备\"
        },
        \"createdAt\": \"2024-01-01T00:00:00.000Z\"
      }
    ],
    \"total\": 100,
    \"page\": 1,
    \"pageSize\": 10,
    \"totalPages\": 10
  }
}
```

### 创建资源

**POST** `/resources`

发布新资源。

**请求参数**：

```json
{
  \"title\": \"string\",           // 资源标题
  \"description\": \"string\",    // 资源描述
  \"categoryId\": \"string\",     // 分类ID
  \"price\": 100,               // 价格
  \"priceUnit\": \"DAY\",         // 价格单位
  \"location\": \"string\",       // 地址
  \"latitude\": 39.9042,        // 纬度
  \"longitude\": 116.4074,      // 经度
  \"deposit\": 50,              // 押金
  \"tags\": [\"标签1\", \"标签2\"]    // 标签
}
```

### 获取资源详情

**GET** `/resources/{id}`

获取指定资源的详细信息。

**路径参数**：
- `id`: 资源ID

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"id\": \"res123\",
    \"title\": \"MacBook Pro 16寸\",
    \"description\": \"详细描述...\",
    \"categoryId\": \"cat123\",
    \"price\": 200,
    \"priceUnit\": \"DAY\",
    \"images\": [\"https://example.com/img1.jpg\"],
    \"location\": \"北京市朝阳区\",
    \"latitude\": 39.9042,
    \"longitude\": 116.4074,
    \"status\": \"AVAILABLE\",
    \"rating\": 4.8,
    \"reviewCount\": 15,
    \"tags\": [\"笔记本\", \"苹果\"],
    \"deposit\": 500,
    \"owner\": {
      \"id\": \"user456\",
      \"username\": \"李四\",
      \"avatar\": \"https://example.com/avatar2.jpg\",
      \"creditScore\": 95,
      \"verified\": true
    },
    \"category\": {
      \"id\": \"cat123\",
      \"name\": \"电子设备\",
      \"icon\": \"laptop\"
    },
    \"reviews\": [
      {
        \"id\": \"rev123\",
        \"rating\": 5,
        \"comment\": \"设备很好，推荐！\",
        \"reviewer\": {
          \"username\": \"王五\",
          \"avatar\": \"https://example.com/avatar3.jpg\"
        },
        \"createdAt\": \"2024-01-01T00:00:00.000Z\"
      }
    ],
    \"createdAt\": \"2024-01-01T00:00:00.000Z\",
    \"updatedAt\": \"2024-01-01T00:00:00.000Z\"
  }
}
```

## 📋 订单管理

### 创建订单

**POST** `/orders`

创建新的租赁订单。

**请求参数**：

```json
{
  \"resourceId\": \"string\",     // 资源ID
  \"startDate\": \"2024-01-01T00:00:00.000Z\",  // 开始时间
  \"endDate\": \"2024-01-02T00:00:00.000Z\",    // 结束时间
  \"notes\": \"string\",          // 备注（可选）
  \"deliveryMethod\": \"PICKUP\", // 交付方式
  \"deliveryAddress\": \"string\" // 配送地址（配送时必填）
}
```

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"id\": \"order123\",
    \"resourceId\": \"res123\",
    \"startDate\": \"2024-01-01T00:00:00.000Z\",
    \"endDate\": \"2024-01-02T00:00:00.000Z\",
    \"totalPrice\": 200,
    \"deposit\": 500,
    \"status\": \"PENDING\",
    \"paymentStatus\": \"PENDING\",
    \"deliveryMethod\": \"PICKUP\",
    \"resource\": {
      \"title\": \"MacBook Pro 16寸\",
      \"images\": [\"https://example.com/img1.jpg\"]
    },
    \"createdAt\": \"2024-01-01T00:00:00.000Z\"
  },
  \"message\": \"订单创建成功\"
}
```

### 获取订单列表

**GET** `/orders`

获取当前用户的订单列表。

**查询参数**：

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|---------|
| status | string | 订单状态 | - |
| role | string | 角色(renter/owner) | - |
| page | number | 页码 | 1 |
| limit | number | 每页数量 | 10 |

## 💳 支付相关

### 创建支付

**POST** `/payments`

为订单创建支付。

**请求参数**：

```json
{
  \"orderId\": \"string\",        // 订单ID
  \"paymentMethod\": \"alipay\",  // 支付方式
  \"returnUrl\": \"string\"       // 支付成功回调URL
}
```

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"paymentId\": \"pay123\",
    \"paymentUrl\": \"https://openapi.alipay.com/gateway.do?...\",
    \"qrCode\": \"data:image/png;base64,...\",
    \"expireTime\": \"2024-01-01T01:00:00.000Z\"
  }
}
```

## 💬 消息聊天

### 获取对话列表

**GET** `/chat/conversations`

获取用户的对话列表。

**响应示例**：

```json
{
  \"success\": true,
  \"data\": [
    {
      \"orderId\": \"order123\",
      \"otherUser\": {
        \"id\": \"user456\",
        \"username\": \"李四\",
        \"avatar\": \"https://example.com/avatar2.jpg\"
      },
      \"lastMessage\": {
        \"content\": \"设备什么时候可以取？\",
        \"createdAt\": \"2024-01-01T00:00:00.000Z\",
        \"isRead\": false
      },
      \"unreadCount\": 2
    }
  ]
}
```

### 获取对话消息

**GET** `/chat/conversations/{orderId}/messages`

获取指定订单的聊天消息。

**查询参数**：
- `page`: 页码
- `limit`: 每页数量

## 📸 文件上传

### 上传文件

**POST** `/files/upload`

上传图片或文件。

**请求格式**: `multipart/form-data`

**请求参数**：
- `file`: 文件（必需）
- `type`: 文件类型（image/document）
- `purpose`: 用途（resource/user/review）

**响应示例**：

```json
{
  \"success\": true,
  \"data\": {
    \"url\": \"https://example.com/uploads/abc123.jpg\",
    \"filename\": \"abc123.jpg\",
    \"size\": 1024000,
    \"mimetype\": \"image/jpeg\"
  }
}
```

## 🔧 SDK 示例

### JavaScript/TypeScript

```typescript
// API 客户端类
class TradeAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 设置认证令牌
  setToken(token: string) {
    this.token = token;
  }

  // 基础请求方法
  private async request(method: string, path: string, data?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  // 用户登录
  async login(email: string, password: string) {
    const result = await this.request('POST', '/auth/login', {
      email,
      password,
    });
    
    if (result.success) {
      this.setToken(result.data.tokens.accessToken);
    }
    
    return result;
  }

  // 获取资源列表
  async getResources(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/resources?${query}`);
  }

  // 创建订单
  async createOrder(data: any) {
    return this.request('POST', '/orders', data);
  }
}

// 使用示例
const api = new TradeAPI('http://localhost:3001/api');

// 登录
const loginResult = await api.login('user@example.com', 'password123');
if (loginResult.success) {
  console.log('登录成功');
  
  // 获取资源列表
  const resources = await api.getResources({
    keyword: 'MacBook',
    page: 1,
    limit: 10
  });
  
  console.log('资源列表：', resources.data);
}
```

### React Hook 示例

```typescript
// 自定义 Hook
import { useState, useEffect } from 'react';

function useResources(filters: any) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const response = await api.getResources(filters);
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, [filters]);

  return { data, loading, error };
}

// 组件中使用
function ResourceList() {
  const { data, loading, error } = useResources({
    keyword: 'MacBook',
    page: 1
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {data?.items.map(resource => (
        <div key={resource.id}>
          <h3>{resource.title}</h3>
          <p>{resource.description}</p>
          <p>价格: ¥{resource.price}/{resource.priceUnit}</p>
        </div>
      ))}
    </div>
  );
}
```

---

**文档更新时间**: 2024-01-01  
**API 版本**: v1.0.0

如有问题，请联系技术支持或查看 [在线文档](http://localhost:3001/api-docs)。