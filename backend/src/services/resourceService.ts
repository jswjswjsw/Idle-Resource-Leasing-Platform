import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database'; // 统一Prisma实例
import { cache, CACHE_KEYS, CACHE_TTL } from '../config/cache';
import { AppError } from '../utils/errorHandler';

// 定义枚举类型
enum ResourceStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  UNAVAILABLE = 'UNAVAILABLE'
}

enum PriceUnit {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}

/**
 * 创建资源数据接口
 */
interface CreateResourceData {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  priceUnit: string;
  deposit?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  tags?: string[];
  specifications?: Record<string, any>;
  availableFrom?: Date;
  availableTo?: Date;
  minRentalDays?: number;
  maxRentalDays?: number;
}

/**
 * 更新资源数据接口
 */
interface UpdateResourceData {
  title?: string;
  description?: string;
  categoryId?: string;
  price?: number;
  priceUnit?: string;
  deposit?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  tags?: string[];
  specifications?: Record<string, any>;
  availableFrom?: Date;
  availableTo?: Date;
  minRentalDays?: number;
  maxRentalDays?: number;
  status?: string;
}

/**
 * 资源查询过滤器接口
 */
interface ResourceFilter {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  priceUnit?: string;
  location?: string;
  status?: string;
  ownerId?: string;
  tags?: string[];
  keyword?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // 搜索半径（公里）
}

/**
 * 分页参数接口
 */
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 资源服务类
 * 负责处理所有资源相关的业务逻辑
 */
export class ResourceService {
  /**
   * 创建资源
   * @param userId 用户ID
   * @param data 资源数据
   */
  async createResource(userId: string, data: CreateResourceData) {
    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!category) {
      throw new AppError('分类不存在', 400);
    }

    // 创建资源
    const createData: any = {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      price: data.price,
      priceUnit: data.priceUnit,
      location: data.location,
      ownerId: userId,
      status: 'AVAILABLE',
      images: JSON.stringify(data.images || []),
      tags: JSON.stringify(data.tags || [])
    };

    // 只有当latitude和longitude都存在时才添加它们
    if (data.latitude !== undefined && data.longitude !== undefined) {
      createData.latitude = data.latitude;
      createData.longitude = data.longitude;
    }

    // 添加可选字段
    if (data.deposit !== undefined) createData.deposit = data.deposit;
    if (data.availableFrom !== undefined) createData.availableFrom = data.availableFrom;
    if (data.availableTo !== undefined) createData.availableTo = data.availableTo;
    if (data.minRentalDays !== undefined) createData.minRentalDays = data.minRentalDays;
    if (data.maxRentalDays !== undefined) createData.maxRentalDays = data.maxRentalDays;

    const resource = await prisma.resource.create({
      data: createData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
            creditScore: true,
            verified: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    });

    // 清除相关缓存
    await this.clearResourceCaches();

