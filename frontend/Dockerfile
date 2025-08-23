# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 使用 Nginx 服务静态文件
FROM nginx:alpine AS production

# 安装必要工具
RUN apk add --no-cache curl

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run

# 切换到非 root 用户
USER nginx

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\n  CMD curl -f http://localhost:3000/ || exit 1

# 启动 Nginx
CMD [\"nginx\", \"-g\", \"daemon off;\"]