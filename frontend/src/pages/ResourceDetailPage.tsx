import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  User, 
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Resource } from '../types';

// 模拟数据
const mockResource: Resource = {
  id: '1',
  title: '索尼 A7M4 全画幅相机',
  description: '专业级全画幅微单相机，适合摄影爱好者和内容创作者。这台相机是2023年购买的，使用时间很少，几乎全新。\n\n📸 设备配置：\n• 索尼A7M4机身\n• 24-70mm F2.8 GM镜头\n• 128GB高速存储卡\n• 3块原装电池\n• 充电器和数据线\n• 专业摄影包\n\n✨ 特色功能：\n• 3300万像素全画幅传感器\n• 4K 60fps视频拍摄\n• 实时眼部对焦\n• 5轴防抖系统\n• 双卡槽设计\n\n🎯 适用场景：\n• 人像摄影\n• 风景摄影\n• 产品拍摄\n• 视频创作\n• 婚礼跟拍',
  category: 'electronics',
  price: 150,
  priceUnit: 'day',
  images: [
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600'
  ],
  location: {
    address: '北京市朝阳区三里屯街道工体北路8号院',
    latitude: 39.9388,
    longitude: 116.4608
  },
  ownerId: 'user1',
  owner: {
    id: 'user1',
    username: '摄影师小王',
    email: 'photographer@example.com',
    phone: '13800138000',
    avatar: '/api/placeholder/100/100',
    creditScore: 95,
    verified: true,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01'
  },
  status: 'available',
  rating: 4.9,
  reviewCount: 156,
  tags: ['专业级', '全画幅', '包邮', '全套配件', '九成新'],
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15'
};

/**
 * 资源详情页面组件
 * 展示完整的物品信息、图片、用户评价和预订功能
 */
