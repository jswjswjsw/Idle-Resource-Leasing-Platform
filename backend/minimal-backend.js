const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Mock data
const mockUsers = [
  {
    id: '1',
    username: '测试用户',
    email: 'test@example.com',
    phone: '13800138000',
    avatar: 'https://via.placeholder.com/50x50?text=User',
    creditScore: 100,
    verified: true
  }
];

const mockResources = [
  {
    id: '1',
    title: '高端相机租赁',
    description: '佳能EOS R5专业相机，适合拍摄高质量照片和视频',
    price: 150.00,
    images: ['https://via.placeholder.com/300x200?text=Canon+R5'],
    location: '北京市朝阳区',
    status: 'AVAILABLE',
    category: '数码设备',
    owner: mockUsers[0]
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
    owner: mockUsers[0]
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, phone, password } = req.body;
  
  res.json({
    success: true,
    message: '用户注册成功',
    data: {
      user: {
        id: Date.now().toString(),
        username,
        email,
        avatar: 'https://via.placeholder.com/50x50?text=User',
        creditScore: 100,
        verified: false
      }
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: mockUsers[0],
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

app.get('/api/resources', (req, res) => {
  res.json({
    success: true,
    data: mockResources,
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  });
});

app.get('/api/messages/:orderId', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        content: '你好，我对这个租赁很感兴趣',
        senderId: '1',
        receiverId: '2',
        orderId: req.params.orderId,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/messages', (req, res) => {
  const { content, receiverId, orderId } = req.body;
  
  res.json({
    success: true,
    message: '消息发送成功',
    data: {
      id: Date.now().toString(),
      content,
      senderId: '1',
      receiverId,
      orderId,
      createdAt: new Date().toISOString()
    }
  });
});

// Catch all handler: return React app for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:3002`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/messages`);
});