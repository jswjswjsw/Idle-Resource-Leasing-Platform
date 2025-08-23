import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './config/database'; // 复用统一的Prisma客户端，避免多实例与类型问题

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 认证中间件
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    req.user = user;
    next();
  });
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/profile',
      '/api/resources',
      '/api/users'
    ]
  });
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;

    // 验证输入
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱、用户名和密码为必填项'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '邮箱或用户名已被使用'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        phone,
        avatar: null
      }
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码为必填项'
      });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或密码错误'
      });
    }

    // 验证密码
    // 密码可能为空（第三方登录用户），需显式判断避免类型错误
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 获取用户信息
app.get('/api/auth/profile', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更新用户信息
app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
  try {
    const { username, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        username,
        phone,
        avatar
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

// 获取所有用户（简化版本）
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 资源管理
// 获取资源列表
app.get('/api/resources', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.resource.count()
    ]);

    res.json({
      success: true,
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取资源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源列表失败'
    });
  }
});

// 创建资源
app.post('/api/resources', authenticateToken, async (req: any, res) => {
  try {
    // 入参：使用 categoryId/latitude/longitude 以匹配 Prisma 模型
    const { title, description, price, images, location, categoryId, latitude, longitude } = req.body;

    if (!title || !description || !price || !location || !categoryId) {
      return res.status(400).json({
        success: false,
        message: '标题、描述、价格、位置与分类ID为必填项'
      });
    }

    // 将图片数组序列化为字符串（schema 中 images 为 String）
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : (typeof images === 'string' ? images : '[]');

    const resource = await prisma.resource.create({
      data: {
        title, // 标题
        description, // 描述
        price: parseFloat(price), // 价格（转为 number）
        images: imagesStr, // 图片（字符串化）
        location, // 位置（字符串）
        latitude: latitude != null ? parseFloat(latitude) : 0, // 纬度，未提供则为 0
        longitude: longitude != null ? parseFloat(longitude) : 0, // 经度，未提供则为 0
        categoryId, // 分类ID（必填）
        status: 'AVAILABLE', // 状态
        ownerId: req.user.userId // 资源所有者ID
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '资源创建成功',
      data: resource
    });
  } catch (error) {
    console.error('创建资源失败:', error);
    res.status(500).json({
      success: false,
      message: '创建资源失败'
    });
  }
});

// 获取单个资源
app.get('/api/resources/:id', async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('获取资源失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源失败'
    });
  }
});

// 更新资源
app.put('/api/resources/:id', authenticateToken, async (req: any, res) => {
  try {
    const { title, description, price, images, location, status } = req.body;

    // 检查资源所有权
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    if (resource.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权更新此资源'
      });
    }

    const updatedResource = await prisma.resource.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        images,
        location,
        status
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '资源更新成功',
      data: updatedResource
    });
  } catch (error) {
    console.error('更新资源失败:', error);
    res.status(500).json({
      success: false,
      message: '更新资源失败'
    });
  }
});

// 删除资源
app.delete('/api/resources/:id', authenticateToken, async (req: any, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    if (resource.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此资源'
      });
    }

    await prisma.resource.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: '资源删除成功'
    });
  } catch (error) {
    console.error('删除资源失败:', error);
    res.status(500).json({
      success: false,
      message: '删除资源失败'
    });
  }
});

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    app.listen(PORT, () => {
      console.log(`🚀 认证服务器运行在端口 ${PORT}`);
      console.log(`📚 注册: POST ${BASE_URL}/api/auth/register`);
      console.log(`🔑 登录: POST ${BASE_URL}/api/auth/login`);
      console.log(`👤 用户信息: GET ${BASE_URL}/api/auth/profile`);
      console.log(`📦 资源列表: GET ${BASE_URL}/api/resources`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在优雅关闭...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在优雅关闭...');
  await prisma.$disconnect();
  process.exit(0);
});