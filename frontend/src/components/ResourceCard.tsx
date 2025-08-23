import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, Shield } from 'lucide-react';
import { Resource } from '../types';
import { cn } from '../utils/cn';

interface ResourceCardProps {
  resource: Resource;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  viewMode?: 'grid' | 'list';
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onFavorite,
  isFavorite = false,
  viewMode = 'grid'
}) => {
  const formatPrice = (price: number, unit: string) => {
    const unitMap: { [key: string]: string } = { hour: '时', day: '天', week: '周', month: '月' };
    return `¥${price}/${unitMap[unit] || unit}`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    hover: { y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: { duration: 0.3 } }
  };

  if (viewMode === 'list') {
    // 列表视图模式（待美化）
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row"
        >
          {/* 图片区域 */}
          <div className="relative w-full sm:w-80 h-48 sm:h-auto"
          >
            <img
              src={resource.images[0] || '/api/placeholder/300/200'}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex gap-2"
            >
              {resource.owner.verified && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center"
                >
                  <Shield className="w-3 h-3 mr-1" /> 已验证
                </span>
              )}
            </div>
            
            {/* 收藏按钮 */}
            <button
              onClick={() => onFavorite?.(resource.id)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-colors",
                  isFavorite ? "text-red-500 fill-current" : "text-neutral-400"
                )} 
              />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 p-6"
          >
            <div className="flex justify-between items-start mb-3"
            >
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-1"
                >{resource.title}</h3>
                <p className="text-neutral-600 text-sm line-clamp-2"
                >{resource.description}</p>
              </div>
              <div className="text-right ml-4"
              >
                <div className="text-2xl font-bold text-primary-600"
                >{formatPrice(resource.price, resource.priceUnit)}</div>
                <div className="text-xs text-neutral-500"
                >押金: ¥{resource.price * 2}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-neutral-600 mb-4"
            >
              <div className="flex items-center"
              >
                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                <span className="font-medium">{resource.rating}</span>
                <span className="text-neutral-400 ml-1">({resource.reviewCount})</span>
              </div>
              <div className="flex items-center"
              >
                <MapPin className="w-4 h-4 mr-1" />
                <span>{resource.location.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between"
            >
              <div className="flex gap-2"
              >
                {resource.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag} 
                    className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to={`/resources/${resource.id}`}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                查看详情
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 网格视图模式（默认）
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* 图片区域 */}
      <div className="relative aspect-[4/3] overflow-hidden"
      >
        <img
          src={resource.images[0] || '/api/placeholder/300/200'}
          alt={resource.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* 标签区域 */}
        <div className="absolute top-3 left-3 flex gap-2"
        >
          {resource.owner.verified && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg"
            >
              <Shield className="w-3 h-3 mr-1" /> 已验证
            </span>
          )}
        </div>

        {/* 收藏按钮 */}
        <button
          onClick={() => onFavorite?.(resource.id)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
        >
          <Heart 
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite ? "text-red-500 fill-current" : "text-neutral-400 hover:text-red-500"
            )} 
          />
        </button>

        {/* 快速查看按钮 */}
        <Link
          to={`/resources/${resource.id}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="bg-white/90 backdrop-blur-sm text-primary-600 px-4 py-2 rounded-full font-medium hover:bg-white transition-colors"
          >
            快速查看
          </div>
        </Link>
      </div>

      {/* 内容区域 */}
      <div className="p-4"
      >
        <div className="flex justify-between items-start mb-2"
        >
          <h3 className="font-semibold text-neutral-800 line-clamp-1 flex-1"
          >{resource.title}</h3>
        </div>
        <p className="text-neutral-600 text-sm line-clamp-2 mb-3"
        >{resource.description}</p>

        <div className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center space-x-1"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium"
            >{resource.rating}</span>
            <span className="text-xs text-neutral-500"
            >({resource.reviewCount})</span>
          </div>
          <div className="text-xs text-neutral-500"
          >{resource.location.address.split('市')[0]}市</div>
        </div>

        <div className="flex items-center justify-between"
        >
          <div className="text-xl font-bold text-primary-600"
          >
            {formatPrice(resource.price, resource.priceUnit)}
          </div>
          <Link
            to={`/resources/${resource.id}`}
            className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-600 transition-colors duration-200"
          >
            查看
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceCard;