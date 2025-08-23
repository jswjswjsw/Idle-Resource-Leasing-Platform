import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.IO 设置
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    onlineUsers: Object.keys(connectedUsers).length
  });
});

// 服务器状态
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      server: {
        port: PORT,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      version: '1.0.0'
    }
  });
});

// 测试API连接
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API连接成功',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: [
        '/health - 健康检查',
        '/api/test - 测试连接',
        '/api/resources - 示例资源',
        '/api/status - 服务器状态',
        '/api/auth/register - 用户注册',
        '/api/auth/login - 用户登录',
        '/api/resources/list - 资源列表'
      ]
    }
  });
});

// 示例资源数据
const sampleResources = [
  {
    id: '1',
    title: '高端相机租赁',
    description: '佳能EOS R5专业相机，适合拍摄高质量照片和视频',
    price: 150.00,
    images: ['https://via.placeholder.com/300x200?text=Canon+R5'],
    location: '北京市朝阳区',
    status: 'AVAILABLE',
    category: '数码设备',
    owner: {
      id: '1',
      username: '摄影爱好者',
      avatar: 'https://via.placeholder.com/50x50?text=User1'
    }
  },
  {
    id: '2',
    title: '无人机航拍服务',
    description: '大疆Mavic 3无人机，专业航拍，4K画质',
    price: 200.00,
    images: ['https://via.placeholder.com/300x200?text=Drone+Mavic3'],
    location: '上海市浦东新区',
    status: 'AVAILABLE',
    category: '数码设备',
    owner: {
      id: '2',
      username: '航拍专家',
      avatar: 'https://via.placeholder.com/50x50?text=User2'
    }
  },
  {
    id: '3',
    title: '会议室租赁',
    description: '现代化会议室，可容纳20人，配备投影和音响',
    price: 300.00,
    images: ['https://via.placeholder.com/300x200?text=Meeting+Room'],
    location: '深圳市南山区',
    status: 'AVAILABLE',
    category: '办公空间',
    owner: {
      id: '3',
      username: '商务中心',
      avatar: 'https://via.placeholder.com/50x50?text=User3'
    }
  }
];

// 获取示例资源
app.get('/api/resources', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedResources = sampleResources.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedResources,
    pagination: {
      page,
      limit,
      total: sampleResources.length,
      totalPages: Math.ceil(sampleResources.length / limit)
    }
  });
});

// 用户注册
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, phone } = req.body;
  
  // 简单验证
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: '请提供用户名、邮箱和密码'
    });
  }

  // 模拟用户创建
  const user = {
    id: Date.now().toString(),
    username,
    email,
    phone: phone || '',
    avatar: 'https://via.placeholder.com/50x50?text=User',
    creditScore: 100,
    verified: false,
    createdAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: '用户注册成功',
    data: { user }
  });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // 简单验证
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: '请提供邮箱和密码'
    });
  }

  // 模拟用户登录
  const user = {
    id: '1',
    username: '测试用户',
    email,
    avatar: 'https://via.placeholder.com/50x50?text=User',
    creditScore: 100,
    verified: true
  };

  const token = 'mock-jwt-token-' + Date.now();

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user,
      token
    }
  });
});

// 创建资源
app.post('/api/resources', (req, res) => {
  const { title, description, price, images, location } = req.body;
  
  const newResource = {
    id: (sampleResources.length + 1).toString(),
    title,
    description,
    price: parseFloat(price),
    images: images || [],
    location,
    status: 'AVAILABLE',
    category: '其他',
    owner: {
      id: '1',
      username: '当前用户',
      avatar: 'https://via.placeholder.com/50x50?text=User'
    }
  };
  
  sampleResources.push(newResource);
  
  res.status(201).json({
    success: true,
    data: newResource,
    message: '资源创建成功'
  });
});

// Socket.IO 用户连接管理
const connectedUsers: { [key: string]: string } = {};

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('user_connected', (userId: string) => {
    connectedUsers[userId] = socket.id;
    console.log(`用户 ${userId} 已连接`);
    
    // 广播用户上线
    socket.broadcast.emit('user_online', { userId, timestamp: new Date() });
  });

  socket.on('send_message', (data) => {
    console.log('收到消息:', data);
    
    // 广播消息给所有用户
    io.emit('new_message', {
      ...data,
      timestamp: new Date(),
      id: Date.now().toString()
    });
  });

  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    // 移除用户连接
    for (const [userId, socketId] of Object.entries(connectedUsers)) {
      if (socketId === socket.id) {
        delete connectedUsers[userId];
        io.emit('user_offline', { userId, timestamp: new Date() });
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`🔌 Socket.IO 已启动`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 测试API: http://localhost:${PORT}/api/test`);
  console.log(`📦 示例资源: http://localhost:${PORT}/api/resources`);
});