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
    radius?: number;
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
export declare class ResourceService {
    /**
     * 创建资源
     * @param userId 用户ID
     * @param data 资源数据
     */
    createResource(userId: string, data: CreateResourceData): Promise<{
        category: {
            id: string;
            name: string;
            icon: string | null;
        };
        owner: {
            id: string;
            username: string;
            avatar: string | null;
            creditScore: number;
            verified: boolean;
        };
        _count: {
            favorites: number;
            reviews: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        categoryId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        priceUnit: string;
        images: string;
        location: string;
        latitude: number;
        longitude: number;
        status: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        reviewCount: number;
        tags: string | null;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
    }>;
    /**
     * 搜索资源
     * @param filter 过滤条件
     * @param pagination 分页参数
     */
    searchResources(filter?: ResourceFilter, pagination?: PaginationParams): Promise<{
        resources: ({
            category: {
                id: string;
                name: string;
                icon: string | null;
            };
            owner: {
                id: string;
                username: string;
                avatar: string | null;
                creditScore: number;
                verified: boolean;
            };
            _count: {
                favorites: number;
                reviews: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /**
     * 获取单个资源详情
     * @param id 资源ID
     * @param userId 当前用户ID（可选）
     */
    getResource(id: string, userId?: string): Promise<any>;
    /**
     * 更新资源
     * @param id 资源ID
     * @param userId 用户ID
     * @param data 更新数据
     */
    updateResource(id: string, userId: string, data: UpdateResourceData): Promise<{
        category: {
            id: string;
            name: string;
            icon: string | null;
        };
        owner: {
            id: string;
            username: string;
            avatar: string | null;
            creditScore: number;
            verified: boolean;
        };
        _count: {
            favorites: number;
            reviews: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        categoryId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        priceUnit: string;
        images: string;
        location: string;
        latitude: number;
        longitude: number;
        status: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        reviewCount: number;
        tags: string | null;
        ownerId: string;
        deposit: import("@prisma/client/runtime/library").Decimal;
    }>;
    /**
     * 删除资源（软删除）
     * @param id 资源ID
     * @param userId 用户ID
     */
    deleteResource(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 获取用户资源列表
     * @param userId 用户ID
     * @param pagination 分页参数
     * @param status 资源状态过滤（可选）
     */
    getUserResources(userId: string, pagination?: PaginationParams, status?: string): Promise<{
        resources: ({
            category: {
                id: string;
                name: string;
                icon: string | null;
            };
            _count: {
                favorites: number;
                reviews: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            priceUnit: string;
            images: string;
            location: string;
            latitude: number;
            longitude: number;
            status: string;
            rating: import("@prisma/client/runtime/library").Decimal;
            reviewCount: number;
            tags: string | null;
            ownerId: string;
            deposit: import("@prisma/client/runtime/library").Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /**
     * 获取热门资源
     * @param limit 限制数量
     */
    getPopularResources(limit?: number): Promise<any>;
    /**
     * 获取推荐资源
     * @param userId 用户ID
     * @param limit 限制数量
     */
    getRecommendedResources(userId: string, limit?: number): Promise<any>;
    /**
     * 获取资源分类
     */
    getCategories(): Promise<any>;
    /**
     * 清除资源相关缓存
     * @param resourceId 可选的资源ID，用于清除特定资源的缓存
     */
    private clearResourceCaches;
}
export declare const resourceService: ResourceService;
export {};
//# sourceMappingURL=resourceService.d.ts.map