    console.log(`资源创建成功: ${resource.id}`);
    return resource;
  }

  /**
   * 搜索资源
   * @param filter 过滤条件
   * @param pagination 分页参数
   */
  async searchResources(filter: ResourceFilter = {}, pagination: PaginationParams = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      status: filter.status || 'AVAILABLE'
    };

    // 分类过滤
    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    // 价格范围过滤
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        where.price.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.price.lte = filter.maxPrice;
      }
    }

    // 价格单位过滤
    if (filter.priceUnit) {
      where.priceUnit = filter.priceUnit;
    }

    // 位置过滤
    if (filter.location) {
      where.location = {
        contains: filter.location,
        mode: 'insensitive'
      };
    }

    // 用户过滤
    if (filter.ownerId) {
      where.ownerId = filter.ownerId;
    }

    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      where.tags = {
        hasSome: filter.tags
      };
    }

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          title: {
            contains: filter.keyword,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: filter.keyword,
            mode: 'insensitive'
          }
        },
        {
          tags: {
            hasSome: [filter.keyword]
          }
        }
      ];
    }

    // 执行查询
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              avatar: true,
              creditScore: true,
              verified: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: {
              favorites: true,
              reviews: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.resource.count({ where })
    ]);

    return {
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * 获取单个资源详情
   * @param id 资源ID
   * @param userId 当前用户ID（可选）
   */
  async getResource(id: string, userId?: string) {
    const cacheKey = `${CACHE_KEYS.RESOURCE}:${id}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
            verified: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    });

    if (!resource) {
      throw new AppError('资源不存在', 404);
    }

    // 增加浏览次数（异步执行，不阻塞响应）
    prisma.resource.update({
      where: { id },
      data: { reviewCount: { increment: 1 } }
    }).catch((error: any) => {
      console.error('更新浏览次数失败:', error);
    });

    // 添加是否收藏标识
    const result = {
      ...resource,
      isFavorited: false // 暂时设为false，后续可以通过单独查询favorites表来实现
    };

    // 缓存结果（5分钟）
    await cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * 更新资源
   * @param id 资源ID
   * @param userId 用户ID
   * @param data 更新数据
   */
  async updateResource(id: string, userId: string, data: UpdateResourceData) {
    // 验证资源所有权
    const existing = await prisma.resource.findUnique({
      where: { id },
      select: { ownerId: true, status: true }
    });

    if (!existing) {
      throw new AppError('资源不存在', 404);
    }

    if (existing.ownerId !== userId) {
      throw new AppError('无权修改该资源', 403);
    }

    // 验证分类是否存在（如果提供了分类ID）
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      });
      if (!category) {
        throw new AppError('分类不存在', 400);
      }
    }

    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date()
    };

    // 只添加存在的字段
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.priceUnit !== undefined) updateData.priceUnit = data.priceUnit;
    if (data.deposit !== undefined) updateData.deposit = data.deposit;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.availableFrom !== undefined) updateData.availableFrom = data.availableFrom;
    if (data.availableTo !== undefined) updateData.availableTo = data.availableTo;
    if (data.minRentalDays !== undefined) updateData.minRentalDays = data.minRentalDays;
    if (data.maxRentalDays !== undefined) updateData.maxRentalDays = data.maxRentalDays;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

    // 更新资源
    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
            creditScore: true,
            verified: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    });

    // 清除相关缓存
    await this.clearResourceCaches(id);

    return resource;
  }

  /**
   * 删除资源（软删除）
   * @param id 资源ID
   * @param userId 用户ID
   */
  async deleteResource(id: string, userId: string) {
    // 验证资源所有权
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { ownerId: true, status: true }
    });

    if (!resource) {
      throw new Error('资源不存在');
    }

    if (resource.ownerId !== userId) {
      throw new Error('无权限删除此资源');
    }

    if (resource.status === 'UNAVAILABLE') {
      throw new Error('资源已不可用');
    }

    // 软删除
    await prisma.resource.update({
      where: { id },
      data: {
        status: 'UNAVAILABLE'
      }
    });

    // 清除相关缓存
    await this.clearResourceCaches(id);

    return { success: true, message: '资源删除成功' };
  }

  /**
   * 获取用户资源列表
   * @param userId 用户ID
   * @param pagination 分页参数
   * @param status 资源状态过滤（可选）
   */
  async getUserResources(
    userId: string, 
    pagination: PaginationParams = {},
    status?: string
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      ownerId: userId,
      status: status || { not: 'UNAVAILABLE' }
    };

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: {
              favorites: true,
              reviews: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.resource.count({ where })
    ]);

    return {
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * 获取热门资源
   * @param limit 限制数量
   */
  async getPopularResources(limit: number = 10) {
    const cacheKey = `${CACHE_KEYS.RESOURCE}:popular:${limit}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库获取热门资源（按浏览次数和收藏数排序）
    const resources = await prisma.resource.findMany({
      where: {
        status: 'AVAILABLE'
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
            verified: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // 缓存结果（30分钟）
    await cache.set(cacheKey, resources, 1800);

    return resources;
  }

  /**
   * 获取推荐资源
   * @param userId 用户ID
   * @param limit 限制数量
   */
  async getRecommendedResources(userId: string, limit: number = 10) {
    const cacheKey = `${CACHE_KEYS.RESOURCE}:recommended:${userId}:${limit}`;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 获取用户的历史订单和收藏，用于推荐
    const userOrders = await prisma.order.findMany({
      where: { renterId: userId },
      include: {
        resource: {
          select: {
            categoryId: true,
            tags: true,
          }
        }
      },
      take: 10
    });

    const userFavorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        resource: {
          select: {
            categoryId: true,
            tags: true,
          }
        }
      },
      take: 10
    });

    // 获取用户偏好的类别
    const categoryIds = [...new Set([
      ...userOrders.map((order: any) => order.resource.categoryId),
      ...userFavorites.map((fav: any) => fav.resource.categoryId)
    ])];

    // 构建推荐查询
    const where: any = {
      status: 'AVAILABLE',
      NOT: { userId: userId }
    };

    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
            verified: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      },
      orderBy: [
        { reviewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // 缓存结果（15分钟）
    await cache.set(cacheKey, resources, 900);

    return resources;
  }

  /**
   * 获取资源分类
   */
  async getCategories() {
    const cacheKey = CACHE_KEYS.CATEGORIES;
    
    // 尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            resources: {
              where: {
                status: 'AVAILABLE'
              }
            }
          }
        }
      }
    });

    // 缓存结果（1小时）
    await cache.set(cacheKey, categories, 3600);

    return categories;
  }

  /**
   * 清除资源相关缓存
   * @param resourceId 可选的资源ID，用于清除特定资源的缓存
   */
  private async clearResourceCaches(resourceId?: string) {
    try {
      if (resourceId) {
        // 清除特定资源的缓存
        await cache.del(`${CACHE_KEYS.RESOURCE}:${resourceId}`);
      }
      
      // 清除热门资源和分类缓存
      // 注意：包含通配符的删除需要使用 delPattern 才能在 Redis 与内存降级两种实现下保持一致行为
      await cache.delPattern(`${CACHE_KEYS.RESOURCE}:popular:*`);
      await cache.delPattern(`${CACHE_KEYS.RESOURCE}:recommended:*`);
      await cache.del(CACHE_KEYS.CATEGORIES);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }


}

export const resourceService = new ResourceService();