import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

/**
 * 网站底部组件
 * 提供公司信息、快速链接、联系方式和社交媒体链接
 */
const Footer: React.FC = () => {
  // 快速链接配置
  const quickLinks = [
    { path: '/about', label: '关于我们' },
    { path: '/how-it-works', label: '如何使用' },
    { path: '/safety', label: '安全保障' },
    { path: '/help', label: '帮助中心' },
    { path: '/terms', label: '服务条款' },
    { path: '/privacy', label: '隐私政策' },
  ];

  // 分类链接配置
  const categories = [
    { path: '/category/electronics', label: '电子设备' },
    { path: '/category/furniture', label: '家具家居' },
    { path: '/category/tools', label: '工具设备' },
    { path: '/category/vehicles', label: '交通工具' },
    { path: '/category/clothing', label: '服装配饰' },
    { path: '/category/others', label: '其他物品' },
  ];

  // 社交媒体配置
  const socialLinks = [
    { icon: Facebook, url: '#', label: 'Facebook' },
    { icon: Twitter, url: '#', label: 'Twitter' },
    { icon: Instagram, url: '#', label: 'Instagram' },
    { icon: Linkedin, url: '#', label: 'LinkedIn' },
  ];

  // 联系方式配置
  const contactInfo = [
    { icon: Mail, label: 'contact@xianzhi.com', href: 'mailto:contact@xianzhi.com' },
    { icon: Phone, label: '400-888-9999', href: 'tel:400-888-9999' },
    { icon: MapPin, label: '北京市朝阳区建国路88号', href: '#' },
  ];

  return (
    <footer className="bg-neutral-900 text-white">
      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">租</span>
              </div>
              <span className="text-xl font-bold text-white">闲置租赁</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              让闲置资源流动起来，创造更美好的共享生活。我们致力于打造一个安全、便捷、可信赖的闲置物品租赁平台。
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-neutral-300">
                <Heart className="w-4 h-4 text-primary-500" />
                <span>超过10万用户信赖</span>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    className="text-neutral-300 hover:text-primary-500 transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* 热门分类 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">热门分类</h3>
            <ul className="space-y-2">
              {categories.map((category, index) => (
                <motion.li
                  key={category.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={category.path}
                    className="text-neutral-300 hover:text-primary-500 transition-colors duration-200 text-sm"
                  >
                    {category.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">联系我们</h3>
            <div className="space-y-3">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <info.icon className="w-4 h-4 text-primary-500" />
                  <a
                    href={info.href}
                    className="text-neutral-300 hover:text-primary-500 transition-colors duration-200 text-sm"
                  >
                    {info.label}
                  </a>
                </motion.div>
              ))}
            </div>

            {/* 社交媒体 */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">关注我们</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.url}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors duration-200"
                  >
                    <social.icon className="w-4 h-4 text-neutral-300 hover:text-white" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 特色功能区域 */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: '安全保障',
                description: '实名认证 + 押金保障，让租赁更安心',
              },
              {
                icon: MessageCircle,
                title: '实时沟通',
                description: '内置聊天系统，沟通更便捷',
              },
              {
                icon: Heart,
                title: '社区信任',
                description: '用户评价系统，建立信任关系',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-neutral-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部版权信息 */}
      <div className="bg-neutral-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-neutral-400 mb-2 md:mb-0">
              © 2024 闲置租赁平台. 保留所有权利.
            </p>
            <div className="flex space-x-6">
              <Link to="/terms" className="text-sm text-neutral-400 hover:text-primary-500 transition-colors">
                服务条款
              </Link>
              <Link to="/privacy" className="text-sm text-neutral-400 hover:text-primary-500 transition-colors">
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;