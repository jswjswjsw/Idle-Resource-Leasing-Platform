# 🚀 交易平台快速开始指南

欢迎使用交易平台！这是一个基于 Node.js + React 的全栈项目，支持用户注册登录、资源发布、订单管理、在线支付等功能。

## 📋 前置要求

在开始之前，请确保您的系统已安装：

- **Node.js** 18.0+
- **npm** 8.0+
- **Docker** 和 **Docker Compose**（推荐）
- **Git**

## ⚡ 5分钟快速启动

### 方式一：使用 Docker（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd trade

# 2. 一键启动开发环境
./deploy.sh dev --build

# 3. 等待服务启动完成，然后访问：
# - 前端应用: http://localhost:3000
# - 后端API: http://localhost:3001
# - API文档: http://localhost:3001/api-docs
```

### 方式二：本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd trade

# 2. 安装依赖
npm install
cd backend && npm install
cd ../frontend && npm install

# 3. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库等

cd ../frontend
cp .env.example .env
# 编辑 .env 文件，配置API地址

# 4. 初始化数据库
cd ../backend
npx prisma migrate dev
npx prisma db seed

# 5. 启动服务
# 终端1：启动后端
cd backend
npm run dev

# 终端2：启动前端
cd frontend
npm start
```

## 🔧 开发环境配置

### 环境变量配置

#### 后端环境变量 (backend/.env)

```bash
# 必需配置
NODE_ENV=development
PORT=3001
DATABASE_URL=\"file:./dev.db\"  # SQLite
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000

# 可选配置
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 前端环境变量 (frontend/.env)

```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
```

### 数据库配置

项目默认使用 SQLite 开发，生产环境推荐 PostgreSQL：

```bash
# SQLite（开发）
DATABASE_URL=\"file:./dev.db\"

# PostgreSQL（生产）
DATABASE_URL=\"postgresql://username:password@localhost:5432/trade_db\"
```

## 📚 核心功能使用

### 用户认证

1. **注册新用户**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \\n     -H \"Content-Type: application/json\" \\n     -d '{
       \"username\": \"张三\",
       \"email\": \"zhang@example.com\",
       \"password\": \"password123\"
     }'
   ```

2. **用户登录**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \\n     -H \"Content-Type: application/json\" \\n     -d '{
       \"email\": \"zhang@example.com\",
       \"password\": \"password123\"
     }'
   ```

3. **获取用户信息**
   ```bash
   curl -H \"Authorization: Bearer <token>\" \\n     http://localhost:3001/api/auth/me
   ```

### 资源管理

1. **发布资源**
   ```bash
   curl -X POST http://localhost:3001/api/resources \\n     -H \"Authorization: Bearer <token>\" \\n     -H \"Content-Type: application/json\" \\n     -d '{
       \"title\": \"MacBook Pro\",
       \"description\": \"2023款，性能强劲\",
       \"categoryId\": \"category-id\",
       \"price\": 200,
       \"location\": \"北京市朝阳区\",
       \"latitude\": 39.9042,
       \"longitude\": 116.4074
     }'
   ```

2. **搜索资源**
   ```bash
   curl \"http://localhost:3001/api/resources?keyword=MacBook&page=1&limit=10\"
   ```

### 订单管理

1. **创建订单**
   ```bash
   curl -X POST http://localhost:3001/api/orders \\n     -H \"Authorization: Bearer <token>\" \\n     -H \"Content-Type: application/json\" \\n     -d '{
       \"resourceId\": \"resource-id\",
       \"startDate\": \"2024-01-01T00:00:00.000Z\",
       \"endDate\": \"2024-01-02T00:00:00.000Z\"
     }'
   ```

2. **查看订单**
   ```bash
   curl -H \"Authorization: Bearer <token>\" \\n     \"http://localhost:3001/api/orders?page=1&limit=10\"
   ```

## 🧪 测试

### 运行测试

```bash
# 后端测试
cd backend
npm test                 # 运行所有测试
npm run test:watch      # 监视模式
npm run test:coverage   # 生成覆盖率报告

# 前端测试
cd frontend
npm test                # 运行所有测试
npm run test:coverage   # 生成覆盖率报告
```

### 端到端测试

```bash
# 启动测试环境
./deploy.sh test --build

# 运行端到端测试
npm run test:e2e
```

## 🔍 调试

### 后端调试

1. **使用 VS Code 调试**
   - 创建 `.vscode/launch.json`
   - 设置断点
   - 按 F5 启动调试

2. **查看日志**
   ```bash
   # 开发环境
   tail -f backend/logs/combined.log
   
   # Docker 环境
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