const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDates, setSelectedDates] = useState({
    startDate: '',
    endDate: ''
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // 计算租赁天数和价格
  const calculatePrice = () => {
    if (!selectedDates.startDate || !selectedDates.endDate) return 0;
    const start = new Date(selectedDates.startDate);
    const end = new Date(selectedDates.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days * mockResource.price;
  };

  // 用户评价数据
  const reviews = [
    {
      id: 1,
      userName: '摄影爱好者小张',
      avatar: '/api/placeholder/50/50',
      rating: 5,
      date: '2024-01-10',
      comment: '设备非常新，小王很专业，给了很多使用建议。拍出来的照片质量很棒！',
      images: ['/api/placeholder/200/150']
    },
    {
      id: 2,
      userName: '内容创作者小李',
      avatar: '/api/placeholder/50/50',
      rating: 5,
      date: '2024-01-08',
      comment: '相机状态完美，配件齐全，非常适合拍摄产品视频。下次还会租！',
      images: []
    },
    {
      id: 3,
      userName: '旅行博主小王',
      avatar: '/api/placeholder/50/50',
      rating: 4,
      date: '2024-01-05',
      comment: '设备很好，就是配送时间稍微晚了一点。整体体验不错。',
      images: ['/api/placeholder/200/150']
    }
  ];

  // 相关推荐
  const relatedItems = [
    {
      id: '2',
      title: '佳能 EOS R6 Mark II',
      price: 120,
      unit: 'day',
      image: '/api/placeholder/300/200',
      rating: 4.8,
      reviewCount: 89
    },
    {
      id: '3',
      title: '尼康 Z6 II',
      price: 100,
      unit: 'day',
      image: '/api/placeholder/300/200',
      rating: 4.7,
      reviewCount: 67
    },
    {
      id: '4',
      title: '富士 X-T5',
      price: 80,
      unit: 'day',
      image: '/api/placeholder/300/200',
      rating: 4.6,
      reviewCount: 45
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50"
    >
      {/* 头部导航 */}
      <div className="bg-white shadow-sm sticky top-16 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
        >
          <div className="flex items-center justify-between"
          >
            <Link
              to="/resources"
              className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              返回列表
            </Link>
            <div className="flex items-center gap-2"
            >
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isFavorite ? "text-red-500 fill-current" : "text-neutral-400"
                  )} 
                />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <Share2 className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* 左侧：图片和信息 */}
          <div className="lg:col-span-2 space-y-6"
          >
            {/* 图片轮播 */}
            <div className="bg-white rounded-2xl shadow-lg p-4"
            >
              <div className="relative"
              >
                <img
                  src={mockResource.images[selectedImage]}
                  alt={mockResource.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
                
                {/* 图片导航 */}
                {mockResource.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev - 1 + mockResource.images.length) % mockResource.images.length)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev + 1) % mockResource.images.length)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              
              {/* 缩略图 */}
              <div className="flex gap-2 mt-4 overflow-x-auto"
              >
                {mockResource.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all",
                      selectedImage === index 
                        ? "ring-2 ring-primary-500 ring-offset-2" 
                        : "hover:opacity-75"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${mockResource.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 物品描述 */}
            <div className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-neutral-800 mb-4"
              >物品描述</h2>
              <div className="prose prose-neutral max-w-none"
              >
                <p className="whitespace-pre-line text-neutral-600"
                >{mockResource.description}</p>
              </div>

              <div className="mt-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-neutral-800"
                >物品特色</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {[
                    { icon: CheckCircle, text: '3300万像素全画幅传感器' },
                    { icon: CheckCircle, text: '4K 60fps视频拍摄' },
                    { icon: CheckCircle, text: '实时眼部对焦系统' },
                    { icon: CheckCircle, text: '5轴防抖技术' },
                    { icon: CheckCircle, text: '双卡槽设计' },
                    { icon: CheckCircle, text: '专业级画质表现' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2"
                    >
                      <feature.icon className="w-5 h-5 text-green-500" />
                      <span className="text-neutral-600">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 用户评价 */}
            <div className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4"
              >
                <h2 className="text-2xl font-bold text-neutral-800">用户评价</h2>
                <div className="flex items-center space-x-2"
                >
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="text-xl font-semibold">{mockResource.rating}</span>
                  <span className="text-neutral-500">({mockResource.reviewCount}条评价)</span>
                </div>
              </div>

              <div className="space-y-6"
              >
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-0"
                  >
                    <div className="flex items-start space-x-4"
                    >
                      <img
                        src={review.avatar}
                        alt={review.userName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1"
                      >
                        <div className="flex items-center justify-between mb-2"
                        >
                          <div>
                            <h4 className="font-semibold text-neutral-800">{review.userName}</h4>
                            <div className="flex items-center space-x-2 text-sm text-neutral-500"
                            >
                              <div className="flex"
                              >
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-4 h-4",
                                      i < review.rating 
                                        ? "text-yellow-500 fill-current" 
                                        : "text-neutral-300"
                                    )}
                                  />
                                ))}
                              </div>
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-neutral-600 mb-3">{review.comment}</p>
                        {review.images.length > 0 && (
                          <div className="flex gap-2"
                          >
                            {review.images.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt={`评价图片 ${index + 1}`}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 相关推荐 */}
            <div className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-neutral-800 mb-4">相关推荐</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {relatedItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/resources/${item.id}`}
                    className="border border-neutral-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <h4 className="font-semibold text-neutral-800 mb-1">{item.title}</h4>
                    <div className="flex items-center justify-between"
                    >
                      <span className="text-primary-600 font-bold">¥{item.price}/天</span>
                      <div className="flex items-center text-sm text-neutral-500"
                      >
                        <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                        {item.rating} ({item.reviewCount})
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：预订面板 */}
          <div className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32"
            >
              <div className="text-center mb-6"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2"
                >¥{mockResource.price}</div>
                <span className="text-lg text-neutral-500">/天</span>
              </div>
              <div className="text-sm text-neutral-500">押金: ¥{mockResource.price * 3}</div>
            </div>

            <div className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2"
                >租赁日期</label>
                <div className="grid grid-cols-2 gap-2"
                >
                  <input
                    type="date"
                    value={selectedDates.startDate}
                    onChange={(e) => setSelectedDates(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="date"
                    value={selectedDates.endDate}
                    onChange={(e) => setSelectedDates(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min={selectedDates.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {selectedDates.startDate && selectedDates.endDate && (
                <div className="bg-neutral-50 rounded-lg p-4"
                >
                  <div className="flex justify-between text-sm"
                  >
                    <span className="text-neutral-600">租赁天数:</span>
                    <span className="font-medium">{Math.ceil((new Date(selectedDates.endDate).getTime() - new Date(selectedDates.startDate).getTime()) / (1000 * 60 * 60 * 24))}天</span>
                  </div>
                  <div className="flex justify-between text-sm"
                  >
                    <span className="text-neutral-600">总租金:</span>
                    <span className="font-bold text-primary-600">¥{calculatePrice()}</span>
                  </div>
                  <div className="flex justify-between text-sm"
                  >
                    <span className="text-neutral-600">押金:</span>
                    <span className="font-medium">¥{mockResource.price * 3}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3"
              >
                <button
                  disabled={!selectedDates.startDate || !selectedDates.endDate}
                  className={cn(
                    "w-full py-3 rounded-lg font-medium transition-colors",
                    selectedDates.startDate && selectedDates.endDate
                      ? "bg-primary-500 text-white hover:bg-primary-600"
                      : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  )}
                >
                  <Calendar className="w-5 h-5 inline mr-2" />
                  立即预订
                </button>
                <button className="w-full py-3 border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 inline mr-2" />
                  联系房东
                </button>
              </div>

              <div className="border-t pt-4"
              >
                <h4 className="font-medium text-neutral-800 mb-3">房东信息</h4>
                <div className="flex items-center space-x-3"
                >
                  <img
                    src={mockResource.owner.avatar}
                    alt={mockResource.owner.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1"
                  >
                    <div className="flex items-center space-x-2"
                    >
                      <h5 className="font-semibold text-neutral-800">{mockResource.owner.username}</h5>
                      {mockResource.owner.verified && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="text-sm text-neutral-500"
                    >信用分: {mockResource.owner.creditScore}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4"
              >
                <h4 className="font-medium text-neutral-800 mb-3">服务保障</h4>
                <div className="space-y-2 text-sm"
                >
                  {[
                    { icon: Shield, text: '实名认证房东' },
                    { icon: Clock, text: '24小时客服支持' },
                    { icon: CheckCircle, text: '押金安全保障' },
                    { icon: MessageCircle, text: '在线沟通工具' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2"
                    >
                      <item.icon className="w-4 h-4 text-green-500" />
                      <span className="text-neutral-600">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;