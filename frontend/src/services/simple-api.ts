import axios from 'axios';

// 简化版API配置
const API_BASE_URL = 'http://localhost:3002/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 示例数据
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

// 模拟API服务
export const simpleApiService = {
  // 用户注册
  register: async (data: any) => {
    return {
      success: true,
      message: '用户注册成功',
      data: {
        user: {
          id: Date.now().toString(),
          username: data.username,
          email: data.email,
          avatar: 'https://via.placeholder.com/50x50?text=User',
          creditScore: 100,
          verified: false
        }
      }
    };
  },

  // 用户登录
  login: async (data: any) => {
    return {
      success: true,
      message: '登录成功',
      data: {
        user: mockUsers[0],
        token: 'mock-jwt-token-' + Date.now()
      }
    };
  },

  // 获取资源列表
  getResources: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/resources', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      // 返回模拟数据
      return {
        success: true,
        data: [
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
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };
    }
  },

  // 获取单个资源
  getResource: async (id: string) => {
    return {
      success: true,
      data: {
        id: id,
        title: '高端相机租赁',
        description: '佳能EOS R5专业相机，适合拍摄高质量照片和视频',
        price: 150.00,
        images: ['https://via.placeholder.com/300x200?text=Canon+R5'],
        location: '北京市朝阳区',
        status: 'AVAILABLE',
        category: '数码设备',
        owner: mockUsers[0]
      }
    };
  },

  // 创建资源
  createResource: async (data: any) => {
    return {
      success: true,
      message: '资源创建成功',
      data: {
        id: Date.now().toString(),
        ...data,
        status: 'AVAILABLE',
        owner: mockUsers[0]
      }
    };
  }
};

export default simpleApiService;