### 前端调试

1. **浏览器开发工具**
   - 打开 Chrome DevTools
   - 使用 React Developer Tools

2. **React Query 调试**
   - 安装 React Query DevTools
   - 在浏览器中查看缓存状态

## 📊 监控和管理

### 服务状态检查

```bash
# 健康检查
curl http://localhost:3001/health
curl http://localhost:3000/health

# 服务状态
docker-compose ps
```

### 数据库管理

```bash
# Prisma Studio（数据库可视化）
cd backend
npx prisma studio

# 数据库迁移
npx prisma migrate dev
npx prisma migrate deploy  # 生产环境

# 重置数据库
npx prisma migrate reset
```

### 缓存管理

```bash
# Redis 命令行
redis-cli

# 清空缓存
redis-cli FLUSHALL

# 查看缓存状态
redis-cli INFO
```

## 🚀 部署

### 开发环境部署

```bash
./deploy.sh dev --build --migrate
```

### 生产环境部署

```bash
# 1. 构建生产镜像
./deploy.sh prod --build

# 2. 运行数据库迁移
./deploy.sh prod --migrate

# 3. 启动服务
docker-compose up -d
```

### 环境变量配置

生产环境需要配置以下关键环境变量：

```bash
# 安全配置
JWT_SECRET=your-production-secret
ENCRYPTION_KEY=your-32-char-encryption-key

# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/db

# 缓存
REDIS_URL=redis://user:pass@host:6379

# 第三方服务
ALIPAY_APP_ID=your-alipay-app-id
WECHAT_APP_ID=your-wechat-app-id
AWS_ACCESS_KEY_ID=your-aws-key
```

## 📈 性能优化

### 后端优化

1. **启用缓存**
   ```bash
   # 配置 Redis
   REDIS_URL=redis://localhost:6379
   ```

2. **数据库优化**
   ```bash
   # 添加索引
   npx prisma db push
   ```

3. **日志级别**
   ```bash
   # 生产环境
   LOG_LEVEL=warn
   ```

### 前端优化

1. **代码分割**
   ```javascript
   // 使用 React.lazy
   const LazyComponent = React.lazy(() => import('./Component'));
   ```

2. **缓存策略**
   ```javascript
   // React Query 缓存配置
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5分钟
       },
     },
   });
   ```

## 🛠 常用命令

```bash
# 项目管理
npm run claude-setup       # 运行自动化设置
npm run validate           # 验证项目结构

# 代码质量
npm run lint              # 代码检查
npm run lint:fix          # 自动修复
npm run format            # 代码格式化

# 构建
npm run build             # 构建生产版本
npm run type-check        # 类型检查

# Docker
docker-compose up -d      # 启动服务
docker-compose down       # 停止服务
docker-compose logs -f    # 查看日志

# 数据库
npx prisma studio         # 数据库管理界面
npx prisma migrate dev    # 开发环境迁移
npx prisma generate       # 生成客户端
```

## 🆘 常见问题

### 启动问题

**Q: 端口被占用？**
```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

**Q: 数据库连接失败？**
```bash
# 检查数据库服务
docker-compose ps postgres

# 重新启动数据库
docker-compose restart postgres
```

**Q: 依赖安装失败？**
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 运行时问题

**Q: API 请求失败？**
- 检查后端服务是否运行
- 验证环境变量配置
- 查看网络连接

**Q: 前端页面空白？**
- 检查浏览器控制台错误
- 验证 API 地址配置
- 清除浏览器缓存

**Q: Docker 容器启动失败？**
```bash
# 查看详细日志
docker-compose logs <service-name>

# 重新构建
docker-compose build --no-cache
```

## 📞 获取帮助

- 📖 **详细文档**: [docs/README.md](docs/README.md)
- 🔌 **API 文档**: [docs/API.md](docs/API.md)
- 🐛 **问题反馈**: [GitHub Issues]()
- 💬 **技术讨论**: [Discussions]()
- 📧 **邮件支持**: support@trade.com

## 🎯 下一步

1. **阅读详细文档**: [docs/README.md](docs/README.md)
2. **查看 API 文档**: http://localhost:3001/api-docs
3. **运行示例测试**: `npm test`
4. **探索代码结构**: 从 `backend/src/index.ts` 和 `frontend/src/App.tsx` 开始
5. **加入开发社区**: 关注项目更新和最佳实践

---

🎉 **恭喜！您已经成功启动了交易平台项目！**

如果遇到任何问题，请参考上述故障排除指南或联系技术支持。祝您开发愉快！"