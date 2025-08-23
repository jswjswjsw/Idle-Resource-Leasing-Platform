# Claude Code 项目配置指南

## 🎯 配置概述

本项目已配置完成以下功能：

1. **中文对话模式** - 所有对话使用中文
2. **中文编码保护** - 防止中文乱码
3. **语句级中文注释** - 自动添加详细中文注释
4. **功能独立分类** - 文件按功能独立存放
5. **接口自动连接** - 前后端数据库接口智能连接
6. **项目自动整理** - 代码生成后自动整理项目结构

## 📁 项目结构

```
trade/
├── frontend/                 # 前端文件
│   ├── components/          # 前端组件
│   ├── pages/              # 页面文件
│   ├── services/           # API服务
│   ├── utils/              # 工具函数
│   ├── styles/             # 样式文件
│   └── assets/             # 静态资源
├── backend/                 # 后端文件
│   ├── controllers/        # 控制器
│   ├── models/             # 数据模型
│   ├── routes/             # 路由定义
│   ├── middleware/         # 中间件
│   ├── services/           # 业务逻辑
│   └── config/             # 配置文件
├── database/                # 数据库文件
│   ├── schemas/            # 数据库模式
│   ├── migrations/         # 迁移文件
│   ├── seeds/              # 种子数据
│   └── queries/            # 查询语句
├── third-party-integration/ # 第三方集成
│   ├── apis/               # 第三方API
│   ├── adapters/           # 适配器
│   ├── config/             # 集成配置
│   └── wrappers/           # 包装器
├── tests/                   # 测试文件
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── fixtures/           # 测试数据
├── scripts/                 # 自动化脚本
└── .claude/                # Claude配置
```

## 🚀 使用方法

### 1. 初始化项目
```bash
npm run claude-setup
```

### 2. 验证项目结构
```bash
npm run validate
```

### 3. 整理项目文件
```bash
npm run organize
```

### 4. 添加中文注释
```bash
npm run add-comments
```

## ⚙️ 配置文件说明

### `.claude.json`
主配置文件，包含：
- 中文对话设置
- 编码配置
- 文件组织规则
- 接口连接配置

### `.claude-hooks.json`
Hooks配置文件，包含：
- 启动时设置
- 文件写入前后处理
- 提交前检查
- 代码生成后整理

## 🔧 自动化功能

### 中文编码保护
- 自动检测UTF-8编码
- 防止中文乱码
- 统一文件编码格式

### 智能文件分类
- 根据文件类型和功能自动分类
- 支持多种文件扩展名识别
- 智能子文件夹分配

### 接口自动连接
- 前端-后端API连接
- 后端-数据库连接
- 第三方服务集成

### 中文注释生成
- 文件头注释
- 函数级注释
- 语句级注释
- 类定义注释

## 📋 使用流程

1. **开始新项目**:
   ```bash
   npm run claude-setup
   ```

2. **编写代码**:
   - Claude会自动添加中文注释
   - 文件会自动分类到对应文件夹

3. **代码完成后**:
   ```bash
   npm run organize
   ```

4. **验证项目**:
   ```bash
   npm run validate
   ```

## 🎨 自定义配置

可以根据项目需要修改以下文件：
- `.claude.json` - 主要配置
- `.claude-hooks.json` - 钩子配置
- `scripts/` 目录下的脚本文件

## 📝 注意事项

1. 所有文件默认使用UTF-8编码
2. 中文注释会自动添加到代码中
3. 文件移动前会创建必要的目录结构
4. 接口配置文件会自动生成
5. 测试文件会根据项目结构创建

## 🔍 故障排除

如果遇到问题：
1. 检查`.claude.json`配置是否正确
2. 确保所有依赖已安装
3. 运行`npm run validate`检查项目结构
4. 查看控制台输出获取详细错误信息