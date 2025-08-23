import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Shield, 
  Heart,
  TrendingUp,
  Gift,
  Clock,
  Award,
  ArrowRight,
  Zap
} from 'lucide-react';
import ResourceCard from '../components/ResourceCard';
import { cn } from '../utils/cn';
import { Resource } from '../types';

/**
 * 首页着陆页面组件
 * 展示平台特色、热门资源、统计数据和用户评价
 */
const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 页面加载动画
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 热门分类数据
  const categories = [
    { 
      name: '电子设备', 
      icon: '📱', 
      count: 1250,
      color: 'from-blue-500 to-blue-600',
      description: '手机、电脑、相机等'
    },
    { 
      name: '家具家居', 
      icon: '🏠', 
      count: 890,
      color: 'from-green-500 to-green-600',
      description: '桌椅、沙发、床品等'
    },
    { 
      name: '工具设备', 
      icon: '🔧', 
      count: 567,
      color: 'from-orange-500 to-orange-600',
      description: '电动工具、维修设备等'
    },
    { 
      name: '交通工具', 
      icon: '🚗', 
      count: 234,
      color: 'from-purple-500 to-purple-600',
      description: '自行车、电动车等'
    },
    { 
      name: '服装配饰', 
      icon: '👗', 
      count: 1890,
      color: 'from-pink-500 to-pink-600',
      description: '礼服、首饰、包包等'
    },
    { 
      name: '运动户外', 
      icon: '⚽', 
      count: 445,
      color: 'from-red-500 to-red-600',
      description: '运动器材、露营装备等'
    }
  ];

  // 热门资源数据
