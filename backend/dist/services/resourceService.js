"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceService = exports.ResourceService = void 0;
const database_1 = require("../config/database"); // 统一Prisma实例
const cache_1 = require("../config/cache");
const errorHandler_1 = require("../utils/errorHandler");
// 定义枚举类型
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["AVAILABLE"] = "AVAILABLE";
    ResourceStatus["RENTED"] = "RENTED";
    ResourceStatus["MAINTENANCE"] = "MAINTENANCE";
    ResourceStatus["UNAVAILABLE"] = "UNAVAILABLE";
})(ResourceStatus || (ResourceStatus = {}));
var PriceUnit;
(function (PriceUnit) {
    PriceUnit["HOUR"] = "HOUR";
    PriceUnit["DAY"] = "DAY";
    PriceUnit["WEEK"] = "WEEK";
    PriceUnit["MONTH"] = "MONTH";
})(PriceUnit || (PriceUnit = {}));
/**
 * 资源服务类
 * 负责处理所有资源相关的业务逻辑
 */
class ResourceService {
    /**
     * 创建资源
     * @param userId 用户ID
     * @param data 资源数据
     */
    async createResource(userId, data) {
        // 验证分类是否存在
        const category = await database_1.prisma.category.findUnique({
            where: { id: data.categoryId }
        });
        if (!category) {
            throw new errorHandler_1.AppError('分类不存在', 400);
        }
        // 创建资源
        const createData = {
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
        if (data.deposit !== undefined)
            createData.deposit = data.deposit;
        if (data.availableFrom !== undefined)
            createData.availableFrom = data.availableFrom;
        if (data.availableTo !== undefined)
            createData.availableTo = data.availableTo;
        if (data.minRentalDays !== undefined)
            createData.minRentalDays = data.minRentalDays;
        if (data.maxRentalDays !== undefined)
            createData.maxRentalDays = data.maxRentalDays;
        const resource = await database_1.prisma.resource.create({
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
    async searchResources(filter = {}, pagination = {}) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
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
            database_1.prisma.resource.findMany({
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
            database_1.prisma.resource.count({ where })
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
    async getResource(id, userId) {
        const cacheKey = `${cache_1.CACHE_KEYS.RESOURCE}:${id}`;
        // 尝试从缓存获取
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const resource = await database_1.prisma.resource.findUnique({
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
            throw new errorHandler_1.AppError('资源不存在', 404);
        }
        // 增加浏览次数（异步执行，不阻塞响应）
        database_1.prisma.resource.update({
            where: { id },
            data: { reviewCount: { increment: 1 } }
        }).catch((error) => {
            console.error('更新浏览次数失败:', error);
        });
        // 添加是否收藏标识
        const result = {
            ...resource,
            isFavorited: false // 暂时设为false，后续可以通过单独查询favorites表来实现
        };
        // 缓存结果（5分钟）
        await cache_1.cache.set(cacheKey, result, 300);
        return result;
    }
    /**
     * 更新资源
     * @param id 资源ID
     * @param userId 用户ID
     * @param data 更新数据
     */
    async updateResource(id, userId, data) {
        // 验证资源所有权
        const existing = await database_1.prisma.resource.findUnique({
            where: { id },
            select: { ownerId: true, status: true }
        });
        if (!existing) {
            throw new errorHandler_1.AppError('资源不存在', 404);
        }
        if (existing.ownerId !== userId) {
            throw new errorHandler_1.AppError('无权修改该资源', 403);
        }
        // 验证分类是否存在（如果提供了分类ID）
        if (data.categoryId) {
            const category = await database_1.prisma.category.findUnique({
                where: { id: data.categoryId }
            });
            if (!category) {
                throw new errorHandler_1.AppError('分类不存在', 400);
            }
        }
        // 准备更新数据
        const updateData = {
            updatedAt: new Date()
        };
        // 只添加存在的字段
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.categoryId !== undefined)
            updateData.categoryId = data.categoryId;
        if (data.price !== undefined)
            updateData.price = data.price;
        if (data.priceUnit !== undefined)
            updateData.priceUnit = data.priceUnit;
        if (data.deposit !== undefined)
            updateData.deposit = data.deposit;
        if (data.location !== undefined)
            updateData.location = data.location;
        if (data.latitude !== undefined)
            updateData.latitude = data.latitude;
        if (data.longitude !== undefined)
            updateData.longitude = data.longitude;
        if (data.availableFrom !== undefined)
            updateData.availableFrom = data.availableFrom;
        if (data.availableTo !== undefined)
            updateData.availableTo = data.availableTo;
        if (data.minRentalDays !== undefined)
            updateData.minRentalDays = data.minRentalDays;
        if (data.maxRentalDays !== undefined)
            updateData.maxRentalDays = data.maxRentalDays;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.images !== undefined)
            updateData.images = JSON.stringify(data.images);
        if (data.tags !== undefined)
            updateData.tags = JSON.stringify(data.tags);
        // 更新资源
        const resource = await database_1.prisma.resource.update({
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
    async deleteResource(id, userId) {
        // 验证资源所有权
        const resource = await database_1.prisma.resource.findUnique({
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
        await database_1.prisma.resource.update({
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
    async getUserResources(userId, pagination = {}, status) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
            ownerId: userId,
            status: status || { not: 'UNAVAILABLE' }
        };
        const [resources, total] = await Promise.all([
            database_1.prisma.resource.findMany({
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
            database_1.prisma.resource.count({ where })
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
    async getPopularResources(limit = 10) {
        const cacheKey = `${cache_1.CACHE_KEYS.RESOURCE}:popular:${limit}`;
        // 尝试从缓存获取
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        // 从数据库获取热门资源（按浏览次数和收藏数排序）
        const resources = await database_1.prisma.resource.findMany({
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
        await cache_1.cache.set(cacheKey, resources, 1800);
        return resources;
    }
    /**
     * 获取推荐资源
     * @param userId 用户ID
     * @param limit 限制数量
     */
    async getRecommendedResources(userId, limit = 10) {
        const cacheKey = `${cache_1.CACHE_KEYS.RESOURCE}:recommended:${userId}:${limit}`;
        // 尝试从缓存获取
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        // 获取用户的历史订单和收藏，用于推荐
        const userOrders = await database_1.prisma.order.findMany({
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
        const userFavorites = await database_1.prisma.favorite.findMany({
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
                ...userOrders.map((order) => order.resource.categoryId),
                ...userFavorites.map((fav) => fav.resource.categoryId)
            ])];
        // 构建推荐查询
        const where = {
            status: 'AVAILABLE',
            NOT: { userId: userId }
        };
        if (categoryIds.length > 0) {
            where.categoryId = { in: categoryIds };
        }
        const resources = await database_1.prisma.resource.findMany({
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
        await cache_1.cache.set(cacheKey, resources, 900);
        return resources;
    }
    /**
     * 获取资源分类
     */
    async getCategories() {
        const cacheKey = cache_1.CACHE_KEYS.CATEGORIES;
        // 尝试从缓存获取
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const categories = await database_1.prisma.category.findMany({
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
        await cache_1.cache.set(cacheKey, categories, 3600);
        return categories;
    }
    /**
     * 清除资源相关缓存
     * @param resourceId 可选的资源ID，用于清除特定资源的缓存
     */
    async clearResourceCaches(resourceId) {
        try {
            if (resourceId) {
                // 清除特定资源的缓存
                await cache_1.cache.del(`${cache_1.CACHE_KEYS.RESOURCE}:${resourceId}`);
            }
            // 清除热门资源和分类缓存
            // 注意：包含通配符的删除需要使用 delPattern 才能在 Redis 与内存降级两种实现下保持一致行为
            await cache_1.cache.delPattern(`${cache_1.CACHE_KEYS.RESOURCE}:popular:*`);
            await cache_1.cache.delPattern(`${cache_1.CACHE_KEYS.RESOURCE}:recommended:*`);
            await cache_1.cache.del(cache_1.CACHE_KEYS.CATEGORIES);
        }
        catch (error) {
            console.error('清除缓存失败:', error);
        }
    }
}
exports.ResourceService = ResourceService;
exports.resourceService = new ResourceService();
//# sourceMappingURL=resourceService.js.map