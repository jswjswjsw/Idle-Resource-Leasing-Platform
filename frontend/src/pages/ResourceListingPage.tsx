import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  Clock, 
  Star, 
  Heart, 
  SlidersHorizontal,
  X,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Resource, ResourceCategory, SearchFilters } from '../types';
import ResourceCard from '../components/ResourceCard';
import { cn } from '../utils/cn';
import { useResources } from '../hooks/useResources';

/**
 * 资源列表页面组件
 * 提供搜索、筛选、排序和视图切换功能
 */
const ResourceListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const { useResourceList, useResourceSearch } = useResources();
  
  // 从URL参数构建筛选条件
  const buildFilters = (): SearchFilters => {
    const category = searchParams.get('category') as ResourceCategory | undefined;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location') || undefined;
    const sortBy = searchParams.get('sortBy') as SearchFilters['sortBy'] || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as SearchFilters['sortOrder'] || 'desc';
    const keyword = searchParams.get('search') || undefined;

    return {
      keyword,
      category,
      priceRange: minPrice && maxPrice ? {
        min: Number(minPrice),
        max: Number(maxPrice)
      } : undefined,
      location,
      sortBy,
      sortOrder,
    };
  };

  const filters = buildFilters();
  
  // 添加 filters 状态
  const [currentFilters, setFilters] = useState<SearchFilters>(filters);

  // 使用API获取数据
  const {
    data: resourceData,
    isLoading,
    error,
  } = filters.keyword
    ? useResourceSearch(filters.keyword, filters)
    : useResourceList(filters);


  // 分类选项
  const categories = [
    '全部', '电子设备', '家居用品', '运动户外', '服装配饰', 
    '交通工具', '图书音像', '母婴用品', '美妆护肤', '其他物品'
  ];

  // 排序选项
  const sortOptions = [
    { value: 'createdAt-desc', label: '最新发布' },
    { value: 'createdAt-asc', label: '最早发布' },
    { value: 'price-asc', label: '价格从低到高' },
    { value: 'price-desc', label: '价格从高到低' },
    { value: 'rating-desc', label: '评分最高' },
    { value: 'distance-asc', label: '距离最近' }
  ];

  // 价格范围选项
  const priceRanges = [
    { label: '不限', min: 0, max: 1000 },
    { label: '¥0-50', min: 0, max: 50 },
    { label: '¥50-100', min: 50, max: 100 },
    { label: '¥100-200', min: 100, max: 200 },
    { label: '¥200-500', min: 200, max: 500 },
    { label: '¥500+', min: 500, max: 1000 }
  ];


  // 更新URL参数
  const updateSearchParams = (newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.priceRange) {
      if (newFilters.priceRange.min > 0) params.set('minPrice', newFilters.priceRange.min.toString());
      if (newFilters.priceRange.max < 1000) params.set('maxPrice', newFilters.priceRange.max.toString());
    }
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder);
    setSearchParams(params);
  };

  // 处理筛选变化
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters: SearchFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  // 处理收藏
  const handleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  // 重置筛选
  const resetFilters = () => {
    const defaultFilters: SearchFilters = {
      category: undefined,
      priceRange: undefined,
      location: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      rating: 0,
      verified: false
    };
    setFilters(defaultFilters);
    updateSearchParams(defaultFilters);
  };

  // 使用API返回的数据
  const resources = Array.isArray(resourceData) ? resourceData : [];
  const sortedResources = resources;
  const pagination = { total: resources.length, page: 1, limit: 20 };

  // 骨架屏组件
  const SkeletonCard = ({ viewMode: mode }: { viewMode: 'grid' | 'list' }) => (
    <div className={cn(
      "bg-white rounded-2xl shadow-md overflow-hidden animate-pulse",
      mode === 'grid' ? "" : "flex"
    )}
    >
      <div className={cn(
        "bg-neutral-200",
        mode === 'grid' ? "aspect-[4/3]" : "w-80 h-48"
      )}
    />
      <div className={cn("p-4", mode === 'list' && "flex-1")}
    >
        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded mb-2 w-3/4"></div>
        <div className="flex items-center gap-2 mb-2"
        >
          <div className="h-3 bg-neutral-200 rounded w-12"></div>
          <div className="h-3 bg-neutral-200 rounded w-8"></div>
        </div>
        <div className="flex justify-between items-center"
        >
          <div className="h-4 bg-neutral-200 rounded w-16"></div>
          <div className="h-8 bg-neutral-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50"
    >
      {/* 页面头部 */}
      <div className="bg-white shadow-sm sticky top-16 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center"
          >
            {/* 搜索框 */}
            <div className="flex-1 w-full lg:w-auto"
            >
              <div className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5"
                />
                <input
                  type="text"
                  placeholder="搜索物品名称或描述..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      params.set('search', e.target.value);
                    } else {
                      params.delete('search');
                    }
                    setSearchParams(params);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* 排序和视图控制 */}
            <div className="flex items-center gap-2"
            >
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}
                  >{option.label}</option>
                ))}
              </select>

              <div className="flex border border-neutral-200 rounded-lg"
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid' 
                      ? 'bg-primary-500 text-white' 
                      : 'text-neutral-600 hover:text-primary-500'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list' 
                      ? 'bg-primary-500 text-white' 
                      : 'text-neutral-600 hover:text-primary-500'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-primary-500 transition-colors"
              >
                <Filter className="w-4 h-4" />
                筛选
                {(filters.category || (filters.rating && filters.rating > 0) || filters.verified) && (
                  <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {[filters.category, filters.rating && filters.rating > 0, filters.verified].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <div className="flex gap-6"
        >
          {/* 侧边栏筛选 */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                className="w-64 bg-white rounded-lg shadow-lg p-6 h-fit sticky top-32"
              >
                <div className="flex items-center justify-between mb-4"
                >
                  <h3 className="font-semibold text-lg">筛选条件</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 分类筛选 */}
                <div className="mb-6"
                >
                  <h4 className="font-medium mb-3">物品分类</h4>
                  <div className="space-y-2"
                  >
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleFilterChange('category', category === '全部' ? '' : category)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          filters.category === category || (category === '全部' && !filters.category)
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-neutral-100'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 价格范围 */}
                <div className="mb-6"
                >
                  <h4 className="font-medium mb-3">价格范围</h4>
                  <div className="space-y-2"
                  >
                    {priceRanges.map(range => (
                      <button
                        key={range.label}
                        onClick={() => handleFilterChange('priceRange', { min: range.min, max: range.max })}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          filters.priceRange && filters.priceRange.min === range.min && filters.priceRange.max === range.max
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-neutral-100'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 评分筛选 */}
                <div className="mb-6"
                >
                  <h4 className="font-medium mb-3">最低评分</h4>
                  <div className="flex gap-1"
                  >
                    {[0, 3, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => handleFilterChange('rating', rating)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-colors",
                          filters.rating === rating
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-neutral-100'
                        )}
                      >
                        {rating === 0 ? '不限' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 其他筛选 */}
                <div className="mb-6"
                >
                  <label className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) => handleFilterChange('verified', e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm">仅显示已验证用户</span>
                  </label>
                </div>

                <div className="flex gap-2"
                >
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" />
                    重置
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* 主内容区域 */}
          <div className="flex-1"
          >
            {/* 结果统计 */}
            <div className="flex items-center justify-between mb-4"
            >
              <p className="text-neutral-600"
              >
                找到 <span className="font-semibold">{resources.length}</span> 个符合条件的物品
                {pagination && pagination.total > 0 && (
                  <span className="ml-2 text-sm text-neutral-500"
                  >
                    (共 {pagination.total} 个)
                  </span>
                )}
              </p>
              {error && (
                <div className="text-red-600 text-sm"
                >
                  加载失败，请稍后重试
                </div>
              )}
            </div>

            {/* 加载状态 */}
            {isLoading ? (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              )}
              >
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              )}
              >
                <AnimatePresence>
                  {sortedResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      viewMode={viewMode}
                      isFavorite={favorites.includes(resource.id)}
                      onFavorite={handleFavorite}
                    />
                  ))}
                </AnimatePresence>

                {sortedResources.length === 0 && (
                  <div className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <Search className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-600 mb-2"
                    >没有找到符合条件的物品</h3>
                    <p className="text-neutral-500 mb-4"
                    >请尝试调整筛选条件或扩大搜索范围</p>
                    <button
                      onClick={resetFilters}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      重置筛选条件
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 分页 */}
            {!isLoading && resources.length > 0 && pagination && pagination.total > resources.length && (
              <div className="flex justify-center mt-8"
              >
                <div className="flex items-center gap-2"
                >
                  {
                    [...Array(Math.min(5, Math.ceil(pagination.total / pagination.limit)))].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('page', (i + 1).toString());
                          setSearchParams(params);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm transition-colors",
                          (i + 1) === pagination.page 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-white border border-neutral-200 hover:border-primary-500'
                        )}
                      >
                        {i + 1}
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 骨架屏组件
const SkeletonCard: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
      >
        <div className="flex flex-col sm:flex-row"
        >
          <div className="w-full sm:w-80 h-48 bg-neutral-200"></div>
          <div className="flex-1 p-6"
          >
            <div className="h-4 bg-neutral-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-neutral-200 rounded mb-4 w-full"></div>
            <div className="flex gap-4 mb-4"
            >
              <div className="h-3 bg-neutral-200 rounded w-16"></div>
              <div className="h-3 bg-neutral-200 rounded w-20"></div>
              <div className="h-3 bg-neutral-200 rounded w-12"></div>
            </div>
            <div className="flex justify-between items-center"
            >
              <div className="flex gap-2"
              >
                <div className="h-6 bg-neutral-200 rounded w-16"></div>
                <div className="h-6 bg-neutral-200 rounded w-16"></div>
              </div>
              <div className="h-8 bg-neutral-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
    >
      <div className="aspect-[4/3] bg-neutral-200"></div>
      <div className="p-4"
      >
        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded mb-2"></div>
        <div className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-1"
          >
            <div className="w-4 h-4 bg-neutral-200 rounded"></div>
            <div className="h-3 bg-neutral-200 rounded w-8"></div>
          </div>
          <div className="h-3 bg-neutral-200 rounded w-12"></div>
        </div>
        <div className="flex items-center justify-between"
        >
          <div className="h-4 bg-neutral-200 rounded w-16"></div>
          <div className="h-8 bg-neutral-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

export default ResourceListingPage;