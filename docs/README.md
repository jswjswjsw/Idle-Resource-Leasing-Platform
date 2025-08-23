# 交易平台项目开发文档

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [环境搭建](#环境搭建)
4. [项目结构](#项目结构)
5. [开发规范](#开发规范)
6. [API 文档](#api-文档)
7. [数据库设计](#数据库设计)
8. [测试指南](#测试指南)
9. [部署指南](#部署指南)
10. [常见问题](#常见问题)

## 📖 项目概述

这是一个基于 Node.js + React 的全栈交易平台项目，支持用户注册登录、资源发布、订单管理、在线支付、实时聊天等功能。

### 🎯 主要功能

- **用户系统**：注册、登录、OAuth 登录（微信、GitHub）
- **资源管理**：发布、编辑、搜索、分类管理
- **订单系统**：预订、支付、状态跟踪
- **支付集成**：支付宝、微信支付
- **实时通信**：WebSocket 聊天、通知推送
- **文件上传**：图片上传、云存储
- **地理位置**：地图集成、位置搜索

## 🛠 技术栈

### 后端技术

- **运行时**：Node.js 18+
- **框架**：Express.js
- **语言**：TypeScript
- **数据库**：SQLite (开发) / PostgreSQL (生产)
- **ORM**：Prisma
- **缓存**：Redis
- **认证**：JWT
- **文件存储**：AWS S3 / 阿里云 OSS
- **支付**：支付宝 SDK、微信支付 SDK
- **实时通信**：Socket.IO
- **日志**：Winston
- **测试**：Jest + Supertest

### 前端技术

- **框架**：React 18
- **语言**：TypeScript
- **状态管理**：React Query + Context API
- **样式**：Tailwind CSS
- **路由**：React Router v6
- **表单**：React Hook Form
- **图标**：Lucide React
- **动画**：Framer Motion
- **地图**：百度地图 / 高德地图
- **测试**：React Testing Library

## 🚀 环境搭建

### 前置要求

- Node.js 18.0+
- npm 或 yarn
- Docker (可选)
- Redis (可选，生产环境推荐)

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd trade
```

2. **安装依赖**

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **环境配置**

```bash
# 后端环境配置
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库和第三方服务

# 前端环境配置
cd ../frontend
cp .env.example .env
# 编辑 .env 文件，配置 API 地址等
```

4. **数据库初始化**

```bash
cd backend

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 种子数据（可选）
npx prisma db seed
```

5. **启动开发服务器**

```bash
# 启动后端服务器
cd backend
npm run dev

# 启动前端服务器（新终端窗口）
cd frontend
npm start
```

6. **验证安装**

- 后端服务：http://localhost:3001
- 前端应用：http://localhost:3000
- API 文档：http://localhost:3001/api-docs
- 健康检查：http://localhost:3001/health

## 📁 项目结构

```
trade/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── index.ts        # 入口文件
│   ├── prisma/             # 数据库相关
│   │   ├── schema.prisma   # 数据库模式
│   │   └── migrations/     # 迁移文件
│   ├── tests/              # 测试文件
│   └── package.json
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── hooks/          # 自定义钩子
│   │   ├── services/       # API 服务
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── App.tsx         # 主组件
│   └── package.json
├── scripts/                # 自动化脚本
├── docs/                   # 文档
└── docker-compose.yml      # Docker 配置
```

## 📝 开发规范

### 代码规范

1. **命名规范**
   - 文件名：kebab-case（user-service.ts）
   - 变量/函数：camelCase（getUserById）
   - 类名：PascalCase（UserService）
   - 常量：UPPER_SNAKE_CASE（MAX_FILE_SIZE）
   - 组件：PascalCase（UserProfile）

2. **文件组织**
   - 按功能模块组织代码
   - 每个文件单一职责
   - 导出使用命名导出（优先）或默认导出

3. **TypeScript 规范**
   - 严格类型检查
   - 接口优于类型别名（除特殊情况）
   - 使用泛型提高代码复用性
   - 避免使用 any 类型

### Git 规范

1. **分支命名**
   - feature/功能名称
   - bugfix/问题描述
   - hotfix/紧急修复
   - release/版本号

2. **提交消息**
   ```
   type(scope): description
   
   [optional body]
   
   [optional footer]
   ```
   
   类型：feat, fix, docs, style, refactor, test, chore

### 代码审查

- 所有代码必须通过 PR 审查
- 确保测试覆盖率
- 遵循 ESLint 和 Prettier 规则
- 更新相关文档

## 🔌 API 文档

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

### 通用响应格式

```json
{
  \"success\": true,
  \"data\": {},
  \"message\": \"操作成功\",
  \"timestamp\": \"2024-01-01T00:00:00.000Z\"
}
```

### 错误响应格式

```json
{
  \"success\": false,
  \"error\": \"错误描述\",
  \"code\": \"ERROR_CODE\",
  \"timestamp\": \"2024-01-01T00:00:00.000Z\"
}
```

### 主要 API 端点

#### 认证相关

```
POST   /auth/register     # 用户注册
POST   /auth/login        # 用户登录
POST   /auth/logout       # 用户登出
POST   /auth/refresh      # 刷新令牌
GET    /auth/me           # 获取当前用户信息
```

#### 用户相关

```
GET    /users/profile     # 获取用户资料
PUT    /users/profile     # 更新用户资料
POST   /users/avatar      # 上传头像
GET    /users/:id         # 获取用户信息
```

#### 资源相关

```
GET    /resources         # 获取资源列表
POST   /resources         # 创建资源
GET    /resources/:id     # 获取资源详情
PUT    /resources/:id     # 更新资源
DELETE /resources/:id     # 删除资源
```

#### 订单相关

```
GET    /orders            # 获取订单列表
POST   /orders            # 创建订单
GET    /orders/:id        # 获取订单详情
PUT    /orders/:id        # 更新订单状态
```

详细的 API 文档请访问：http://localhost:3001/api-docs

## 🗄 数据库设计

### 核心表结构

1. **users** - 用户表
2. **resources** - 资源表
3. **categories** - 分类表
4. **orders** - 订单表
5. **payments** - 支付记录表
6. **messages** - 消息表
7. **notifications** - 通知表
8. **reviews** - 评价表

### 关系图

```
users (1) -----> (*) resources
users (1) -----> (*) orders (as renter)
users (1) -----> (*) orders (as owner)
resources (1) -> (*) orders
orders (1) ----> (*) payments
orders (1) ----> (*) messages
orders (1) ----> (1) reviews
```

详细的数据库设计请查看 `backend/prisma/schema.prisma`

## 🧪 测试指南

### 测试策略

1. **单元测试**：测试独立的函数和类
2. **集成测试**：测试 API 端点和数据库交互
3. **端到端测试**：测试完整的用户流程

### 运行测试

```bash
# 后端测试
cd backend
npm test                    # 运行所有测试
npm run test:watch         # 监视模式
npm run test:coverage      # 覆盖率报告

# 前端测试
cd frontend
npm test                    # 运行所有测试
npm run test:coverage      # 覆盖率报告
```

### 测试覆盖率要求

- 整体覆盖率：≥ 70%
- 核心业务逻辑：≥ 80%
- 工具函数：≥ 90%

## 🚀 部署指南

### 环境要求

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Nginx (反向代理)

### 生产部署

1. **构建应用**

```bash
# 构建后端
cd backend
npm run build

# 构建前端
cd frontend
npm run build
```

2. **配置环境变量**

```bash
# 复制并编辑生产环境配置
cp .env.example .env.production
```

3. **数据库迁移**

```bash
cd backend
npx prisma migrate deploy
```

4. **启动服务**

```bash
# 使用 PM2 管理进程
pm2 start ecosystem.config.js

# 或使用 Docker
docker-compose up -d
```

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## ❓ 常见问题

### 开发环境问题

**Q: 启动时数据库连接失败？**
A: 检查 `.env` 文件中的 `DATABASE_URL` 配置，确保数据库服务已启动。

**Q: Redis 连接失败？**
A: 如果没有 Redis 服务，系统会自动降级使用内存缓存。生产环境建议使用 Redis。

**Q: 文件上传失败？**
A: 检查上传目录权限，或配置云存储服务（AWS S3 / 阿里云 OSS）。

### 部署问题

**Q: 生产环境性能问题？**
A: 检查数据库索引、开启 Redis 缓存、配置 CDN。

**Q: HTTPS 配置？**
A: 使用 Nginx 作为反向代理，配置 SSL 证书。

### 更多帮助

- 📧 技术支持邮箱：support@example.com
- 📖 详细文档：[项目 Wiki]()
- 🐛 问题反馈：[GitHub Issues]()

---

**最后更新时间**: 2024-01-01  
**文档版本**: v1.0.0