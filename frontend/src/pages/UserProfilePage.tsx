import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Heart, 
  Clock, 
  MessageCircle,
  Star,
  MapPin,
  Camera,
  Shield,
  Award,
  TrendingUp
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * 用户个人中心页面
 * 展示用户资料、发布的物品、收藏、订单等信息
 */
const UserProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // 模拟用户数据
  const userData = {
    id: 'user123',
    username: '摄影师小王',
    email: 'photographer@example.com',
    phone: '13800138000',
    avatar: '/api/placeholder/150/150',
    bio: '专业摄影师，5年经验，擅长人像和风景摄影。热爱分享设备，希望帮助更多摄影爱好者。',
    location: '北京市朝阳区',
    creditScore: 95,
    verified: true,
    joinDate: '2023-01-15',
    totalRentals: 156,
    totalLendings: 89,
    totalEarnings: 12800,
    rating: 4.9,
    reviewCount: 234,
    badges: ['专业摄影师', '五星房东', '快速响应', '优质设备']
  };

  // 标签页配置
  const tabs = [
    { id: 'overview', label: '概览', icon: User },
    { id: 'items', label: '我的物品', icon: Camera },
    { id: 'favorites', label: '我的收藏', icon: Heart },
    { id: 'orders', label: '订单记录', icon: Clock },
    { id: 'reviews', label: '评价管理', icon: Star },
    { id: 'settings', label: '账户设置', icon: Settings }
  ];

  // 模拟物品数据
  const myItems = [
    {
      id: 1,
      title: '索尼 A7M4 全画幅相机',
      price: 150,
      unit: 'day',
      image: '/api/placeholder/300/200',
      status: 'available',
      rentalCount: 45,
      rating: 4.9,
      earnings: 6750
    },
    {
      id: 2,
      title: '佳能 RF 24-70mm F2.8 镜头',
      price: 80,
      unit: 'day',
      image: '/api/placeholder/300/200',
      status: 'rented',
      rentalCount: 23,
      rating: 4.8,
      earnings: 1840
    },
    {
      id: 3,
      title: '大疆 Mavic 3 无人机',
      price: 200,
      unit: 'day',
      image: '/api/placeholder/300/200',
      status: 'available',
      rentalCount: 12,
      rating: 5.0,
      earnings: 2400
    }
  ];

  // 模拟收藏数据
  const favorites = [
    {
      id: 1,
      title: '苹果 MacBook Pro 16寸',
      price: 100,
      unit: 'day',
      image: '/api/placeholder/300/200',
      owner: '科技达人',
      rating: 4.8,
      distance: '2.5km'
    },
    {
      id: 2,
      title: '索尼 A7S III 相机',
      price: 200,
      unit: 'day',
      image: '/api/placeholder/300/200',
      owner: '视频工作室',
      rating: 4.9,
      distance: '5.2km'
    }
  ];

  // 模拟订单数据
  const orders = [
    {
      id: 'ORD001',
      item: '索尼 A7M4 相机',
      renter: '小李',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      total: 450,
      status: 'completed',
      type: 'lending'
    },
    {
      id: 'ORD002',
      item: '佳能 EOS R6',
      owner: '摄影师老王',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      total: 240,
      status: 'active',
      type: 'renting'
    }
  ];

  // 渲染概览内容
  const renderOverview = () => (
    <div className="space-y-6"
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: '信用分数', value: userData.creditScore, icon: Award, color: 'text-green-500' },
          { label: '总收益', value: `¥${userData.totalEarnings}`, icon: TrendingUp, color: 'text-blue-500' },
          { label: '出租次数', value: userData.totalLendings, icon: Camera, color: 'text-purple-500' },
          { label: '租赁次数', value: userData.totalRentals, icon: Clock, color: 'text-orange-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-neutral-600">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-800">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* 徽章展示 */}
      <div className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">获得徽章</h3>
        <div className="flex flex-wrap gap-3"
        >
          {userData.badges.map((badge, index) => (
            <div key={index} className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-2 rounded-full"
            >
              <Award className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">最近活动</h3>
        <div className="space-y-4"
        >
          {[
            { action: '出租成功', item: '索尼 A7M4 相机', time: '2小时前', icon: Camera },
            { action: '收到评价', item: '五星好评', time: '1天前', icon: Star },
            { action: '设备上架', item: '大疆无人机', time: '3天前', icon: Camera }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center"
              >
                <activity.icon className="w-5 h-5 text-neutral-600" />
              </div>
              <div className="flex-1"
              >
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">{activity.action}</span> {activity.item}
                </p>
                <p className="text-xs text-neutral-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8"
        >
          {/* 左侧个人资料 */}
          <div className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-32"
            >
              <div className="text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-4"
                >
                  <img
                    src={userData.avatar}
                    alt={userData.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {userData.verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-neutral-800">{userData.username}</h2>
                <p className="text-neutral-600 text-sm">{userData.bio}</p>
                <div className="mt-4 space-y-2 text-sm"
                >
                  <div className="flex items-center text-neutral-600"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {userData.location}
                  </div>
                  <div className="flex items-center text-neutral-600"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    信用分: {userData.creditScore}
                  </div>
                  <div className="flex items-center text-neutral-600"
                  >
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    {userData.rating} ({userData.reviewCount}条评价)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="lg:col-span-3"
          >
            {/* 标签导航 */}
            <div className="bg-white rounded-xl shadow-sm mb-6"
            >
              <div className="flex overflow-x-auto"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600 bg-primary-50"
                        : "border-transparent text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 内容区域 */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {myItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm p-4"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h3 className="font-semibold text-neutral-800 mb-2">{item.title}</h3>
                      <div className="flex items-center justify-between text-sm"
                      >
                        <span className="text-primary-600 font-bold">¥{item.price}/天</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          item.status === 'available' 
                            ? "bg-green-100 text-green-700" 
                            : "bg-orange-100 text-orange-700"
                        )}
                        >
                          {item.status === 'available' ? '可租赁' : '已租出'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-neutral-600"
                      >
                        出租{item.rentalCount}次 · 收益¥{item.earnings}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'favorites' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {favorites.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm p-4"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-neutral-800 mb-2">{item.title}</h3>
                      <div className="flex items-center justify-between text-sm"
                      >
                        <span className="text-primary-600 font-bold">¥{item.price}/天</span>
                        <span className="text-neutral-500">{item.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="divide-y"
                  >
                    {orders.map((order) => (
                      <div key={order.id} className="p-4"
                      >
                        <div className="flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-medium text-neutral-800">{order.item}</h4>
                            <p className="text-sm text-neutral-600">{order.type === 'lending' ? `租给 ${order.renter}` : `从 ${order.owner} 租用`}</p>
                            <p className="text-sm text-neutral-500">{order.startDate} - {order.endDate}</p>
                          </div>
                          <div className="text-right"
                          >
                            <p className="font-semibold text-neutral-800">¥{order.total}</p>
                            <span className={cn(
                              "text-sm px-2 py-1 rounded-full",
                              order.status === 'completed' 
                                ? "bg-green-100 text-green-700" 
                                : "bg-blue-100 text-blue-700"
                            )}
                            >
                              {order.status === 'completed' ? '已完成' : '进行中'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;