import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Menu, X, MessageSquare, Heart } from 'lucide-react';
import { cn } from '../utils/cn';
import { useChat } from '../hooks/useChat';
import NotificationDropdown from './NotificationDropdown';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { unreadCount } = useChat();

  const navLinks = [
    { path: '/', label: '首页' },
    { path: '/resources', label: '浏览资源' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -15 }}
              className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-md"
            >
              <span className="text-white font-bold text-lg">租</span>
            </motion.div>
            <span className="text-2xl font-bold text-brand-dark hidden sm:block">
              闲置圈
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative',
                  isActive(link.path)
                    ? 'text-white'
                    : 'text-brand-dark hover:bg-brand-light'
                )}
              >
                {isActive(link.path) && (
                  <motion.div
                    layoutId="active-nav-link"
                    className="absolute inset-0 bg-brand-primary rounded-full"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-full hover:bg-brand-light">
              <Search className="h-5 w-5 text-brand-dark" />
            </motion.button>
            
            {/* 通知下拉菜单 */}
            <NotificationDropdown />
            
            <Link to="/chat" className="relative">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-full hover:bg-brand-light">
                <MessageSquare className="h-5 w-5 text-brand-dark" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-secondary ring-2 ring-white" />
                )}
              </motion.div>
            </Link>
            <Link to="/profile">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-full hover:bg-brand-light">
                <User className="h-5 w-5 text-brand-dark" />
              </motion.div>
            </Link>
            <Link to="/auth">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                登录/注册
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-brand-dark"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white pb-4"
          >
            <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium',
                    isActive(link.path) ? 'text-white bg-brand-primary' : 'text-brand-dark hover:bg-brand-light'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <User className="h-10 w-10 rounded-full text-brand-dark" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-brand-dark">用户名</div>
                  <div className="text-sm font-medium text-gray-500">查看个人资料</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-brand-light">
                  <Search className="mr-3 h-5 w-5"/>
                  通知
                </Link>
                 <Link to="/chat" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-brand-light">
                  <MessageSquare className="mr-3 h-5 w-5"/>
                  聊天
                </Link>
                <Link to="/favorites" onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-brand-light">
                  <Heart className="mr-3 h-5 w-5"/>
                  收藏
                </Link>
                <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-brand-dark hover:bg-brand-light">
                  登录/注册
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;