const featuredResources: Resource[] = [
  {
    id: '1',
    title: 'DJI Mini 3 Pro 无人机',
    description: '轻巧便携，4K HDR 视频，智能飞行功能。',
    images: ['/api/placeholder/400/300?text=DJI+Mini+3'],
    price: 50,
    priceUnit: 'day',
    category: 'electronics',
    owner: { id: 'user1', username: '航拍爱好者', avatar: '', verified: true, email: 'user1@test.com', phone: '123', creditScore: 100, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    ownerId: 'user1',
    location: { address: '上海市', latitude: 31.23, longitude: 121.47 },
    rating: 4.9,
    reviewCount: 120,
    tags: ['无人机', '4K'],
    status: 'available',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: '2',
    title: '任天堂 Switch OLED',
    description: 'OLED 屏幕，色彩更鲜艳，附带两款热门游戏。',
    images: ['/api/placeholder/400/300?text=Switch+OLED'],
    price: 25,
    priceUnit: 'day',
    category: 'electronics',
    owner: { id: 'user2', username: '游戏玩家', avatar: '', verified: true, email: 'user2@test.com', phone: '123', creditScore: 100, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    ownerId: 'user2',
    location: { address: '北京市', latitude: 39.90, longitude: 116.40 },
    rating: 5.0,
    reviewCount: 250,
    tags: ['游戏机', '家庭娱乐'],
    status: 'available',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: '3',
    title: 'Snow Peak 雪峰帐篷',
    description: '专业级户外帐篷，适合2-3人，防风防雨。',
    images: ['/api/placeholder/400/300?text=Snow+Peak+Tent'],
    price: 80,
    priceUnit: 'day',
    category: 'sports',
    owner: { id: 'user3', username: '露营达人', avatar: '', verified: false, email: 'user3@test.com', phone: '123', creditScore: 100, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    ownerId: 'user3',
    location: { address: '杭州市', latitude: 30.27, longitude: 120.15 },
    rating: 4.8,
    reviewCount: 85,
    tags: ['户外', '露营'],
    status: 'available',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: '4',
    title: '专业会议投影仪',
    description: '1080P 高清，5000流明，适用于各种商务场合。',
    images: ['/api/placeholder/400/300?text=Projector'],
    price: 150,
    priceUnit: 'day',
    category: 'electronics',
    owner: { id: 'user4', username: '商务人士', avatar: '', verified: true, email: 'user4@test.com', phone: '123', creditScore: 100, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    ownerId: 'user4',
    location: { address: '深圳市', latitude: 22.54, longitude: 114.05 },
    rating: 4.9,
    reviewCount: 98,
    tags: ['商务', '高清'],
    status: 'available',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
];  // 平台统计数据
  const stats = [
    { number: '50万+', label: '注册用户', icon: Users, color: 'text-primary-500' },
    { number: '100万+', label: '闲置物品', icon: Gift, color: 'text-secondary-500' },
    { number: '98%', label: '用户满意度', icon: Star, color: 'text-yellow-500' },
    { number: '24/7', label: '客服支持', icon: Clock, color: 'text-green-500' }
  ];

  // 用户评价数据
  const testimonials = [
    {
      name: '陈小明',
      avatar: '/api/placeholder/64/64',
      rating: 5,
      comment: '第一次使用闲置租赁平台，体验非常好！租到了心仪的相机，价格也很实惠。',
      role: '摄影爱好者',
      location: '北京'
    },
    {
      name: '李美丽',
      avatar: '/api/placeholder/64/64',
      rating: 5,
      comment: '把我的闲置吸尘器租出去，不仅赚了钱还认识了新朋友，一举两得！',
      role: '全职妈妈',
      location: '上海'
    },
    {
      name: '王大锤',
      avatar: '/api/placeholder/64/64',
      rating: 5,
      comment: '平台的安全保障做得很好，实名认证和押金机制让人很放心。',
      role: '工程师',
      location: '深圳'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="bg-brand-light">
      {/* 英雄区域 */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative text-center py-20 sm:py-32 px-4 bg-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white to-brand-light z-0"></div>
        <div className="relative z-10">
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold text-brand-dark tracking-tight"
          >
            让<span className="text-brand-primary">闲置</span>流动，让<span className="text-brand-secondary">价值</span>重现
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl mx-auto text-lg text-gray-600"
          >
            一个安全、便捷、有趣的闲置资源租赁平台。无论是数码产品、户外装备还是派对用品，你都可以在这里找到。
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12"
          >
            <div className="rounded-full shadow-lg">
              <Link
                to="/resources"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-brand-primary hover:bg-brand-secondary md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
              >
                开始探索 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 平台统计区域 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${stat.color} rounded-full mx-auto mb-4 flex items-center justify-center bg-opacity-10`}
                >
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-neutral-800 mb-2">{stat.number}</div>
                <div className="text-neutral-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 热门分类区域 */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-800 mb-4">
              探索热门分类
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              从电子设备到家居用品，从户外装备到时尚配饰，总有一款适合您的需求
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = `/resources?category=${encodeURIComponent(category.name)}`}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl mb-4 flex items-center justify-center text-2xl`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">{category.name}</h3>
                <p className="text-neutral-600 mb-2">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">{category.count} 个物品</span>
                  <ArrowRight className="w-5 h-5 text-primary-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 热门推荐区域 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-800 mb-4">
              热门推荐物品
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              精选优质闲置物品，品质保证，价格实惠
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
            className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8"
          >
            {featuredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </motion.div>
          <div className="mt-12 text-center">
            <Link
              to="/resources"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-brand-primary bg-brand-light hover:bg-gray-200 transition-all duration-300"
            >
              查看更多 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 用户评价区域 */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-800 mb-4">
              用户评价
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              听听我们用户的故事，看看他们如何通过平台实现双赢
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4"
                >
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-neutral-800">{testimonial.name}</h4>
                    <div className="text-sm text-neutral-500">{testimonial.role} • {testimonial.location}</div>
                  </div>
                </div>
                <div className="flex items-center mb-3"
                >
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed">"{testimonial.comment}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 行动号召区域 */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white"
            >
              开始您的闲置租赁之旅
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto"
            >
              无论是出租还是租用，都能在这里找到满意的解决方案。
              立即加入我们的社区，开启共享经济的美好生活！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/resources"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-full hover:bg-neutral-100 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                浏览物品
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/auth?tab=register"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full hover:bg-white hover:text-primary-600 transition-all duration-300 font-semibold"
              >
                立即注册
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;